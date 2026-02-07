import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebsetCell } from '../entities/webset-cell.entity';
import { Webset } from '../entities/webset.entity';
import { Redis } from 'ioredis';

export interface LockInfo {
  lockId: string;
  resource: string;
  holder: string;
  acquiredAt: Date;
  expiresAt: Date;
}

export interface ConflictResolutionResult {
  success: boolean;
  resolvedValue: any;
  conflicts: string[];
  resolutionNotes: string;
}

@Injectable()
export class DataIntegrityService {
  private readonly logger = new Logger(DataIntegrityService.name);
  private redis: Redis;
  private locks: Map<string, LockInfo> = new Map();

  constructor(
    @InjectRepository(WebsetCell) private cellRepository: Repository<WebsetCell>,
    @InjectRepository(Webset) private websetRepository: Repository<Webset>,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    });
  }

  /**
   * Acquires a distributed lock for a specific resource
   */
  async acquireLock(resource: string, holder: string, ttl: number = 30): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    const lockValue = `${holder}:${Date.now()}`;
    const result = await this.redis.set(lockKey, lockValue, 'EX', ttl, 'NX');
    
    if (result === 'OK') {
      this.logger.log(`Lock acquired for ${resource} by ${holder}`);
      
      // Store lock info locally too
      this.locks.set(resource, {
        lockId: lockValue,
        resource,
        holder,
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + ttl * 1000),
      });
      
      return true;
    }
    
    this.logger.warn(`Failed to acquire lock for ${resource}, already held`);
    return false;
  }

  /**
   * Releases a distributed lock
   */
  async releaseLock(resource: string, holder: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    const lockInfo = this.locks.get(resource);
    
    if (!lockInfo) {
      this.logger.warn(`No lock found for ${resource}`);
      return false;
    }
    
    // Only allow the lock holder to release the lock
    if (lockInfo.holder !== holder) {
      this.logger.warn(`Holder ${holder} cannot release lock owned by ${lockInfo.holder}`);
      return false;
    }
    
    // Use Lua script to ensure atomicity
    const luaScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(luaScript, 1, lockKey, lockInfo.lockId);
    
    if (result === 1) {
      this.locks.delete(resource);
      this.logger.log(`Lock released for ${resource} by ${holder}`);
      return true;
    }
    
    this.logger.warn(`Failed to release lock for ${resource}, may have expired`);
    return false;
  }

  /**
   * Checks if a resource is currently locked
   */
  async isLocked(resource: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    const lockValue = await this.redis.get(lockKey);
    return lockValue !== null;
  }

  /**
   * Implements optimistic locking for cell updates
   */
  async updateCellWithOptimisticLock(
    websetId: string,
    row: number,
    column: string,
    newValue: any,
    expectedVersion?: number,
  ): Promise<boolean> {
    // Try to acquire a lock for this specific cell
    const resource = `cell:${websetId}:${row}:${column}`;
    const holder = `worker:${process.pid}`;
    
    if (!(await this.acquireLock(resource, holder, 10))) { // 10 second TTL
      this.logger.warn(`Could not acquire lock for ${resource}, skipping update`);
      return false;
    }
    
    try {
      // Get current cell
      let cell = await this.cellRepository.findOne({
        where: { websetId, row, column },
      });
      
      // If cell doesn't exist, create it
      if (!cell) {
        cell = this.cellRepository.create({
          websetId,
          row,
          column,
          value: newValue,
        });
        await this.cellRepository.save(cell);
        return true;
      }
      
      // If using version checking, verify it hasn't changed
      if (expectedVersion !== undefined && cell.versionId !== String(expectedVersion)) {
        this.logger.warn(`Cell version mismatch for ${resource}, expected ${expectedVersion}, got ${cell.versionId}`);
        return false;
      }
      
      // Update the cell
      cell.value = newValue;
      cell.updatedAt = new Date();
      
      // If we have versioning, increment it
      if ('version' in cell) {
        (cell as any).version = (cell as any).version ? (cell as any).version + 1 : 1;
      }
      
      await this.cellRepository.save(cell);
      this.logger.log(`Updated cell ${resource} successfully`);
      return true;
    } finally {
      // Always release the lock
      await this.releaseLock(resource, holder);
    }
  }

  /**
   * Performs deduplication check before saving
   */
  async checkForDuplicates(
    websetId: string,
    row: number,
    column: string,
    value: any,
  ): Promise<boolean> {
    // Check if a similar value already exists for this cell
    const existingCell = await this.cellRepository.findOne({
      where: { websetId, row, column },
    });
    
    if (!existingCell) {
      return false; // No duplicate since cell doesn't exist
    }
    
    // Compare values (implement your comparison logic here)
    // For simplicity, we'll do a strict equality check
    return existingCell.value === value;
  }

  /**
   * Resolves conflicts when multiple agents try to update the same data
   */
  async resolveConflict(
    websetId: string,
    row: number,
    column: string,
    proposedValue: any,
    currentValue: any,
    conflictContext: any = {},
  ): Promise<ConflictResolutionResult> {
    this.logger.log(`Resolving conflict for cell ${websetId}:${row}:${column}`);
    
    // Simple conflict resolution strategy: if proposed value is different from current,
    // and we have confidence scores, use the higher confidence one
    if (conflictContext.proposedConfidence && conflictContext.currentConfidence) {
      if (conflictContext.proposedConfidence > conflictContext.currentConfidence) {
        return {
          success: true,
          resolvedValue: proposedValue,
          conflicts: [`Conflicting values: current="${currentValue}", proposed="${proposedValue}". Chose proposed due to higher confidence (${conflictContext.proposedConfidence} > ${conflictContext.currentConfidence})`],
          resolutionNotes: 'Used confidence-based resolution',
        };
      } else {
        return {
          success: true,
          resolvedValue: currentValue,
          conflicts: [`Conflicting values: current="${currentValue}", proposed="${proposedValue}". Kept current due to higher confidence (${conflictContext.currentConfidence} > ${conflictContext.proposedConfidence})`],
          resolutionNotes: 'Used confidence-based resolution',
        };
      }
    }
    
    // If no confidence scores, use a merge strategy for objects or arrays
    if (typeof proposedValue === 'object' && typeof currentValue === 'object') {
      // Deep merge objects
      const mergedValue = this.deepMerge(currentValue, proposedValue);
      return {
        success: true,
        resolvedValue: mergedValue,
        conflicts: [`Merged objects: current and proposed`],
        resolutionNotes: 'Deep merged conflicting objects',
      };
    }
    
    // Default: keep current value
    return {
      success: true,
      resolvedValue: currentValue,
      conflicts: [`Unresolved conflict: current="${currentValue}", proposed="${proposedValue}". Kept current value.`],
      resolutionNotes: 'Default conflict resolution kept current value',
    };
  }

  /**
   * Performs data consistency validation
   */
  async validateDataConsistency(websetId: string): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Get all cells for this webset
    const cells = await this.cellRepository.find({
      where: { websetId },
    });
    
    // Check for orphaned cells (cells pointing to non-existent websets)
    const webset = await this.websetRepository.findOne({
      where: { id: websetId },
    });
    
    if (!webset) {
      issues.push(`Webset ${websetId} does not exist but has associated cells`);
      return { isValid: false, issues };
    }
    
    // Check for invalid column references
    const validColumns = webset.columnDefinitions.map(col => col.id);
    for (const cell of cells) {
      if (!validColumns.includes(cell.column)) {
        issues.push(`Cell ${cell.id} references invalid column ${cell.column}`);
      }
    }
    
    // Check for data type consistency if specified in column definitions
    for (const cell of cells) {
      const columnDef = webset.columnDefinitions.find(col => col.id === cell.column);
      if (columnDef && columnDef.type) {
        const dataTypeValid = this.validateDataType(cell.value, columnDef.type);
        if (!dataTypeValid) {
          issues.push(`Cell ${cell.id} has value of type ${typeof cell.value} but column expects ${columnDef.type}`);
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validates data type compliance
   */
  private validateDataType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof value === 'string' && emailRegex.test(value);
      default:
        return true; // Skip validation for unknown types
    }
  }

  /**
   * Performs deep merge of objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof result[key] === 'object' &&
          result[key] !== null &&
          !Array.isArray(result[key])
        ) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Cleans up expired locks
   */
  async cleanupExpiredLocks(): Promise<number> {
    let cleanedCount = 0;
    
    for (const [resource, lockInfo] of this.locks.entries()) {
      if (lockInfo.expiresAt < new Date()) {
        // Lock has expired, remove it
        const lockKey = `lock:${resource}`;
        await this.redis.del(lockKey);
        this.locks.delete(resource);
        cleanedCount++;
        this.logger.log(`Cleaned up expired lock for ${resource}`);
      }
    }
    
    return cleanedCount;
  }

  /**
   * Gets current lock status
   */
  getLockStatus(): { resource: string; holder: string; timeRemaining: number }[] {
    const now = new Date();
    const status = [];
    
    for (const [resource, lockInfo] of this.locks.entries()) {
      const timeRemaining = Math.max(0, lockInfo.expiresAt.getTime() - now.getTime());
      status.push({
        resource: lockInfo.resource,
        holder: lockInfo.holder,
        timeRemaining,
      });
    }
    
    return status;
  }
}