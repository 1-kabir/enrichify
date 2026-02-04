import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { AgentManagerService } from './agent-manager.service';

export interface FailureRecord {
  jobId: string;
  agentId?: string;
  failureType: 'agent_timeout' | 'api_error' | 'processing_error' | 'connection_lost';
  timestamp: Date;
  details: string;
  retryCount: number;
  status: 'pending' | 'retrying' | 'failed' | 'recovered';
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  threshold: number;
}

@Injectable()
export class ResilienceService {
  private readonly logger = new Logger(ResilienceService.name);
  private failureRecords: Map<string, FailureRecord> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map(); // Per provider/agent
  private redis: Redis;

  constructor(
    @InjectQueue('enrichment') private enrichmentQueue: Queue,
    private agentManagerService: AgentManagerService,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    });

    // Start periodic cleanup and monitoring
    this.startMonitoring();
  }

  /**
   * Records a failure and initiates recovery procedures
   */
  async recordFailure(
    jobId: string,
    failureType: FailureRecord['failureType'],
    details: string,
    agentId?: string,
  ): Promise<void> {
    this.logger.warn(`Recording failure for job ${jobId}: ${failureType} - ${details}`);

    const record: FailureRecord = {
      jobId,
      agentId,
      failureType,
      timestamp: new Date(),
      details,
      retryCount: 0,
      status: 'pending',
    };

    this.failureRecords.set(jobId, record);

    // Update circuit breaker if this is an agent or provider failure
    if (agentId) {
      await this.updateCircuitBreaker(agentId, failureType);
    }

    // Initiate recovery based on failure type
    await this.initiateRecovery(record);
  }

  /**
   * Initiates recovery procedures based on failure type
   */
  private async initiateRecovery(record: FailureRecord): Promise<void> {
    switch (record.failureType) {
      case 'agent_timeout':
        await this.handleAgentTimeout(record);
        break;
      case 'api_error':
        await this.handleApiError(record);
        break;
      case 'processing_error':
        await this.handleProcessingError(record);
        break;
      case 'connection_lost':
        await this.handleConnectionLost(record);
        break;
      default:
        this.logger.warn(`Unknown failure type: ${record.failureType}`);
    }
  }

  /**
   * Handles agent timeout failures
   */
  private async handleAgentTimeout(record: FailureRecord): Promise<void> {
    this.logger.log(`Handling agent timeout for job ${record.jobId}`);

    if (record.agentId) {
      // Mark agent as potentially unhealthy
      await this.agentManagerService.reportAgentWorkload(record.agentId, 0);
      
      // Attempt to reassign the work to another agent
      await this.reassignJobToDifferentAgent(record);
    }
  }

  /**
   * Handles API errors (LLM/Search provider errors)
   */
  private async handleApiError(record: FailureRecord): Promise<void> {
    this.logger.log(`Handling API error for job ${record.jobId}`);

    // The circuit breaker should already be updated by updateCircuitBreaker
    // Just schedule a retry with exponential backoff
    await this.scheduleRetry(record, this.calculateExponentialBackoff(record.retryCount));
  }

  /**
   * Handles processing errors
   */
  private async handleProcessingError(record: FailureRecord): Promise<void> {
    this.logger.log(`Handling processing error for job ${record.jobId}`);

    // Retry with different parameters or agent
    await this.scheduleRetry(record, this.calculateExponentialBackoff(record.retryCount));
  }

  /**
   * Handles connection lost errors
   */
  private async handleConnectionLost(record: FailureRecord): Promise<void> {
    this.logger.log(`Handling connection lost for job ${record.jobId}`);

    // Wait for connection to be restored, then retry
    setTimeout(async () => {
      await this.scheduleRetry(record, 5000); // Retry after 5 seconds
    }, 5000);
  }

  /**
   * Updates the circuit breaker state for a provider/agent
   */
  private async updateCircuitBreaker(targetId: string, failureType: FailureRecord['failureType']): Promise<void> {
    let state = this.circuitBreakers.get(targetId);

    if (!state) {
      state = {
        state: 'closed',
        failureCount: 0,
        threshold: 5, // Allow 5 failures before opening circuit
      };
    }

    // Increment failure count
    state.failureCount += 1;
    state.lastFailureTime = new Date();

    // Check if we should open the circuit
    if (state.failureCount >= state.threshold) {
      state.state = 'open';
      state.nextAttemptTime = new Date(Date.now() + 60000); // Try again in 1 minute
      this.logger.warn(`Circuit breaker opened for ${targetId} due to repeated failures`);
    }

    this.circuitBreakers.set(targetId, state);
  }

  /**
   * Checks if a target is available (circuit breaker closed)
   */
  async isAvailable(targetId: string): Promise<boolean> {
    const state = this.circuitBreakers.get(targetId);

    if (!state || state.state === 'closed') {
      return true;
    }

    if (state.state === 'open') {
      if (state.nextAttemptTime && state.nextAttemptTime <= new Date()) {
        // Transition to half-open to test if the issue is resolved
        state.state = 'half_open';
        this.circuitBreakers.set(targetId, state);
        return true;
      }
      return false;
    }

    // Half-open state - allow one request to test
    return true;
  }

  /**
   * Marks a target as successful (closing the circuit if in half-open state)
   */
  async onSuccess(targetId: string): Promise<void> {
    const state = this.circuitBreakers.get(targetId);

    if (state && state.state === 'half_open') {
      // Success in half-open state means we can close the circuit
      state.state = 'closed';
      state.failureCount = 0;
      this.logger.log(`Circuit breaker closed for ${targetId} after successful operation`);
    }

    this.circuitBreakers.set(targetId, state);
  }

  /**
   * Reassigns a job to a different agent
   */
  private async reassignJobToDifferentAgent(record: FailureRecord): Promise<void> {
    // Get the original job to extract its data
    const originalJob = await this.enrichmentQueue.getJob(record.jobId);
    
    if (!originalJob) {
      this.logger.error(`Original job ${record.jobId} not found for reassignment`);
      return;
    }

    // Get job data
    const jobData = originalJob.data;
    
    // Find a different agent to handle the work
    const agentStatus = this.agentManagerService.getAgentStatus();
    const availableAgents = agentStatus.filter(
      agent => agent.agentId !== record.agentId && agent.status === 'online'
    );

    if (availableAgents.length > 0) {
      // Select a random available agent
      const newAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
      
      // Create a new job with the same data but assigned to a different agent
      const newJobData = {
        ...jobData,
        agentId: newAgent.agentId, // Update agent ID
        retryOf: record.jobId, // Track that this is a retry
      };

      await this.enrichmentQueue.add(
        originalJob.name,
        newJobData,
        {
          jobId: `${record.jobId}-retry-${Date.now()}`,
          attempts: originalJob.opts.attempts ? originalJob.opts.attempts + 1 : 2,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`Reassigned job ${record.jobId} to agent ${newAgent.agentId}`);
      
      // Update the failure record
      const updatedRecord = { ...record, status: 'recovered' };
      this.failureRecords.set(record.jobId, updatedRecord);
    } else {
      this.logger.warn(`No available agents to reassign job ${record.jobId}`);
      // Schedule retry with same agent after delay
      await this.scheduleRetry(record, 30000); // 30 seconds
    }
  }

  /**
   * Schedules a retry for a failed job
   */
  private async scheduleRetry(record: FailureRecord, delay: number): Promise<void> {
    // Update retry count
    record.retryCount += 1;
    record.status = 'retrying';
    
    // If max retries exceeded, mark as failed
    if (record.retryCount > 3) {
      record.status = 'failed';
      this.logger.error(`Max retries exceeded for job ${record.jobId}`);
      return;
    }

    // Schedule retry after delay
    setTimeout(async () => {
      try {
        // Get the original job to recreate it
        const originalJob = await this.enrichmentQueue.getJob(record.jobId);
        
        if (originalJob) {
          // Recreate the job with incremented retry count
          await this.enrichmentQueue.add(
            originalJob.name,
            {
              ...originalJob.data,
              retryOf: record.jobId,
              retryCount: record.retryCount,
            },
            {
              jobId: `${record.jobId}-retry-${record.retryCount}`,
              attempts: originalJob.opts.attempts ? originalJob.opts.attempts + 1 : 2,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
            },
          );
          
          this.logger.log(`Scheduled retry ${record.retryCount} for job ${record.jobId} after ${delay}ms`);
        }
      } catch (error) {
        this.logger.error(`Failed to schedule retry for job ${record.jobId}: ${error.message}`);
      }
    }, delay);
  }

  /**
   * Calculates exponential backoff delay
   */
  private calculateExponentialBackoff(retryCount: number): number {
    // Base delay of 2 seconds with exponential increase
    return Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s, 16s, etc.
  }

  /**
   * Starts monitoring for failures and cleanup
   */
  private startMonitoring(): void {
    // Periodic cleanup of old failure records
    setInterval(() => {
      const now = new Date();
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      for (const [jobId, record] of this.failureRecords.entries()) {
        if (record.timestamp < cutoff) {
          this.failureRecords.delete(jobId);
        }
      }

      this.logger.debug(`Cleaned up ${this.failureRecords.size} failure records`);
    }, 30 * 60 * 1000); // Every 30 minutes

    // Monitor circuit breaker states
    setInterval(() => {
      for (const [targetId, state] of this.circuitBreakers.entries()) {
        if (state.state === 'open' && state.nextAttemptTime && state.nextAttemptTime <= new Date()) {
          // Transition to half-open to test recovery
          state.state = 'half_open';
          this.logger.log(`Circuit breaker for ${targetId} transitioning to half-open for testing`);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Gets failure statistics
   */
  getFailureStats(): {
    totalFailures: number;
    byType: Record<string, number>;
    recentFailures: FailureRecord[];
  } {
    const stats: Record<string, number> = {};
    const recentFailures: FailureRecord[] = [];
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const record of this.failureRecords.values()) {
      // Count by type
      stats[record.failureType] = (stats[record.failureType] || 0) + 1;
      
      // Track recent failures
      if (record.timestamp >= oneHourAgo) {
        recentFailures.push(record);
      }
    }
    
    return {
      totalFailures: this.failureRecords.size,
      byType: stats,
      recentFailures,
    };
  }

  /**
   * Force resets a circuit breaker
   */
  async resetCircuitBreaker(targetId: string): Promise<void> {
    const state = this.circuitBreakers.get(targetId);
    
    if (state) {
      state.state = 'closed';
      state.failureCount = 0;
      this.logger.log(`Manually reset circuit breaker for ${targetId}`);
    }
  }
}