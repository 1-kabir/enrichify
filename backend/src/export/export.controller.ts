import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExportService } from './export.service';
import { CreateExportDto } from './dto/create-export.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('websets/:websetId')
  create(
    @Param('websetId') websetId: string,
    @Body() createExportDto: CreateExportDto,
    @Request() req,
  ) {
    return this.exportService.create(websetId, createExportDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.exportService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.exportService.findOne(id, req.user.id);
  }
}
