import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private dataSource: DataSource,
    @InjectQueue('enrichment') private enrichmentQueue: Queue,
  ) {}

  async checkHealth(): Promise<{ status: string; details: { postgresql: { status: string; message?: string }; redis: { status: string; message?: string } } }> {
    const postgresqlStatus = await this.checkPostgreSQL();
    const redisStatus = await this.checkRedis();

    const overallStatus = postgresqlStatus.status === 'ok' && redisStatus.status === 'ok' ? 'ok' : 'error';

    return {
      status: overallStatus,
      details: {
        postgresql: postgresqlStatus,
        redis: redisStatus,
      },
    };
  }

  private async checkPostgreSQL(): Promise<{ status: string; message?: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('PostgreSQL health check failed:', error.message);
      return { status: 'error', message: error.message };
    }
  }

  private async checkRedis(): Promise<{ status: string; message?: string }> {
    try {
      // Use the existing Redis connection from BullMQ to test connectivity
      const client = await this.enrichmentQueue.client;
      await client.ping();

      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Redis health check failed:', error.message);
      return { status: 'error', message: error.message };
    }
  }
}