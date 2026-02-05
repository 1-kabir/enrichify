import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SettingsService, CreateProviderConfigDto, UpdateProviderConfigDto, UpdateDefaultProvidersDto } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('providers')
  getUserProviders(@Request() req) {
    return this.settingsService.getUserProviders(req.user.id);
  }

  @Post('providers')
  createProviderConfig(@Request() req, @Body() createDto: CreateProviderConfigDto) {
    return this.settingsService.createProviderConfig(req.user.id, createDto);
  }

  @Patch('providers/:id')
  updateProviderConfig(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateProviderConfigDto,
  ) {
    return this.settingsService.updateProviderConfig(req.user.id, id, updateDto);
  }

  @Delete('providers/:id')
  deleteProviderConfig(@Request() req, @Param('id') id: string) {
    return this.settingsService.deleteProviderConfig(req.user.id, id);
  }

  @Get('defaults')
  getUserDefaultProviders(@Request() req) {
    return this.settingsService.getUserDefaultProviders(req.user.id);
  }

  @Patch('defaults')
  updateUserDefaultProviders(@Request() req, @Body() updateDto: UpdateDefaultProvidersDto) {
    return this.settingsService.updateUserDefaultProviders(req.user.id, updateDto);
  }
}