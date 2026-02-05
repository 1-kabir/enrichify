import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
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

  async pauseJob(jobId: string, userId: string): Promise<void> {
    const job = await this.enrichmentQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Check if user owns the job or is an admin
    const webset = await this.websetRepository.findOne({
      where: { id: job.data.websetId },
    });

    if (!webset || webset.userId !== userId) {
      throw new ForbiddenException('You do not have permission to control this job');
    }

    // Check if job can be paused
    const state = await job.getState();
    if (state !== 'active' && state !== 'waiting' && state !== 'delayed') {
      throw new BadRequestException(`Job cannot be paused in state: ${state}`);
    }

    await job.pause();
  }

  async resumeJob(jobId: string, userId: string): Promise<void> {
    const job = await this.enrichmentQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Check if user owns the job or is an admin
    const webset = await this.websetRepository.findOne({
      where: { id: job.data.websetId },
    });

    if (!webset || webset.userId !== userId) {
      throw new ForbiddenException('You do not have permission to control this job');
    }

    // Check if job can be resumed
    const state = await job.getState();
    if (state !== 'paused') {
      throw new BadRequestException(`Job cannot be resumed in state: ${state}`);
    }

    await job.resume();
  }

  async stopJob(jobId: string, userId: string): Promise<void> {
    const job = await this.enrichmentQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Check if user owns the job or is an admin
    const webset = await this.websetRepository.findOne({
      where: { id: job.data.websetId },
    });

    if (!webset || webset.userId !== userId) {
      throw new ForbiddenException('You do not have permission to control this job');
    }

    // Check if job can be stopped
    const state = await job.getState();
    if (state === 'completed' || state === 'failed' || state === 'removed') {
      throw new BadRequestException(`Job cannot be stopped in state: ${state}`);
    }

    await job.remove();
  }
}
