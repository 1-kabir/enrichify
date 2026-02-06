import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { SettingsService } from './settings.service';

interface UpdateSystemProviderDto {
  isAvailableToUsers?: boolean;
  canUserProvideKey?: boolean;
  isDefaultForUsers?: boolean;
}

@Controller('admin/providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminProviderController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSystemProviders() {
    return this.settingsService.getSystemProviders();
  }

  @Patch('llm/:providerId')
  updateLlmProvider(
    @Param('providerId', new ParseUUIDPipe()) providerId: string,
    @Body() updateDto: UpdateSystemProviderDto,
  ) {
    return this.settingsService.updateSystemProvider('llm', providerId, updateDto);
  }

  @Patch('search/:providerId')
  updateSearchProvider(
    @Param('providerId', new ParseUUIDPipe()) providerId: string,
    @Body() updateDto: UpdateSystemProviderDto,
  ) {
    return this.settingsService.updateSystemProvider('search', providerId, updateDto);
  }
}