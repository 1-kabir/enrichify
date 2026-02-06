import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { AdminProviderController } from './admin-provider.controller';
import { SettingsService } from './settings.service';
import { User } from '../entities/user.entity';
import { UserProviderConfig } from '../entities/user-provider-config.entity';
import { LLMProvider } from '../entities/llm-provider.entity';
import { SearchProvider } from '../entities/search-provider.entity';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProviderConfig, LLMProvider, SearchProvider]),
    ProvidersModule,
  ],
  controllers: [SettingsController, AdminProviderController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}