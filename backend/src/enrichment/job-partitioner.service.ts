import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EnrichCellDto } from './dto/enrich-cell.dto';

export interface PartitionConfig {
  maxChunkSize: number;
  minChunkSize: number;
  maxConcurrency: number;
}

@Injectable()
export class JobPartitionerService {
  private readonly logger = new Logger(JobPartitionerService.name);

  constructor(@InjectQueue('enrichment') private enrichmentQueue: Queue) {}

  async partitionJob(
    enrichCellDto: EnrichCellDto,
    userId: string,
    config: PartitionConfig = {
      maxChunkSize: 10,
      minChunkSize: 1,
      maxConcurrency: 5,
    },
  ): Promise<{ jobId: string }> {
    const { rows, ...rest } = enrichCellDto;
    const totalRows = rows.length;

    // Determine optimal chunk size based on total rows and max concurrency
    let chunkSize = Math.ceil(totalRows / config.maxConcurrency);
    if (chunkSize > config.maxChunkSize) {
      chunkSize = config.maxChunkSize;
    } else if (chunkSize < config.minChunkSize) {
      chunkSize = config.minChunkSize;
    }

    // Split rows into chunks
    const chunks: number[][] = [];
    for (let i = 0; i < rows.length; i += chunkSize) {
      chunks.push(rows.slice(i, i + chunkSize));
    }

    this.logger.log(
      `Partitioning ${totalRows} rows into ${chunks.length} chunks of size ~${chunkSize}`,
    );

    // Create a parent job that manages the overall progress
    const parentJob = await this.enrichmentQueue.add(
      'enrich-cells-batch-parent',
      {
        ...rest,
        userId,
        totalRows,
        chunkCount: chunks.length,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    // Create individual jobs for each chunk to enable parallel processing
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      await this.enrichmentQueue.add(
        'enrich-cell-chunk',
        {
          ...rest,
          rows: chunk,
          userId,
          parentJobId: parentJob.id,
          chunkIndex: i,
          totalChunks: chunks.length,
        },
        {
          parent: {
            id: parentJob.id,
            queue: 'enrichment',
          },
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    }

    return { jobId: parentJob.id };
  }

  /**
   * Determines the optimal partitioning strategy based on job characteristics
   */
  determineOptimalPartitioning(totalRows: number): PartitionConfig {
    // For smaller jobs, use smaller chunks and lower concurrency
    if (totalRows <= 10) {
      return {
        maxChunkSize: 3,
        minChunkSize: 1,
        maxConcurrency: 2,
      };
    }
    
    // For medium jobs, use moderate chunks and concurrency
    if (totalRows <= 50) {
      return {
        maxChunkSize: 8,
        minChunkSize: 2,
        maxConcurrency: 4,
      };
    }
    
    // For larger jobs, use larger chunks and higher concurrency
    return {
      maxChunkSize: 15,
      minChunkSize: 3,
      maxConcurrency: 8,
    };
  }
}