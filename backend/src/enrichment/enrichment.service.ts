import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Webset } from '../entities/webset.entity';
import { WebsetCell } from '../entities/webset-cell.entity';
import { EnrichCellDto } from './dto/enrich-cell.dto';
import { JobPartitionerService } from './job-partitioner.service';

@Injectable()
export class EnrichmentService {
  constructor(
    @InjectRepository(Webset)
    private websetRepository: Repository<Webset>,
    @InjectRepository(WebsetCell)
    private cellRepository: Repository<WebsetCell>,
    @InjectQueue('enrichment')
    private enrichmentQueue: Queue,
    private jobPartitionerService: JobPartitionerService,
  ) {}

  async enrichCells(enrichCellDto: EnrichCellDto, userId: string): Promise<{ jobId: string }> {
    const webset = await this.websetRepository.findOne({
      where: { id: enrichCellDto.websetId },
    });

    if (!webset) {
      throw new NotFoundException(`Webset with ID ${enrichCellDto.websetId} not found`);
    }

    if (webset.userId !== userId) {
      throw new BadRequestException('You do not have access to this webset');
    }

    const columnExists = webset.columnDefinitions.some(
      (col) => col.id === enrichCellDto.column,
    );

    if (!columnExists) {
      throw new BadRequestException(
        `Column ${enrichCellDto.column} does not exist in webset`,
      );
    }

    // Use the JobPartitioner to split large jobs across multiple agents
    const partitionConfig = this.jobPartitionerService.determineOptimalPartitioning(enrichCellDto.rows.length);
    const result = await this.jobPartitionerService.partitionJob(enrichCellDto, userId, partitionConfig);

    return result;
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.enrichmentQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      jobId: job.id,
      state,
      progress,
      result: returnValue,
      error: failedReason,
    };
  }
}
