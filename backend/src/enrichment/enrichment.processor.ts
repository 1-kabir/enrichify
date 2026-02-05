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
import { WebsetsService } from '../websets/websets.service';

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
        private websetsService: WebsetsService,
        private enrichmentGateway: EnrichmentGateway,
    ) {
        super();
    }

    async process(job: Job): Promise<any> {
        switch (job.name) {
            case 'enrich-cells-parent':
                return this.processParentJob(job);
            case 'enrich-cells-batch-parent':
                return this.processBatchParentJob(job);
            case 'enrich-cell-single':
                return this.processSingleRowJob(job);
            case 'enrich-cell-chunk':
                return this.processChunkJob(job);
            case 'agent-work':
                return this.processAgentWorkJob(job);
            default:
                throw new Error(`Unknown job type: ${job.name}`);
        }
    }

    private async processParentJob(job: Job): Promise<any> {
        const { websetId, totalRows, userId } = job.data;

        this.logger.log(`Processing parent enrichment job ${job.id} for ${totalRows} rows`);

        // Wait for all child jobs to complete
        const children = await job.getChildren();

        // Monitor progress of child jobs
        let completedCount = 0;
        const progressInterval = setInterval(async () => {
            const completedChildren = children.filter(child => child.isCompleted());
            const currentProgress = Math.floor((completedChildren.length / totalRows) * 100);

            if (currentProgress > job.progress) {
                await job.updateProgress(currentProgress);

                this.enrichmentGateway.sendProgress(websetId, {
                    jobId: job.id,
                    progress: currentProgress,
                    completedCount: completedChildren.length,
                    totalRows,
                    status: 'running',
                });
            }

            if (completedChildren.length >= totalRows) {
                clearInterval(progressInterval);

                this.enrichmentGateway.sendProgress(websetId, {
                    jobId: job.id,
                    progress: 100,
                    completedCount: totalRows,
                    totalRows,
                    status: 'completed',
                });

                // Create a snapshot after job completion
                try {
                    await this.websetsService.createSnapshot(websetId, userId, `Enrichment job completed: ${job.id}`);
                } catch (error) {
                    this.logger.error(`Failed to create snapshot after enrichment job ${job.id}: ${error.message}`);
                }
            }
        }, 1000); // Update progress every second

        // Wait for all children to complete
        await job.waitUntilFinished();

        clearInterval(progressInterval);

        return { enrichedRows: totalRows, totalRows };
    }

    private async processBatchParentJob(job: Job): Promise<any> {
        const { websetId, totalRows, chunkCount, userId } = job.data;

        this.logger.log(`Processing batch parent enrichment job ${job.id} for ${totalRows} rows in ${chunkCount} chunks`);

        // Monitor progress of child jobs
        const progressInterval = setInterval(async () => {
            const children = await job.getChildren();
            const completedChildren = children.filter(child => child.isCompleted());
            const currentProgress = Math.floor((completedChildren.length / chunkCount) * 100);

            if (currentProgress > job.progress) {
                await job.updateProgress(currentProgress);

                this.enrichmentGateway.sendProgress(websetId, {
                    jobId: job.id,
                    progress: currentProgress,
                    completedCount: completedChildren.length * (totalRows / chunkCount), // Approximate
                    totalRows,
                    status: 'running',
                });
            }

            if (completedChildren.length >= chunkCount) {
                clearInterval(progressInterval);

                this.enrichmentGateway.sendProgress(websetId, {
                    jobId: job.id,
                    progress: 100,
                    completedCount: totalRows,
                    totalRows,
                    status: 'completed',
                });

                // Create a snapshot after job completion
                try {
                    await this.websetsService.createSnapshot(websetId, userId, `Batch enrichment job completed: ${job.id}`);
                } catch (error) {
                    this.logger.error(`Failed to create snapshot after batch enrichment job ${job.id}: ${error.message}`);
                }
            }
        }, 1000); // Update progress every second

        // Wait for all children to complete
        await job.waitUntilFinished();

        clearInterval(progressInterval);

        return { enrichedRows: totalRows, totalRows, chunksProcessed: chunkCount };
    }

    private async processSingleRowJob(job: Job): Promise<any> {
        const {
            websetId,
            row,
            column,
            prompt,
            llmProviderId,
            searchProviderId,
            userId,
            parentJobId
        } = job.data;

        const webset = await this.websetRepository.findOne({
            where: { id: websetId },
        });

        if (!webset) {
            throw new Error(`Webset with ID ${websetId} not found`);
        }

        try {
            const result = await this.enrichCellWithSwarm(
                webset,
                row,
                column,
                prompt,
                llmProviderId,
                searchProviderId,
                userId,
            );

            // Save or update cell
            let cell = await this.cellRepository.findOne({
                where: { websetId, row, column },
            });

            if (!cell) {
                cell = this.cellRepository.create({
                    websetId,
                    row,
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

            return { success: true, cellId: savedCell.id };
        } catch (error) {
            this.logger.error(`Error enriching row ${row}: ${error.message}`);
            throw error;
        }
    }

    private async processChunkJob(job: Job): Promise<any> {
        const {
            websetId,
            rows,
            column,
            prompt,
            llmProviderId,
            searchProviderId,
            userId,
            parentJobId,
            chunkIndex,
            totalChunks
        } = job.data;

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

                // Update job progress
                const progress = (completedCount / totalRows) * 100;
                await job.updateProgress(progress);
            } catch (error) {
                this.logger.error(`Error enriching row ${rowIdx} in chunk ${chunkIndex}: ${error.message}`);
            }
        }

        return {
            success: true,
            chunkIndex,
            totalChunks,
            enrichedRows: completedCount,
            totalRows
        };
    }

    private async processAgentWorkJob(job: Job): Promise<any> {
        const {
            agentId,
            websetId,
            rows,
            column,
            prompt,
            llmProviderId,
            searchProviderId,
            userId,
        } = job.data;

        this.logger.log(`Agent ${agentId} processing ${rows.length} rows for webset ${websetId}`);

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
                    agentId,
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
            } catch (error) {
                this.logger.error(`Error enriching row ${rowIdx} with agent ${agentId}: ${error.message}`);
            }
        }

        this.logger.log(`Agent ${agentId} completed ${completedCount}/${totalRows} rows for webset ${websetId}`);

        // Create a snapshot after job completion
        try {
            await this.websetsService.createSnapshot(websetId, userId, `Agent work job completed: ${job.id}`);
        } catch (error) {
            this.logger.error(`Failed to create snapshot after agent work job ${job.id}: ${error.message}`);
        }

        return {
            success: true,
            agentId,
            enrichedRows: completedCount,
            totalRows
        };
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
