import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LLMProvider } from '../entities/llm-provider.entity';
import { SearchProvider } from '../entities/search-provider.entity';
import { ProviderUsage } from '../entities/provider-usage.entity';
import { LLMProvidersService } from './llm/llm-providers.service';
import { SearchProvidersService } from './search/search-providers.service';
import { LLMProvidersController } from './llm/llm-providers.controller';
import { SearchProvidersController } from './search/search-providers.controller';
import { RateLimitModule } from '../rate-limit/rate-limit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LLMProvider, SearchProvider, ProviderUsage]),
    RateLimitModule,
  ],
  controllers: [LLMProvidersController, SearchProvidersController],
  providers: [LLMProvidersService, SearchProvidersService],
  exports: [LLMProvidersService, SearchProvidersService],
})
export class ProvidersModule {}
