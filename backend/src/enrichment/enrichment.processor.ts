import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebsetCell } from '../entities/webset-cell.entity';
import { Webset } from '../entities/webset.entity';
import { WebsetCitation } from '../entities/webset-citation.entity';
import { LLMProvidersService } from '../providers/llm/llm-providers.service';
import { SearchProvidersService } from '../providers/search/search-providers.service';

import { EnrichmentGateway } from './enrichment.gateway';

@Processor('enrichment')
@Injectable()
export class EnrichmentProcessor extends WorkerHost {
    private readonly logger = new Logger(EnrichmentProcessor.name);

    constructor(
        @InjectRepository(WebsetCell)
        private cellRepository: Repository<WebsetCell>,
        @InjectRepository(Webset)
        private websetRepository: Repository<Webset>,
        @InjectRepository(WebsetCitation)
        private citationRepository: Repository<WebsetCitation>,
        private llmProvidersService: LLMProvidersService,
        private searchProvidersService: SearchProvidersService,
        private enrichmentGateway: EnrichmentGateway,
    ) {
        super();
    }

    async process(job: Job): Promise<any> {
        this.logger.log(`Processing enrichment job ${job.id}`);

        const { websetId, column, rows, prompt, llmProviderId, searchProviderId, userId } = job.data;

        const webset = await this.websetRepository.findOne({
            where: { id: websetId },
        });

        if (!webset) {
            throw new Error(`Webset with ID ${websetId} not found`);
        }

        const totalRows = rows.length;
        let completedCount = 0;

        for (const rowIdx of rows) {
            try {
                const result = await this.enrichCellWithSwarm(
                    webset,
                    rowIdx,
                    column,
                    prompt,
                    llmProviderId,
                    searchProviderId,
                    userId,
                );

                // Save or update cell
                let cell = await this.cellRepository.findOne({
                    where: { websetId, row: rowIdx, column },
                });

                if (!cell) {
                    cell = this.cellRepository.create({
                        websetId,
                        row: rowIdx,
                        column,
                    });
                }

                cell.value = result.value;
                cell.confidenceScore = result.confidenceScore;
                cell.metadata = {
                    ...cell.metadata,
                    enrichedAt: new Date().toISOString(),
                    llmProviderId,
                    searchProviderId,
                    originalPrompt: prompt,
                };

                const savedCell = await this.cellRepository.save(cell);

                // Emit real-time update
                this.enrichmentGateway.sendCellUpdate(websetId, savedCell);

                // Save citations
                if (result.citations && result.citations.length > 0) {
                    // Clear old citations for this cell
                    await this.citationRepository.delete({ cellId: savedCell.id });

                    const citations = result.citations.map(c => this.citationRepository.create({
                        cellId: savedCell.id,
                        url: c.url,
                        title: c.title,
                        contentSnippet: c.snippet,
                        searchProviderId,
                    }));
                    await this.citationRepository.save(citations);
                }

                completedCount++;
                const progress = (completedCount / totalRows) * 100;
                await job.updateProgress(progress);
                this.enrichmentGateway.sendProgress(websetId, {
                    jobId: job.id,
                    progress,
                    completedCount,
                    totalRows,
                    status: 'running',
                });
            } catch (error) {
                this.logger.error(`Error enriching row ${rowIdx}: ${error.message}`);
            }
        }

        this.enrichmentGateway.sendProgress(websetId, {
            jobId: job.id,
            progress: 100,
            completedCount,
            totalRows,
            status: 'completed',
        });

        return { enrichedRows: completedCount, totalRows };
    }

    private async enrichCellWithSwarm(
        webset: Webset,
        row: number,
        column: string,
        userPrompt: string,
        llmId: string,
        searchId: string,
        userId: string,
    ): Promise<{ value: string; confidenceScore: number; citations: any[] }> {
        // 1. Get current row context
        const existingCells = await this.cellRepository.find({
            where: { websetId: webset.id, row },
        });
        const rowContext = existingCells.reduce((acc, cell) => {
            acc[cell.column] = cell.value;
            return acc;
        }, {});

        // 2. Planning: Generate search queries
        const planningPrompt = `
      You are an AI Search Orchestrator. 
      Task: Enriched the column "${column}" for a dataset.
      Context of the current row: ${JSON.stringify(rowContext)}
      User Goal: ${userPrompt}
      
      Based on the context and goal, generate 2-3 specific search queries that would help find the most accurate information for the "${column}" field.
      Return ONLY a JSON array of strings. Example: ["YC founders Series C list", "Acme Corp funding series"]
    `;

        const planningResponse = await this.llmProvidersService.makeRequest(llmId, {
            messages: [{ role: 'system', content: planningPrompt }],
            temperature: 0.3,
        }, userId);

        let queries: string[] = [];
        try {
            // Basic JSON extraction from LLM response
            const jsonMatch = planningResponse.content.match(/\[.*\]/s);
            queries = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch (e) {
            queries = [userPrompt + " " + (rowContext['company'] || '')];
        }

        // 3. Search Loop
        let allResults: any[] = [];
        for (const query of queries.slice(0, 2)) {
            const searchResponse = await this.searchProvidersService.search(searchId, {
                query,
                numResults: 5,
            }, userId);
            allResults = [...allResults, ...searchResponse.results];
        }

        // 4. Extraction & Verification
        const extractionPrompt = `
      You are a Data Extraction Agent.
      Target Field: "${column}"
      Row Context: ${JSON.stringify(rowContext)}
      User Instructions: ${userPrompt}
      
      Search Results:
      ${allResults.map((r, i) => `[${i}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`).join('\n\n')}
      
      Extract the best value for "${column}". 
      Also provide a confidence score (0.0 to 1.0) and specify which result indices [0, 1, etc.] you used as primary sources.
      
      Return ONLY JSON in this format:
      {
        "value": "extracted value",
        "confidence": 0.95,
        "sourceIndices": [0, 2]
      }
    `;

        const extractionResponse = await this.llmProvidersService.makeRequest(llmId, {
            messages: [{ role: 'system', content: extractionPrompt }],
            temperature: 0.1,
        }, userId);

        try {
            const jsonMatch = extractionResponse.content.match(/\{.*\}/s);
            const data = JSON.parse(jsonMatch[0]);

            const citations = (data.sourceIndices || []).map(idx => allResults[idx]).filter(Boolean);

            return {
                value: data.value,
                confidenceScore: data.confidence || 0.5,
                citations: citations,
            };
        } catch (e) {
            return {
                value: extractionResponse.content,
                confidenceScore: 0.3,
                citations: allResults.slice(0, 2),
            };
        }
    }
}
