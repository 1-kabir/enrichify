import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentController } from './enrichment.controller';
import { EnrichmentProcessor } from './enrichment.processor';
import { EnrichmentGateway } from './enrichment.gateway';
import { PlanningService } from './planning.service';
import { JobPartitionerService } from './job-partitioner.service';
import { AgentManagerService } from './agent-manager.service';
import { OrchestrationService } from './orchestration.service';
import { PromptService } from './prompt.service';
import { ResilienceService } from './resilience.service';
import { MonitoringService } from './monitoring.service';
import { DataIntegrityService } from './data-integrity.service';
import { OptimizationService } from './optimization.service';
import { ProvidersModule } from '../providers/providers.module';
import { WebsetsModule } from '../websets/websets.module';
import { Webset } from '../entities/webset.entity';
import { WebsetCell } from '../entities/webset-cell.entity';
import { WebsetCitation } from '../entities/webset-citation.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Webset, WebsetCell, WebsetCitation]),
        BullModule.registerQueue({
            name: 'enrichment',
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: { count: 3 },
            },
        }),
        ProvidersModule,
        WebsetsModule,
    ],
    controllers: [EnrichmentController],
    providers: [
        EnrichmentService,
        EnrichmentProcessor,
        EnrichmentGateway,
        PlanningService,
        JobPartitionerService,
        AgentManagerService,
        OrchestrationService,
        PromptService,
        ResilienceService,
        MonitoringService,
        DataIntegrityService,
        OptimizationService,
    ],
    exports: [EnrichmentService, EnrichmentGateway, PlanningService, JobPartitionerService, AgentManagerService, OrchestrationService, PromptService, ResilienceService, MonitoringService, DataIntegrityService, OptimizationService],
})
export class EnrichmentModule { }
