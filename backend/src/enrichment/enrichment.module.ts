import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentController } from './enrichment.controller';
import { EnrichmentProcessor } from './enrichment.processor';
import { EnrichmentGateway } from './enrichment.gateway';
import { ProvidersModule } from '../providers/providers.module';
import { Webset } from '../entities/webset.entity';
import { WebsetCell } from '../entities/webset-cell.entity';
import { WebsetCitation } from '../entities/webset-citation.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Webset, WebsetCell, WebsetCitation]),
        BullModule.registerQueue({
            name: 'enrichment',
        }),
        ProvidersModule,
    ],
    controllers: [EnrichmentController],
    providers: [EnrichmentService, EnrichmentProcessor, EnrichmentGateway],
    exports: [EnrichmentService, EnrichmentGateway],
})
export class EnrichmentModule { }
