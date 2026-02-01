import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebsetCell } from '../entities/webset-cell.entity';
import { Webset } from '../entities/webset.entity';

@Processor('enrichment')
@Injectable()
export class EnrichmentProcessor extends WorkerHost {
  private readonly logger = new Logger(EnrichmentProcessor.name);

  constructor(
    @InjectRepository(WebsetCell)
    private cellRepository: Repository<WebsetCell>,
    @InjectRepository(Webset)
    private websetRepository: Repository<Webset>,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing enrichment job ${job.id}`);

    const { websetId, column, rows, prompt, llmProviderId, searchProviderId, userId } =
      job.data;

    const webset = await this.websetRepository.findOne({
      where: { id: websetId },
    });

    if (!webset) {
      throw new Error(`Webset with ID ${websetId} not found`);
    }

    const totalRows = rows.length;
    const enrichedCells = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const existingCell = await this.cellRepository.findOne({
          where: { websetId, row, column },
        });

        const enrichedValue = await this.enrichCell(
          webset,
          row,
          column,
          prompt,
          llmProviderId,
          searchProviderId,
        );

        if (existingCell) {
          existingCell.value = enrichedValue.value;
          existingCell.confidenceScore = enrichedValue.confidenceScore;
          existingCell.metadata = {
            ...existingCell.metadata,
            enrichedAt: new Date().toISOString(),
            llmProviderId,
            searchProviderId,
            prompt,
          };
          await this.cellRepository.save(existingCell);
          enrichedCells.push(existingCell);
        } else {
          const newCell = this.cellRepository.create({
            websetId,
            row,
            column,
            value: enrichedValue.value,
            confidenceScore: enrichedValue.confidenceScore,
            metadata: {
              enrichedAt: new Date().toISOString(),
              llmProviderId,
              searchProviderId,
              prompt,
            },
          });
          const savedCell = await this.cellRepository.save(newCell);
          enrichedCells.push(savedCell);
        }

        await job.updateProgress((i + 1) / totalRows * 100);
      } catch (error) {
        this.logger.error(`Error enriching cell at row ${row}: ${error.message}`);
      }
    }

    return { enrichedCells: enrichedCells.length, totalRows };
  }

  private async enrichCell(
    webset: Webset,
    row: number,
    column: string,
    prompt: string,
    llmProviderId?: string,
    searchProviderId?: string,
  ): Promise<{ value: string; confidenceScore: number }> {
    const cells = await this.cellRepository.find({
      where: { websetId: webset.id, row },
    });

    const rowData: Record<string, string> = {};
    cells.forEach((cell) => {
      rowData[cell.column] = cell.value || '';
    });

    let searchResults = [];
    if (searchProviderId) {
      searchResults = await this.performSearch(rowData, prompt);
    }

    const llmResponse = await this.callLLM(rowData, prompt, searchResults, llmProviderId);

    return {
      value: llmResponse,
      confidenceScore: 0.8,
    };
  }

  private async performSearch(
    rowData: Record<string, string>,
    prompt: string,
  ): Promise<any[]> {
    return [];
  }

  private async callLLM(
    rowData: Record<string, string>,
    prompt: string,
    searchResults: any[],
    llmProviderId?: string,
  ): Promise<string> {
    const contextString = Object.entries(rowData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const searchContext = searchResults.length > 0
      ? `\n\nSearch Results:\n${searchResults.map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`).join('\n')}`
      : '';

    return `Enriched value for: ${contextString}${searchContext}`;
  }
}
