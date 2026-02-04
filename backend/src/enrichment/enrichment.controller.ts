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

import { PlanningService } from './planning.service';

@Controller('enrichment')
@UseGuards(JwtAuthGuard)
export class EnrichmentController {
    constructor(
        private readonly enrichmentService: EnrichmentService,
        private readonly planningService: PlanningService,
    ) { }

    @Post('plan')
    generatePlan(@Body('prompt') prompt: string, @Request() req) {
        return this.planningService.generatePlan(prompt, req.user.id);
    }

    @Post('enrich')
    enrichCells(@Body() enrichCellDto: EnrichCellDto, @Request() req) {
        return this.enrichmentService.enrichCells(enrichCellDto, req.user.id);
    }

    @Get('jobs/:jobId')
    getJobStatus(@Param('jobId') jobId: string) {
        return this.enrichmentService.getJobStatus(jobId);
    }
}
