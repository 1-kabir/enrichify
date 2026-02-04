import { Injectable, Logger } from '@nestjs/common';
import { LLMProvidersService } from '../providers/llm/llm-providers.service';
import { AgentManagerService } from './agent-manager.service';
import { Webset } from '../entities/webset.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface TaskAssignment {
  taskId: string;
  agentId: string;
  taskType: 'search' | 'extraction' | 'verification' | 'aggregation';
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number; // in seconds
  payload: any;
}

export interface OrchestrationDecision {
  assignments: TaskAssignment[];
  strategy: 'parallel' | 'sequential' | 'hybrid';
  confidence: number;
}

@Injectable()
export class OrchestrationService {
  private readonly logger = new Logger(OrchestrationService.name);

  constructor(
    private llmProvidersService: LLMProvidersService,
    private agentManagerService: AgentManagerService,
    @InjectRepository(Webset) private websetRepository: Repository<Webset>,
  ) {}

  /**
   * Makes orchestration decisions for a given enrichment task
   */
  async orchestrateTask(
    websetId: string,
    column: string,
    prompt: string,
    llmProviderId: string,
    searchProviderId: string,
    userId: string,
    rows: number[],
  ): Promise<OrchestrationDecision> {
    this.logger.log(`Orchestrating task for webset ${websetId}, column ${column}`);

    // Get webset context
    const webset = await this.websetRepository.findOne({
      where: { id: websetId },
    });

    if (!webset) {
      throw new Error(`Webset with ID ${websetId} not found`);
    }

    // Get available agents
    const agentStatus = this.agentManagerService.getAgentStatus();
    const availableAgents = agentStatus.filter(agent => agent.status === 'online');

    if (availableAgents.length === 0) {
      this.logger.warn('No available agents, falling back to single-threaded processing');
      return {
        assignments: [],
        strategy: 'sequential',
        confidence: 0.5,
      };
    }

    // Use LLM to determine optimal orchestration strategy
    const orchestrationPrompt = `
      You are an AI Task Orchestration Expert.
      
      Task: Enrich column "${column}" in webset "${webset.name}"
      Prompt: "${prompt}"
      Available Agents: ${availableAgents.length}
      Rows to Process: ${rows.length}
      Webset Context: ${JSON.stringify(webset.columnDefinitions)}
      
      Determine the optimal orchestration strategy considering:
      1. Task complexity and type
      2. Number of available agents
      3. Expected processing time
      4. Resource utilization
      
      Respond with a JSON object:
      {
        "strategy": "parallel|sequential|hybrid",
        "confidence": 0.0-1.0,
        "reasoning": "brief explanation"
      }
    `;

    try {
      const response = await this.llmProvidersService.makeRequest(llmProviderId, {
        messages: [{ role: 'system', content: orchestrationPrompt }],
        temperature: 0.2,
      }, userId);

      let decision: any = null;
      try {
        // Extract JSON from response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          decision = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        this.logger.warn(`Failed to parse orchestration decision: ${parseError.message}`);
      }

      // Default to parallel if parsing fails
      if (!decision || !decision.strategy) {
        decision = {
          strategy: rows.length > 5 ? 'parallel' : 'sequential',
          confidence: 0.7,
          reasoning: 'Default strategy based on row count',
        };
      }

      // Generate task assignments based on strategy
      const assignments = await this.generateTaskAssignments(
        websetId,
        column,
        prompt,
        llmProviderId,
        searchProviderId,
        userId,
        rows,
        availableAgents,
        decision.strategy,
      );

      return {
        assignments,
        strategy: decision.strategy,
        confidence: decision.confidence || 0.7,
      };
    } catch (error) {
      this.logger.error(`Orchestration failed: ${error.message}`);
      // Fallback to simple parallel assignment
      const assignments = await this.generateSimpleParallelAssignments(
        websetId,
        column,
        prompt,
        llmProviderId,
        searchProviderId,
        userId,
        rows,
        availableAgents,
      );

      return {
        assignments,
        strategy: 'parallel',
        confidence: 0.5,
      };
    }
  }

  /**
   * Generates task assignments based on the orchestration strategy
   */
  private async generateTaskAssignments(
    websetId: string,
    column: string,
    prompt: string,
    llmProviderId: string,
    searchProviderId: string,
    userId: string,
    rows: number[],
    availableAgents: any[],
    strategy: string,
  ): Promise<TaskAssignment[]> {
    switch (strategy) {
      case 'parallel':
        return this.generateIntelligentParallelAssignments(
          websetId,
          column,
          prompt,
          llmProviderId,
          searchProviderId,
          userId,
          rows,
          availableAgents,
        );
      case 'hybrid':
        return this.generateHybridAssignments(
          websetId,
          column,
          prompt,
          llmProviderId,
          searchProviderId,
          userId,
          rows,
          availableAgents,
        );
      default: // sequential
        return [];
    }
  }

  /**
   * Generates intelligent parallel assignments based on agent capabilities and workload
   */
  private async generateIntelligentParallelAssignments(
    websetId: string,
    column: string,
    prompt: string,
    llmProviderId: string,
    searchProviderId: string,
    userId: string,
    rows: number[],
    availableAgents: any[],
  ): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];

    // Sort agents by their workload (ascending) to balance the load
    const sortedAgents = [...availableAgents].sort((a, b) => a.workload - b.workload);

    // Calculate base assignment size
    const rowsPerAgentBase = Math.floor(rows.length / sortedAgents.length);
    const remainder = rows.length % sortedAgents.length;

    let currentIndex = 0;
    for (let i = 0; i < sortedAgents.length; i++) {
      const agent = sortedAgents[i];

      // Assign base amount plus one extra for agents handling remainder
      const agentRowCount = rowsPerAgentBase + (i < remainder ? 1 : 0);
      const agentRows = rows.slice(currentIndex, currentIndex + agentRowCount);

      if (agentRows.length > 0) {
        assignments.push({
          taskId: `task-${Date.now()}-${i}`,
          agentId: agent.agentId,
          taskType: 'extraction',
          priority: this.calculatePriority(prompt, agentRows.length),
          estimatedDuration: this.estimateDuration(agentRows.length, 'extraction'),
          payload: {
            websetId,
            rows: agentRows,
            column,
            prompt,
            llmProviderId,
            searchProviderId,
            userId,
          },
        });

        currentIndex += agentRowCount;
      }
    }

    return assignments;
  }

  /**
   * Calculates task priority based on complexity and urgency
   */
  private calculatePriority(prompt: string, rowCount: number): 'low' | 'medium' | 'high' {
    // Higher priority for more complex tasks or larger batches
    const complexityFactors = [
      'urgent',
      'critical',
      'important',
      'complex',
      'difficult',
      'challenging',
    ];

    const isComplex = complexityFactors.some(factor =>
      prompt.toLowerCase().includes(factor)
    );

    if (isComplex || rowCount > 20) {
      return 'high';
    } else if (rowCount > 5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Estimates duration based on task type and size
   */
  private estimateDuration(rowCount: number, taskType: string): number {
    let baseTimePerRow: number;

    switch (taskType) {
      case 'search':
        baseTimePerRow = 3; // 3 seconds per row for search
        break;
      case 'extraction':
        baseTimePerRow = 8; // 8 seconds per row for extraction
        break;
      case 'verification':
        baseTimePerRow = 5; // 5 seconds per row for verification
        break;
      case 'aggregation':
        baseTimePerRow = 10; // 10 seconds per row for aggregation
        break;
      default:
        baseTimePerRow = 8; // default to extraction time
    }

    return rowCount * baseTimePerRow;
  }

  /**
   * Generates simple parallel assignments
   */
  private async generateSimpleParallelAssignments(
    websetId: string,
    column: string,
    prompt: string,
    llmProviderId: string,
    searchProviderId: string,
    userId: string,
    rows: number[],
    availableAgents: any[],
  ): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];
    const rowsPerAgent = Math.ceil(rows.length / availableAgents.length);

    for (let i = 0; i < availableAgents.length; i++) {
      const agent = availableAgents[i];
      const startIndex = i * rowsPerAgent;
      const endIndex = Math.min(startIndex + rowsPerAgent, rows.length);
      const agentRows = rows.slice(startIndex, endIndex);

      if (agentRows.length > 0) {
        assignments.push({
          taskId: `task-${Date.now()}-${i}`,
          agentId: agent.agentId,
          taskType: 'extraction',
          priority: 'medium',
          estimatedDuration: agentRows.length * 10, // estimate 10s per row
          payload: {
            websetId,
            rows: agentRows,
            column,
            prompt,
            llmProviderId,
            searchProviderId,
            userId,
          },
        });
      }
    }

    return assignments;
  }

  /**
   * Generates hybrid assignments (search + extraction + verification phases)
   */
  private async generateHybridAssignments(
    websetId: string,
    column: string,
    prompt: string,
    llmProviderId: string,
    searchProviderId: string,
    userId: string,
    rows: number[],
    availableAgents: any[],
  ): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];

    // Phase 1: Search tasks (assign to capable agents)
    const searchAgents = availableAgents.filter(agent => 
      agent.capabilities.includes('search') || agent.capabilities.includes('all')
    ).slice(0, Math.min(2, availableAgents.length)); // Limit search agents
    
    if (searchAgents.length > 0) {
      const rowsPerSearchAgent = Math.ceil(rows.length / searchAgents.length);
      
      for (let i = 0; i < searchAgents.length; i++) {
        const agent = searchAgents[i];
        const startIndex = i * rowsPerSearchAgent;
        const endIndex = Math.min(startIndex + rowsPerSearchAgent, rows.length);
        const agentRows = rows.slice(startIndex, endIndex);

        if (agentRows.length > 0) {
          assignments.push({
            taskId: `search-task-${Date.now()}-${i}`,
            agentId: agent.agentId,
            taskType: 'search',
            priority: 'high',
            estimatedDuration: agentRows.length * 5, // search is faster
            payload: {
              websetId,
              rows: agentRows,
              column,
              prompt,
              searchProviderId,
              userId,
            },
          });
        }
      }
    }

    // Phase 2: Extraction tasks (assign to remaining agents)
    const extractionAgents = availableAgents.filter(agent => 
      agent.capabilities.includes('extraction') || agent.capabilities.includes('all')
    );
    
    if (extractionAgents.length > 0) {
      const rowsPerExtractionAgent = Math.ceil(rows.length / extractionAgents.length);
      
      for (let i = 0; i < extractionAgents.length; i++) {
        const agent = extractionAgents[i];
        const startIndex = i * rowsPerExtractionAgent;
        const endIndex = Math.min(startIndex + rowsPerExtractionAgent, rows.length);
        const agentRows = rows.slice(startIndex, endIndex);

        if (agentRows.length > 0) {
          assignments.push({
            taskId: `extract-task-${Date.now()}-${i}`,
            agentId: agent.agentId,
            taskType: 'extraction',
            priority: 'high',
            estimatedDuration: agentRows.length * 15, // extraction is slower
            payload: {
              websetId,
              rows: agentRows,
              column,
              prompt,
              llmProviderId,
              userId,
            },
          });
        }
      }
    }

    // Phase 3: Verification tasks (assign to verification-capable agents)
    const verificationAgents = availableAgents.filter(agent => 
      agent.capabilities.includes('verification') || agent.capabilities.includes('all')
    );
    
    if (verificationAgents.length > 0) {
      // Assign verification to a subset of rows initially
      const verificationRows = rows.filter((_, idx) => idx % 3 === 0); // Verify every 3rd row initially
      
      if (verificationRows.length > 0) {
        const rowsPerVerificationAgent = Math.ceil(verificationRows.length / verificationAgents.length);
        
        for (let i = 0; i < verificationAgents.length; i++) {
          const agent = verificationAgents[i];
          const startIndex = i * rowsPerVerificationAgent;
          const endIndex = Math.min(startIndex + rowsPerVerificationAgent, verificationRows.length);
          const agentRows = verificationRows.slice(startIndex, endIndex);

          if (agentRows.length > 0) {
            assignments.push({
              taskId: `verify-task-${Date.now()}-${i}`,
              agentId: agent.agentId,
              taskType: 'verification',
              priority: 'medium',
              estimatedDuration: agentRows.length * 8, // verification takes time
              payload: {
                websetId,
                rows: agentRows,
                column,
                prompt,
                llmProviderId,
                userId,
              },
            });
          }
        }
      }
    }

    return assignments;
  }

  /**
   * Assigns tasks to agents based on the orchestration decision
   */
  async assignTasks(assignments: TaskAssignment[]): Promise<void> {
    for (const assignment of assignments) {
      // Register the task with the agent manager
      await this.agentManagerService.registerAgent(assignment.agentId, ['all']);
      
      // In a real implementation, this would send the task to the specific agent
      // For now, we'll add it to the queue for the agent to pick up
      this.logger.log(`Assigned task ${assignment.taskId} to agent ${assignment.agentId}`);
    }
  }
}