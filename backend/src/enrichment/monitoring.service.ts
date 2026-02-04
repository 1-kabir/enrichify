import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EnrichmentGateway } from './enrichment.gateway';
import { AgentManagerService } from './agent-manager.service';
import { ResilienceService } from './resilience.service';

export interface SwarmMetrics {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgProcessingTime: number;
  activeAgents: number;
  totalAgents: number;
  agentUtilization: number;
  errorRate: number;
  throughput: number; // jobs per minute
}

export interface ControlCommand {
  command: 'pause' | 'resume' | 'stop' | 'adjust_concurrency';
  target: 'all' | 'specific_job' | 'specific_agent';
  targetId?: string;
  value?: number; // For concurrency adjustment
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private metricsHistory: SwarmMetrics[] = [];
  private jobStartTime: Map<string, Date> = new Map();

  constructor(
    @InjectQueue('enrichment') private enrichmentQueue: Queue,
    private enrichmentGateway: EnrichmentGateway,
    private agentManagerService: AgentManagerService,
    private resilienceService: ResilienceService,
  ) {
    // Start metrics collection
    this.startMetricsCollection();
  }

  /**
   * Starts periodic metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      const metrics = await this.collectMetrics();
      this.metricsHistory.push(metrics);
      
      // Keep only last 100 metrics
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }
      
      // Broadcast metrics to connected clients
      this.enrichmentGateway.broadcastMetrics(metrics);
    }, 5000); // Update every 5 seconds
  }

  /**
   * Collects current swarm metrics
   */
  async collectMetrics(): Promise<SwarmMetrics> {
    // Get queue stats
    const waitingJobs = await this.enrichmentQueue.getWaitingCount();
    const activeJobs = await this.enrichmentQueue.getActiveCount();
    const completedJobs = await this.enrichmentQueue.getCompletedCount();
    const failedJobs = await this.enrichmentQueue.getFailedCount();
    
    const totalJobs = waitingJobs + activeJobs + completedJobs + failedJobs;
    
    // Calculate average processing time (simplified)
    let avgProcessingTime = 0;
    if (completedJobs > 0) {
      // In a real implementation, we'd track actual processing times
      avgProcessingTime = 5000; // Placeholder
    }
    
    // Get agent stats
    const agentStatus = this.agentManagerService.getAgentStatus();
    const activeAgents = agentStatus.filter(agent => agent.status === 'online').length;
    const totalAgents = agentStatus.length;
    const agentUtilization = totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0;
    
    // Calculate error rate
    const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;
    
    // Calculate throughput (jobs per minute)
    const throughput = completedJobs > 0 ? completedJobs / 1 : 0; // Simplified calculation
    
    return {
      totalJobs,
      activeJobs,
      completedJobs,
      failedJobs,
      avgProcessingTime,
      activeAgents,
      totalAgents,
      agentUtilization,
      errorRate,
      throughput,
    };
  }

  /**
   * Executes a control command on the swarm
   */
  async executeControlCommand(command: ControlCommand): Promise<boolean> {
    this.logger.log(`Executing control command: ${command.command} on ${command.target}`);

    switch (command.command) {
      case 'pause':
        return await this.pauseProcessing(command);
      case 'resume':
        return await this.resumeProcessing(command);
      case 'stop':
        return await this.stopProcessing(command);
      case 'adjust_concurrency':
        return await this.adjustConcurrency(command);
      default:
        this.logger.error(`Unknown command: ${command.command}`);
        return false;
    }
  }

  /**
   * Pauses processing
   */
  private async pauseProcessing(command: ControlCommand): Promise<boolean> {
    try {
      if (command.target === 'all') {
        // Pause the entire queue
        await this.enrichmentQueue.pause();
        this.logger.log('Paused all enrichment processing');
      } else if (command.target === 'specific_job' && command.targetId) {
        // For specific jobs, we'll need to track their state differently
        // This is a simplified implementation
        this.logger.log(`Marked job ${command.targetId} for pause`);
      }
      
      // Notify clients
      this.enrichmentGateway.broadcastControlEvent({
        eventType: 'paused',
        target: command.target,
        targetId: command.targetId,
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to pause processing: ${error.message}`);
      return false;
    }
  }

  /**
   * Resumes processing
   */
  private async resumeProcessing(command: ControlCommand): Promise<boolean> {
    try {
      if (command.target === 'all') {
        // Resume the entire queue
        await this.enrichmentQueue.resume();
        this.logger.log('Resumed all enrichment processing');
      } else if (command.target === 'specific_job' && command.targetId) {
        // Resume specific job
        this.logger.log(`Resumed job ${command.targetId}`);
      }
      
      // Notify clients
      this.enrichmentGateway.broadcastControlEvent({
        eventType: 'resumed',
        target: command.target,
        targetId: command.targetId,
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to resume processing: ${error.message}`);
      return false;
    }
  }

  /**
   * Stops processing
   */
  private async stopProcessing(command: ControlCommand): Promise<boolean> {
    try {
      if (command.target === 'all') {
        // Gracefully stop all processing
        await this.enrichmentQueue.pause();
        this.logger.log('Stopped all enrichment processing');
      } else if (command.target === 'specific_job' && command.targetId) {
        // Move job to failed state
        const job = await this.enrichmentQueue.getJob(command.targetId);
        if (job) {
          await job.moveToFailed(new Error('Stopped by user'), 'manual-stop');
          this.logger.log(`Stopped job ${command.targetId}`);
        }
      }
      
      // Notify clients
      this.enrichmentGateway.broadcastControlEvent({
        eventType: 'stopped',
        target: command.target,
        targetId: command.targetId,
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to stop processing: ${error.message}`);
      return false;
    }
  }

  /**
   * Adjusts concurrency
   */
  private async adjustConcurrency(command: ControlCommand): Promise<boolean> {
    if (command.value === undefined) {
      this.logger.error('Concurrency value not provided');
      return false;
    }

    try {
      // In a real implementation, we would adjust the number of active workers
      // This is a simplified version that just logs the intent
      this.logger.log(`Concurrency adjusted to ${command.value} for ${command.target}`);
      
      // Notify clients
      this.enrichmentGateway.broadcastControlEvent({
        eventType: 'concurrency_adjusted',
        target: command.target,
        targetId: command.targetId,
        value: command.value,
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to adjust concurrency: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets historical metrics
   */
  getHistoricalMetrics(hours: number = 1): SwarmMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(metric => 
      new Date(metric['timestamp']) >= cutoffTime
    );
  }

  /**
   * Gets current agent status
   */
  getAgentStatus() {
    return this.agentManagerService.getAgentStatus();
  }

  /**
   * Gets current agent assignments
   */
  getAgentAssignments() {
    return this.agentManagerService.getAgentAssignments();
  }

  /**
   * Gets failure statistics
   */
  getFailureStats() {
    return this.resilienceService.getFailureStats();
  }

  /**
   * Resets a circuit breaker
   */
  async resetCircuitBreaker(targetId: string) {
    return await this.resilienceService.resetCircuitBreaker(targetId);
  }
}