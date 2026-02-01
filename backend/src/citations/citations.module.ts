import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitationsService } from './citations.service';
import { CitationsController } from './citations.controller';
import { WebsetCitation } from '../entities/webset-citation.entity';
import { WebsetCell } from '../entities/webset-cell.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebsetCitation, WebsetCell])],
  controllers: [CitationsController],
  providers: [CitationsService],
  exports: [CitationsService],
})
export class CitationsModule {}
