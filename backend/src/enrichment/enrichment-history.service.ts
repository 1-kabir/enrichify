import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnrichmentJobHistory, EnrichmentJobStatus } from '../entities/enrichment-job-history.entity';
import { Webset } from '../entities/webset.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class EnrichmentHistoryService {
  private readonly logger = new Logger(EnrichmentHistoryService.name);

  constructor(
    @InjectRepository(EnrichmentJobHistory)
    private enrichmentJobHistoryRepository: Repository<EnrichmentJobHistory>,
    @InjectRepository(Webset)
    private websetRepository: Repository<Webset>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createJobRecord(
    websetId: string,
    userId: string,
    jobId: string,
    parameters: Record<string, any>,
  ): Promise<EnrichmentJobHistory> {
    const jobRecord = this.enrichmentJobHistoryRepository.create({
      websetId,
      userId,
      jobId,
      status: EnrichmentJobStatus.PENDING,
      parameters,
      startTime: new Date(),
    });

    return this.enrichmentJobHistoryRepository.save(jobRecord);
  }

  async updateJobStatus(
    jobId: string,
    status: EnrichmentJobStatus,
    summary?: Record<string, any>,
    errorMessage?: string,
  ): Promise<EnrichmentJobHistory> {
    const jobRecord = await this.enrichmentJobHistoryRepository.findOne({
      where: { jobId },
    });

    if (!jobRecord) {
      throw new Error(`Job record with ID ${jobId} not found`);
    }

    jobRecord.status = status;
    jobRecord.summary = summary || jobRecord.summary;
    jobRecord.errorMessage = errorMessage;
    jobRecord.endTime = new Date();
    
    // Calculate duration if both start and end times are available
    if (jobRecord.startTime && jobRecord.endTime) {
      jobRecord.durationSeconds = (jobRecord.endTime.getTime() - jobRecord.startTime.getTime()) / 1000;
    }

    return this.enrichmentJobHistoryRepository.save(jobRecord);
  }

  async updateJobProgress(
    jobId: string,
    totalRows?: number,
    processedRows?: number,
    failedRows?: number,
  ): Promise<EnrichmentJobHistory> {
    const jobRecord = await this.enrichmentJobHistoryRepository.findOne({
      where: { jobId },
    });

    if (!jobRecord) {
      throw new Error(`Job record with ID ${jobId} not found`);
    }

    if (totalRows !== undefined) jobRecord.totalRows = totalRows;
    if (processedRows !== undefined) jobRecord.processedRows = processedRows;
    if (failedRows !== undefined) jobRecord.failedRows = failedRows;

    return this.enrichmentJobHistoryRepository.save(jobRecord);
  }

  async getJobHistory(
    websetId: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ jobs: EnrichmentJobHistory[]; total: number }> {
    // Verify user has access to the webset
    const webset = await this.websetRepository.findOne({
      where: { id: websetId, userId },
    });

    if (!webset) {
      throw new Error(`Webset with ID ${websetId} not found or access denied`);
    }

    const [jobs, total] = await this.enrichmentJobHistoryRepository.findAndCount({
      where: { websetId },
      order: { startTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { jobs, total };
  }

  async getJobById(jobId: string, userId: string): Promise<EnrichmentJobHistory> {
    const jobRecord = await this.enrichmentJobHistoryRepository.findOne({
      where: { id: jobId },
      relations: ['webset'],
    });

    if (!jobRecord) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    // Verify user has access to the webset associated with this job
    const webset = await this.websetRepository.findOne({
      where: { id: jobRecord.websetId, userId },
    });

    if (!webset) {
      throw new Error(`Access denied to job with ID ${jobId}`);
    }

    return jobRecord;
  }

  async getJobByJobId(bullJobId: string, userId: string): Promise<EnrichmentJobHistory> {
    const jobRecord = await this.enrichmentJobHistoryRepository.findOne({
      where: { jobId: bullJobId },
      relations: ['webset'],
    });

    if (!jobRecord) {
      throw new Error(`Job with BullMQ ID ${bullJobId} not found`);
    }

    // Verify user has access to the webset associated with this job
    const webset = await this.websetRepository.findOne({
      where: { id: jobRecord.websetId, userId },
    });

    if (!webset) {
      throw new Error(`Access denied to job with BullMQ ID ${bullJobId}`);
    }

    return jobRecord;
  }

  async getUserJobHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ jobs: EnrichmentJobHistory[]; total: number }> {
    const [jobs, total] = await this.enrichmentJobHistoryRepository.findAndCount({
      where: { userId },
      order: { startTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['webset'],
    });

    return { jobs, total };
  }

  async getRecentJobs(
    userId: string,
    limit: number = 10,
  ): Promise<EnrichmentJobHistory[]> {
    return this.enrichmentJobHistoryRepository.find({
      where: { userId },
      order: { startTime: 'DESC' },
      take: limit,
      relations: ['webset'],
    });
  }

  async getJobsByStatus(
    websetId: string,
    userId: string,
    status: EnrichmentJobStatus,
  ): Promise<EnrichmentJobHistory[]> {
    // Verify user has access to the webset
    const webset = await this.websetRepository.findOne({
      where: { id: websetId, userId },
    });

    if (!webset) {
      throw new Error(`Webset with ID ${websetId} not found or access denied`);
    }

    return this.enrichmentJobHistoryRepository.find({
      where: { websetId, status },
      order: { startTime: 'DESC' },
    });
  }
}