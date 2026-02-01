import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RateLimitService } from './rate-limit.service';
import { ProviderUsage } from '../entities/provider-usage.entity';
import { LLMProvider } from '../entities/llm-provider.entity';
import { SearchProvider } from '../entities/search-provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderUsage, LLMProvider, SearchProvider]),
  ],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
