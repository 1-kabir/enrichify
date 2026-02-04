import { Injectable, Logger } from '@nestjs/common';
import { LLMProvidersService } from '../providers/llm/llm-providers.service';
import { SearchProvidersService } from '../providers/search/search-providers.service';

export interface ExecutionPlan {
    name: string;
    description: string;
    columnDefinitions: Array<{
        id: string;
        name: string;
        type: 'text' | 'url' | 'email' | 'number' | 'boolean';
        description: string;
    }>;
    estimatedResults: number;
    searchStrategy: string;
    steps: string[];
}

@Injectable()
export class PlanningService {
    private readonly logger = new Logger(PlanningService.name);

    constructor(
        private llmService: LLMProvidersService,
        private searchService: SearchProvidersService,
    ) { }

    async generatePlan(prompt: string, userId: string, llmProviderId?: string): Promise<ExecutionPlan> {
        this.logger.log(`Generating plan for prompt: ${prompt}`);

        const systemPrompt = `
      You are an expert Data Engineer and AI Orchestrator. 
      The user wants to create a "Webset" (a dynamic collection of enriched data).
      Your task is to decompose their natural language request into a structured execution plan.

      User Request: "${prompt}"

      Return a JSON object with the following schema:
      {
        "name": "Short descriptive name for the webset",
        "description": "Clear explanation of what this webset will contain",
        "columnDefinitions": [
          { "id": "snake_case_id", "name": "Human Name", "type": "text|url|email|number|boolean", "description": "What this column stores" }
        ],
        "estimatedResults": 10,
        "searchStrategy": "How the agents will find this data",
        "steps": ["Step 1...", "Step 2..."]
      }

      Ensure column ids are unique and types are valid. 
      Suggest at least 3 relevant columns for any generic request.
    `;

        try {
            // Find the first active provider if none specified
            let providerId = llmProviderId;
            if (!providerId) {
                const providers = await this.llmService.findAll();
                const active = providers.find(p => p.isActive);
                if (!active) throw new Error("No active LLM providers found");
                providerId = active.id;
            }

            const response = await this.llmService.makeRequest(providerId, {
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
                temperature: 0.2,
            }, userId);

            // Extract JSON from response
            const jsonStr = response.content.match(/\{[\s\S]*\}/)?.[0];
            if (!jsonStr) throw new Error("Failed to parse plan from LLM response");

            return JSON.parse(jsonStr) as ExecutionPlan;
        } catch (error) {
            this.logger.error(`Plan generation failed: ${error.message}`);
            throw error;
        }
    }
}
