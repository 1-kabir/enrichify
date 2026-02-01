import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { EnrichCellDto } from './dto/enrich-cell.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('enrichment')
@UseGuards(JwtAuthGuard)
export class EnrichmentController {
  constructor(private readonly enrichmentService: EnrichmentService) {}

  @Post('enrich')
  enrichCells(@Body() enrichCellDto: EnrichCellDto, @Request() req) {
    return this.enrichmentService.enrichCells(enrichCellDto, req.user.id);
  }

  @Get('jobs/:jobId')
  getJobStatus(@Param('jobId') jobId: string) {
    return this.enrichmentService.getJobStatus(jobId);
  }
}
