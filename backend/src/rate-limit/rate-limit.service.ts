import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { ProviderUsage, ProviderUsageType } from '../entities/provider-usage.entity';
import { LLMProvider } from '../entities/llm-provider.entity';
import { SearchProvider } from '../entities/search-provider.entity';

export interface RateLimitConfig {
  providerId: string;
  userId?: string;
  type: ProviderUsageType;
  rateLimit?: number;
  dailyLimit?: number;
}

export interface UsageStats {
  requestsInWindow: number;
  requestsToday: number;
  tokensToday: number;
}

@Injectable()
export class RateLimitService {
  constructor(
    @InjectRepository(ProviderUsage)
    private usageRepository: Repository<ProviderUsage>,
    @InjectRepository(LLMProvider)
    private llmProviderRepository: Repository<LLMProvider>,
    @InjectRepository(SearchProvider)
    private searchProviderRepository: Repository<SearchProvider>,
  ) {}

  async checkRateLimit(config: RateLimitConfig): Promise<void> {
    const stats = await this.getUsageStats(config);
    
    if (config.rateLimit && stats.requestsInWindow >= config.rateLimit) {
      throw new HttpException(
        `Rate limit exceeded. Maximum ${config.rateLimit} requests per minute.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (config.dailyLimit && stats.requestsToday >= config.dailyLimit) {
      throw new HttpException(
        `Daily limit exceeded. Maximum ${config.dailyLimit} requests per day.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async trackUsage(
    config: RateLimitConfig,
    tokensUsed?: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const usage = this.usageRepository.create({
      type: config.type,
      llm_provider_id: config.type === ProviderUsageType.LLM ? config.providerId : null,
      search_provider_id: config.type === ProviderUsageType.SEARCH ? config.providerId : null,
      user_id: config.userId,
      requestCount: 1,
      tokensUsed,
      metadata,
    });

    await this.usageRepository.save(usage);
  }

  async getUsageStats(config: RateLimitConfig): Promise<UsageStats> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const whereCondition: any = {
      type: config.type,
    };

    if (config.type === ProviderUsageType.LLM) {
      whereCondition.llm_provider_id = config.providerId;
    } else {
      whereCondition.search_provider_id = config.providerId;
    }

    if (config.userId) {
      whereCondition.user_id = config.userId;
    }

    const [requestsInWindow, requestsToday] = await Promise.all([
      this.usageRepository.count({
        where: {
          ...whereCondition,
          createdAt: MoreThanOrEqual(oneMinuteAgo) as any,
        },
      }),
      this.usageRepository.count({
        where: {
          ...whereCondition,
          createdAt: MoreThanOrEqual(startOfDay) as any,
        },
      }),
    ]);

    const todayUsages = await this.usageRepository.find({
      where: {
        ...whereCondition,
        createdAt: MoreThanOrEqual(startOfDay) as any,
      },
    });

    const tokensToday = todayUsages.reduce(
      (sum, usage) => sum + (usage.tokensUsed || 0),
      0,
    );

    return {
      requestsInWindow,
      requestsToday,
      tokensToday,
    };
  }

  async cleanupOldUsage(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.usageRepository.delete({
      createdAt: LessThan(cutoffDate),
    });
  }

  async getProviderRateLimits(
    providerId: string,
    type: ProviderUsageType,
  ): Promise<{ rateLimit?: number; dailyLimit?: number }> {
    if (type === ProviderUsageType.LLM) {
      const provider = await this.llmProviderRepository.findOne({
        where: { id: providerId },
      });
      return {
        rateLimit: provider?.rateLimit,
        dailyLimit: provider?.dailyLimit,
      };
    } else {
      const provider = await this.searchProviderRepository.findOne({
        where: { id: providerId },
      });
      return {
        rateLimit: provider?.rateLimit,
        dailyLimit: provider?.dailyLimit,
      };
    }
  }
}
