import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bullmq';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webset } from '../entities/webset.entity';
import { WebsetCell } from '../entities/webset-cell.entity';
import { WebsetCitation } from '../entities/webset-citation.entity';
import { LLMProvidersService } from '../providers/llm/llm-providers.service';
import { SearchProvidersService } from '../providers/search/search-providers.service';
import { EnrichmentGateway } from './enrichment.gateway';

export interface AgentAssignment {
  agentId: string;
  assignedRows: number[];
  startTime: Date;
  status: 'idle' | 'working' | 'failed';
}

export interface AgentHealth {
  agentId: string;
  lastHeartbeat: Date;
  status: 'online' | 'offline' | 'unresponsive';
  workload: number;
  capabilities: string[];
}

@Injectable()
@Processor('agent-manager')
export class AgentManagerService implements OnModuleInit {
  private readonly logger = new Logger(AgentManagerService.name);
  
  private agents: Map<string, AgentAssignment> = new Map();
  private agentHealth: Map<string, AgentHealth> = new Map();
  private redis: Redis;

  constructor(
    @InjectQueue('enrichment') private enrichmentQueue: Queue,
    @InjectRepository(Webset) private websetRepository: Repository<Webset>,
    @InjectRepository(WebsetCell) private cellRepository: Repository<WebsetCell>,
    @InjectRepository(WebsetCitation) private citationRepository: Repository<WebsetCitation>,
    private llmProvidersService: LLMProvidersService,
    private searchProvidersService: SearchProvidersService,
    private enrichmentGateway: EnrichmentGateway,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    });
  }

  async onModuleInit() {
    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Assigns work to available agents based on load balancing
   */
  async assignWorkToAgents(
    websetId: string,
    rows: number[],
    column: string,
    prompt: string,
    llmProviderId: string,
    searchProviderId: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Assigning ${rows.length} rows to agents for webset ${websetId}`);

    // Get available agents
    const availableAgents = this.getAvailableAgents();
    
    if (availableAgents.length === 0) {
      // If no agents available, fall back to direct queue assignment
      this.logger.warn('No agents available, falling back to direct queue assignment');
      await this.fallbackToDirectAssignment(
        websetId,
        rows,
        column,
        prompt,
        llmProviderId,
        searchProviderId,
        userId,
      );
      return;
    }

    // Distribute rows among available agents
    const rowsPerAgent = Math.ceil(rows.length / availableAgents.length);
    let rowIndex = 0;

    for (const agentId of availableAgents) {
      const agentRows = rows.slice(rowIndex, rowIndex + rowsPerAgent);
      if (agentRows.length === 0) break;

      // Create a job for this agent
      await this.enrichmentQueue.add(
        'agent-work',
        {
          agentId,
          websetId,
          rows: agentRows,
          column,
          prompt,
          llmProviderId,
          searchProviderId,
          userId,
        },
        {
          jobId: `agent-${agentId}-work-${Date.now()}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      // Update agent assignment
      this.agents.set(agentId, {
        agentId,
        assignedRows: agentRows,
        startTime: new Date(),
        status: 'working',
      });

      rowIndex += rowsPerAgent;
    }
  }

  /**
   * Gets list of currently available agents
   */
  private getAvailableAgents(): string[] {
    const available: string[] = [];
    
    for (const [agentId, health] of this.agentHealth.entries()) {
      if (health.status === 'online' && health.workload < 5) { // Max 5 concurrent tasks per agent
        available.push(agentId);
      }
    }
    
    return available;
  }

  /**
   * Registers a new agent with the manager
   */
  async registerAgent(agentId: string, capabilities: string[]): Promise<void> {
    this.logger.log(`Registering agent ${agentId} with capabilities: ${capabilities.join(', ')}`);

    // If agent already exists, update its capabilities
    if (this.agentHealth.has(agentId)) {
      const existingHealth = this.agentHealth.get(agentId)!;
      existingHealth.capabilities = capabilities;
      existingHealth.lastHeartbeat = new Date();
      existingHealth.status = 'online';
      this.agentHealth.set(agentId, existingHealth);
    } else {
      this.agentHealth.set(agentId, {
        agentId,
        lastHeartbeat: new Date(),
        status: 'online',
        workload: 0,
        capabilities,
      });

      this.agents.set(agentId, {
        agentId,
        assignedRows: [],
        startTime: new Date(),
        status: 'idle',
      });
    }
  }

  /**
   * Updates agent heartbeat to show it's alive
   */
  async updateAgentHeartbeat(agentId: string): Promise<void> {
    const health = this.agentHealth.get(agentId);
    if (health) {
      health.lastHeartbeat = new Date();
      health.status = 'online';
      this.agentHealth.set(agentId, health);
    }
  }

  /**
   * Reports agent workload
   */
  async reportAgentWorkload(agentId: string, workload: number): Promise<void> {
    const health = this.agentHealth.get(agentId);
    if (health) {
      health.workload = workload;
      this.agentHealth.set(agentId, health);
    }
  }

  /**
   * Starts health monitoring for agents
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      const now = new Date();
      const timeoutThreshold = new Date(now.getTime() - 30000); // 30 seconds timeout

      for (const [agentId, health] of this.agentHealth.entries()) {
        if (health.lastHeartbeat < timeoutThreshold) {
          health.status = 'unresponsive';
          this.logger.warn(`Agent ${agentId} is unresponsive`);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Fallback to direct queue assignment when no agents are available
   */
  private async fallbackToDirectAssignment(
    websetId: string,
    rows: number[],
    column: string,
    prompt: string,
    llmProviderId: string,
    searchProviderId: string,
    userId: string,
  ): Promise<void> {
    // Create individual jobs for each row to enable parallel processing
    for (const rowIdx of rows) {
      await this.enrichmentQueue.add(
        'enrich-cell-single',
        {
          websetId,
          row: rowIdx,
          column,
          prompt,
          llmProviderId,
          searchProviderId,
          userId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    }
  }

  /**
   * Gets agent status information
   */
  getAgentStatus(): AgentHealth[] {
    return Array.from(this.agentHealth.values());
  }

  /**
   * Gets assignment information
   */
  getAgentAssignments(): AgentAssignment[] {
    return Array.from(this.agents.values());
  }
}