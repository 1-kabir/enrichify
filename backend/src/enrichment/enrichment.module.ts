import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentController } from './enrichment.controller';
import { EnrichmentProcessor } from './enrichment.processor';
import { Webset } from '../entities/webset.entity';
import { WebsetCell } from '../entities/webset-cell.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webset, WebsetCell]),
    BullModule.registerQueue({
      name: 'enrichment',
    }),
  ],
  controllers: [EnrichmentController],
  providers: [EnrichmentService, EnrichmentProcessor],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
