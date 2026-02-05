import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMProviderType } from '../../entities/llm-provider.entity';
import { ProviderUsageType } from '../../entities/provider-usage.entity';
import { RateLimitService } from '../../rate-limit/rate-limit.service';
import { CreateLLMProviderDto, UpdateLLMProviderDto } from './llm-provider.dto';

export interface LLMRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  finishReason?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LLMProvidersService {
  private readonly logger = new Logger(LLMProvidersService.name);
  private clientCache = new Map<string, any>();

  constructor(
    @InjectRepository(LLMProvider)
    private providerRepository: Repository<LLMProvider>,
    private rateLimitService: RateLimitService,
  ) {}

  async create(dto: CreateLLMProviderDto): Promise<LLMProvider> {
    const provider = this.providerRepository.create(dto);
    return this.providerRepository.save(provider);
  }

  async findAll(): Promise<LLMProvider[]> {
    return this.providerRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LLMProvider> {
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) {
      throw new HttpException('Provider not found', HttpStatus.NOT_FOUND);
    }
    return provider;
  }

  async findActive(): Promise<LLMProvider[]> {
    return this.providerRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateLLMProviderDto): Promise<LLMProvider> {
    const provider = await this.findOne(id);
    Object.assign(provider, dto);
    this.clientCache.delete(id);
    return this.providerRepository.save(provider);
  }

  async remove(id: string): Promise<void> {
    const provider = await this.findOne(id);
    await this.providerRepository.remove(provider);
    this.clientCache.delete(id);
  }

  async makeRequest(
    providerId: string,
    request: LLMRequest,
    userId?: string,
    retries: number = 3,
  ): Promise<LLMResponse> {
    const provider = await this.findOne(providerId);

    if (!provider.isActive) {
      throw new HttpException('Provider is not active', HttpStatus.BAD_REQUEST);
    }

    await this.rateLimitService.checkRateLimit({
      providerId,
      userId,
      type: ProviderUsageType.LLM,
      rateLimit: provider.rateLimit,
      dailyLimit: provider.dailyLimit,
    });

    let lastError: Error;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.executeRequest(provider, request);
        
        await this.rateLimitService.trackUsage(
          {
            providerId,
            userId,
            type: ProviderUsageType.LLM,
          },
          response.tokensUsed,
          {
            model: response.model,
            finishReason: response.finishReason,
          },
        );

        return response;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Request failed (attempt ${attempt + 1}/${retries}): ${error.message}`,
        );
        
        if (attempt < retries - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new HttpException(
      `Failed after ${retries} attempts: ${lastError.message}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private async executeRequest(
    provider: LLMProvider,
    request: LLMRequest,
  ): Promise<LLMResponse> {
    switch (provider.type) {
      case LLMProviderType.OPENAI:
      case LLMProviderType.OPENAI_COMPATIBLE:
      case LLMProviderType.GROQ:
      case LLMProviderType.OPENROUTER:
      case LLMProviderType.VERCEL_AI:
        return this.executeOpenAIRequest(provider, request);
      case LLMProviderType.CLAUDE:
        return this.executeClaudeRequest(provider, request);
      case LLMProviderType.GEMINI:
        return this.executeGeminiRequest(provider, request);
      default:
        throw new HttpException('Unsupported provider type', HttpStatus.BAD_REQUEST);
    }
  }

  private async executeOpenAIRequest(
    provider: LLMProvider,
    request: LLMRequest,
  ): Promise<LLMResponse> {
    const client = this.getOrCreateOpenAIClient(provider);
    const model = request.model || provider.config?.defaultModel || 'gpt-3.5-turbo';

    try {
      const completion = await client.chat.completions.create({
        model,
        messages: request.messages as any,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: false,
      });

      return {
        content: completion.choices[0].message.content || '',
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens,
        finishReason: completion.choices[0].finish_reason,
        metadata: {
          id: completion.id,
          created: completion.created,
        },
      };
    } catch (error) {
      this.handleProviderError(error, provider.type, provider.name);
      throw error;
    }
  }

  private async executeClaudeRequest(
    provider: LLMProvider,
    request: LLMRequest,
  ): Promise<LLMResponse> {
    const client = this.getOrCreateClaudeClient(provider);
    const model = request.model || provider.config?.defaultModel || 'claude-3-sonnet-20240229';

    const systemMessage = request.messages.find((m) => m.role === 'system');
    const userMessages = request.messages.filter((m) => m.role !== 'system');

    try {
      const message = await client.messages.create({
        model,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })) as any,
      });

      return {
        content: message.content[0].type === 'text' ? message.content[0].text : '',
        model: message.model,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
        finishReason: message.stop_reason,
        metadata: {
          id: message.id,
        },
      };
    } catch (error) {
      this.handleProviderError(error, provider.type, provider.name);
      throw error;
    }
  }

  private async executeGeminiRequest(
    provider: LLMProvider,
    request: LLMRequest,
  ): Promise<LLMResponse> {
    const client = this.getOrCreateGeminiClient(provider);
    const modelName = request.model || provider.config?.defaultModel || 'gemini-pro';
    const model = client.getGenerativeModel({ model: modelName });

    const systemMessage = request.messages.find((m) => m.role === 'system');
    const userMessages = request.messages.filter((m) => m.role !== 'system');

    try {
      const chat = model.startChat({
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
        },
        history: userMessages.slice(0, -1).map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      });

      const lastMessage = userMessages[userMessages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;

      return {
        content: response.text(),
        model: modelName,
        tokensUsed: response.usageMetadata?.totalTokenCount,
        metadata: {
          promptTokens: response.usageMetadata?.promptTokenCount,
          candidatesTokens: response.usageMetadata?.candidatesTokenCount,
        },
      };
    } catch (error) {
      this.handleProviderError(error, provider.type, provider.name);
      throw error;
    }
  }

  private getOrCreateOpenAIClient(provider: LLMProvider): OpenAI {
    if (this.clientCache.has(provider.id)) {
      return this.clientCache.get(provider.id);
    }

    const config: any = {
      apiKey: provider.apiKey,
    };

    if (provider.endpoint) {
      config.baseURL = provider.endpoint;
    }

    const client = new OpenAI(config);
    this.clientCache.set(provider.id, client);
    return client;
  }

  private getOrCreateClaudeClient(provider: LLMProvider): Anthropic {
    if (this.clientCache.has(provider.id)) {
      return this.clientCache.get(provider.id);
    }

    const client = new Anthropic({
      apiKey: provider.apiKey,
    });

    this.clientCache.set(provider.id, client);
    return client;
  }

  private getOrCreateGeminiClient(provider: LLMProvider): GoogleGenerativeAI {
    if (this.clientCache.has(provider.id)) {
      return this.clientCache.get(provider.id);
    }

    const client = new GoogleGenerativeAI(provider.apiKey);
    this.clientCache.set(provider.id, client);
    return client;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleProviderError(error: any, providerType: LLMProviderType, providerName: string) {
    this.logger.error(`Provider error for ${providerName} (${providerType}): ${error.message}`);

    // Log specific error details to console
    console.error(`Provider error details:`, {
      providerType,
      providerName,
      errorStatus: error.status || error.code || error.statusCode,
      errorMessage: error.message,
      errorStack: error.stack
    });

    // Handle different types of errors
    if (error.status === 401 || error.status === 403 || error.code === 'invalid_api_key') {
      throw new HttpException(
        `Invalid API key for ${providerName}. Please check your credentials.`,
        HttpStatus.UNAUTHORIZED
      );
    } else if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      throw new HttpException(
        `Rate limit exceeded for ${providerName}. Please try again later.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    } else if (error.status === 402 || error.code === 'insufficient_funds' || error.message.includes('credit')) {
      throw new HttpException(
        `Insufficient credits for ${providerName}. Please check your account balance.`,
        HttpStatus.PAYMENT_REQUIRED
      );
    } else if (error.status === 404) {
      throw new HttpException(
        `Resource not found for ${providerName}. Please check your configuration.`,
        HttpStatus.NOT_FOUND
      );
    } else {
      // For other errors, preserve the original error
      throw error;
    }
  }
}
