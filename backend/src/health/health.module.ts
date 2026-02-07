import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'enrichment',
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule implements OnModuleInit {
  private readonly logger = new Logger(HealthModule.name);

  onModuleInit() {
    this.logger.log('HealthModule initialized');
  }
}
