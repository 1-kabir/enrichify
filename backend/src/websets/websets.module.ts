import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsetsService } from './websets.service';
import { WebsetsController } from './websets.controller';
import { Webset } from '../entities/webset.entity';
import { WebsetVersion } from '../entities/webset-version.entity';
import { WebsetCell } from '../entities/webset-cell.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Webset, WebsetVersion, WebsetCell])],
  controllers: [WebsetsController],
  providers: [WebsetsService],
  exports: [WebsetsService],
})
export class WebsetsModule {}
