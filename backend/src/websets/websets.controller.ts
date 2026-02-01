import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WebsetsService } from './websets.service';
import { CreateWebsetDto } from './dto/create-webset.dto';
import { UpdateWebsetDto } from './dto/update-webset.dto';
import { UpdateCellDto } from './dto/update-cell.dto';
import { RevertVersionDto } from './dto/revert-version.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('websets')
@UseGuards(JwtAuthGuard)
export class WebsetsController {
  constructor(private readonly websetsService: WebsetsService) {}

  @Post()
  create(@Body() createWebsetDto: CreateWebsetDto, @Request() req) {
    return this.websetsService.create(createWebsetDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.websetsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.websetsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebsetDto: UpdateWebsetDto, @Request() req) {
    return this.websetsService.update(id, updateWebsetDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.websetsService.remove(id, req.user.id);
  }

  @Post(':id/cells')
  updateCell(
    @Param('id') id: string,
    @Body() updateCellDto: UpdateCellDto,
    @Request() req,
  ) {
    return this.websetsService.updateCell(id, updateCellDto, req.user.id);
  }

  @Get(':id/cells')
  getCells(@Param('id') id: string, @Request() req) {
    return this.websetsService.getCells(id, req.user.id);
  }

  @Get(':id/versions')
  getVersions(@Param('id') id: string, @Request() req) {
    return this.websetsService.getVersions(id, req.user.id);
  }

  @Post(':id/revert')
  revertToVersion(
    @Param('id') id: string,
    @Body() revertVersionDto: RevertVersionDto,
    @Request() req,
  ) {
    return this.websetsService.revertToVersion(id, revertVersionDto, req.user.id);
  }
}
