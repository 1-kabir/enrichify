import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CitationsService } from './citations.service';
import { CreateCitationDto } from './dto/create-citation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('citations')
@UseGuards(JwtAuthGuard)
export class CitationsController {
  constructor(private readonly citationsService: CitationsService) {}

  @Post()
  create(@Body() createCitationDto: CreateCitationDto) {
    return this.citationsService.create(createCitationDto);
  }

  @Post('batch')
  createBatch(@Body() citations: CreateCitationDto[]) {
    return this.citationsService.createBatch(citations);
  }

  @Get('cell/:cellId')
  findByCellId(@Param('cellId') cellId: string) {
    return this.citationsService.findByCellId(cellId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citationsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citationsService.remove(id);
  }
}
