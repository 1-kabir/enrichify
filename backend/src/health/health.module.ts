import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';

@Module({
  imports: [BullModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}