import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    UseGuards,
    Request,
    ForbiddenException,
    Query,
} from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { EnrichCellDto } from './dto/enrich-cell.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { EnrichmentHistoryService } from './enrichment-history.service';
import { EnrichmentJobHistory } from '../entities/enrichment-job-history.entity';

import { PlanningService } from './planning.service';

@Controller('enrichment')
@UseGuards(JwtAuthGuard)
export class EnrichmentController {
    constructor(
        private readonly enrichmentService: EnrichmentService,
        private readonly planningService: PlanningService,
        private readonly enrichmentHistoryService: EnrichmentHistoryService,
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

    @Post('jobs/:jobId/pause')
    async pauseJob(@Param('jobId') jobId: string, @Request() req) {
        return this.enrichmentService.pauseJob(jobId, req.user.id);
    }

    @Post('jobs/:jobId/resume')
    async resumeJob(@Param('jobId') jobId: string, @Request() req) {
        return this.enrichmentService.resumeJob(jobId, req.user.id);
    }

    @Post('jobs/:jobId/stop')
    async stopJob(@Param('jobId') jobId: string, @Request() req) {
        return this.enrichmentService.stopJob(jobId, req.user.id);
    }

    @Get('history')
    getUserHistory(
        @Request() req,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        return this.enrichmentHistoryService.getUserJobHistory(req.user.id, page, limit);
    }

    @Get('history/webset/:websetId')
    getWebsetHistory(
        @Param('websetId') websetId: string,
        @Request() req,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ) {
        return this.enrichmentHistoryService.getJobHistory(websetId, req.user.id, page, limit);
    }

    @Get('history/job/:jobId')
    getJobDetail(
        @Param('jobId') jobId: string,
        @Request() req,
    ) {
        return this.enrichmentHistoryService.getJobById(jobId, req.user.id);
    }

    @Get('history/status/:status')
    getJobsByStatus(
        @Param('status') status: string,
        @Request() req,
        @Query('websetId') websetId?: string,
    ) {
        if (websetId) {
            return this.enrichmentHistoryService.getJobsByStatus(websetId, req.user.id, status as any);
        }
        // If no websetId provided, return user's jobs with that status across all websets
        // This would require a new method in the service
        throw new Error('Webset ID is required when filtering by status');
    }
}
