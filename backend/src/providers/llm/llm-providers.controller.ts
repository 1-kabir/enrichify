import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LLMProvidersService, LLMRequest } from './llm-providers.service';
import { CreateLLMProviderDto, UpdateLLMProviderDto } from './llm-provider.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('api/llm-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LLMProvidersController {
  constructor(private readonly service: LLMProvidersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateLLMProviderDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('active')
  async findActive() {
    return this.service.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateLLMProviderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }

  @Post(':id/request')
  async makeRequest(
    @Param('id') id: string,
    @Body() request: LLMRequest,
  ) {
    return this.service.makeRequest(id, request);
  }
}
