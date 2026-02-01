import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { SearchProvider, SearchProviderType } from '../../entities/search-provider.entity';
import { ProviderUsageType } from '../../entities/provider-usage.entity';
import { RateLimitService } from '../../rate-limit/rate-limit.service';
import { CreateSearchProviderDto, UpdateSearchProviderDto } from './search-provider.dto';

export interface SearchRequest {
  query: string;
  numResults?: number;
  includeText?: boolean;
  startPublishedDate?: string;
  endPublishedDate?: string;
  domains?: string[];
  excludeDomains?: string[];
  categories?: string[];
}

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  content?: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  total?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class SearchProvidersService {
  private readonly logger = new Logger(SearchProvidersService.name);
  private clientCache = new Map<string, AxiosInstance>();

  constructor(
    @InjectRepository(SearchProvider)
    private providerRepository: Repository<SearchProvider>,
    private rateLimitService: RateLimitService,
  ) {}

  async create(dto: CreateSearchProviderDto): Promise<SearchProvider> {
    const provider = this.providerRepository.create(dto);
    return this.providerRepository.save(provider);
  }

  async findAll(): Promise<SearchProvider[]> {
    return this.providerRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SearchProvider> {
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) {
      throw new HttpException('Provider not found', HttpStatus.NOT_FOUND);
    }
    return provider;
  }

  async findActive(): Promise<SearchProvider[]> {
    return this.providerRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateSearchProviderDto): Promise<SearchProvider> {
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

  async search(
    providerId: string,
    request: SearchRequest,
    userId?: string,
    retries: number = 3,
  ): Promise<SearchResponse> {
    const provider = await this.findOne(providerId);

    if (!provider.isActive) {
      throw new HttpException('Provider is not active', HttpStatus.BAD_REQUEST);
    }

    await this.rateLimitService.checkRateLimit({
      providerId,
      userId,
      type: ProviderUsageType.SEARCH,
      rateLimit: provider.rateLimit,
      dailyLimit: provider.dailyLimit,
    });

    let lastError: Error;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.executeSearch(provider, request);
        
        await this.rateLimitService.trackUsage(
          {
            providerId,
            userId,
            type: ProviderUsageType.SEARCH,
          },
          undefined,
          {
            query: request.query,
            resultsCount: response.results.length,
          },
        );

        return response;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Search failed (attempt ${attempt + 1}/${retries}): ${error.message}`,
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

  private async executeSearch(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    switch (provider.type) {
      case SearchProviderType.EXA:
        return this.searchExa(provider, request);
      case SearchProviderType.BRAVE:
        return this.searchBrave(provider, request);
      case SearchProviderType.BING:
        return this.searchBing(provider, request);
      case SearchProviderType.GOOGLE:
        return this.searchGoogle(provider, request);
      case SearchProviderType.FIRECRAWL:
        return this.searchFirecrawl(provider, request);
      case SearchProviderType.TAVILY:
        return this.searchTavily(provider, request);
      case SearchProviderType.SERPER:
        return this.searchSerper(provider, request);
      case SearchProviderType.JINA:
        return this.searchJina(provider, request);
      case SearchProviderType.SEARXNG:
        return this.searchSearxng(provider, request);
      default:
        throw new HttpException('Unsupported provider type', HttpStatus.BAD_REQUEST);
    }
  }

  private async searchExa(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    const client = this.getOrCreateClient(provider);
    const endpoint = provider.endpoint || 'https://api.exa.ai';

    const response = await client.post(`${endpoint}/search`, {
      query: request.query,
      num_results: request.numResults || 10,
      text: request.includeText || false,
      start_published_date: request.startPublishedDate,
      end_published_date: request.endPublishedDate,
      include_domains: request.domains,
      exclude_domains: request.excludeDomains,
      category: request.categories?.[0],
    }, {
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
      },
    });

    return {
      results: response.data.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        content: r.text,
        publishedDate: r.published_date,
        author: r.author,
        score: r.score,
      })),
      total: response.data.autoprompt_string ? undefined : response.data.results.length,
    };
  }

  private async searchBrave(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    const client = this.getOrCreateClient(provider);
    const endpoint = provider.endpoint || 'https://api.search.brave.com/res/v1';

    const response = await client.get(`${endpoint}/web/search`, {
      params: {
        q: request.query,
        count: request.numResults || 10,
      },
      headers: {
        'X-Subscription-Token': provider.apiKey,
        'Accept': 'application/json',
      },
    });

    return {
      results: response.data.web?.results?.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        publishedDate: r.age,
      })) || [],
      total: response.data.web?.results?.length,
    };
  }

  private async searchBing(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    const client = this.getOrCreateClient(provider);
    const endpoint = provider.endpoint || 'https://api.bing.microsoft.com/v7.0';

    const response = await client.get(`${endpoint}/search`, {
      params: {
        q: request.query,
        count: request.numResults || 10,
      },
      headers: {
        'Ocp-Apim-Subscription-Key': provider.apiKey,
      },
    });

    return {
      results: response.data.webPages?.value?.map((r: any) => ({
        title: r.name,
        url: r.url,
        snippet: r.snippet,
        publishedDate: r.dateLastCrawled,
      })) || [],
      total: response.data.webPages?.totalEstimatedMatches,
    };
  }

  private async searchGoogle(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    const client = this.getOrCreateClient(provider);
    const endpoint = provider.endpoint || 'https://www.googleapis.com/customsearch/v1';

    const response = await client.get(endpoint, {
      params: {
        key: provider.apiKey,
        cx: provider.config?.searchEngineId,
        q: request.query,
        num: request.numResults || 10,
      },
    });

    return {
      results: response.data.items?.map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      })) || [],
      total: parseInt(response.data.searchInformation?.totalResults || '0', 10),
    };
  }

  private async searchFirecrawl(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    const client = this.getOrCreateClient(provider);
    const endpoint = provider.endpoint || 'https://api.firecrawl.dev/v0';

    const response = await client.post(`${endpoint}/search`, {
      query: request.query,
      limit: request.numResults || 10,
    }, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      results: response.data.data?.map((r: any) => ({
        title: r.title || r.metadata?.title,
        url: r.url,
        snippet: r.description || r.metadata?.description,
        content: r.markdown,
      })) || [],
    };
  }

  private async searchTavily(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    const client = this.getOrCreateClient(provider);
    const endpoint = provider.endpoint || 'https://api.tavily.com';

    const response = await client.post(`${endpoint}/search`, {
      api_key: provider.apiKey,
      query: request.query,
      max_results: request.numResults || 10,
      include_raw_content: request.includeText || false,
    });

    return {
      results: response.data.results?.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        content: r.raw_content,
        score: r.score,
      })) || [],
    };
  }

  private async searchSerper(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    const client = this.getOrCreateClient(provider);
    const endpoint = provider.endpoint || 'https://google.serper.dev';

    const response = await client.post(`${endpoint}/search`, {
      q: request.query,
      num: request.numResults || 10,
    }, {
      headers: {
        'X-API-KEY': provider.apiKey,
        'Content-Type': 'application/json',
      },
    });

    return {
      results: response.data.organic?.map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
        publishedDate: r.date,
      })) || [],
    };
  }

  private async searchJina(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    const client = this.getOrCreateClient(provider);
    const endpoint = provider.endpoint || 'https://s.jina.ai';

    const response = await client.get(`${endpoint}/${encodeURIComponent(request.query)}`, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'X-Return-Format': 'json',
      },
    });

    return {
      results: response.data.data?.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        content: r.content,
      })) || [],
    };
  }

  private async searchSearxng(
    provider: SearchProvider,
    request: SearchRequest,
  ): Promise<SearchResponse> {
    const client = this.getOrCreateClient(provider);
    const endpoint = provider.endpoint || 'http://localhost:8080';

    const response = await client.get(`${endpoint}/search`, {
      params: {
        q: request.query,
        format: 'json',
        pageno: 1,
      },
    });

    return {
      results: response.data.results?.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        publishedDate: r.publishedDate,
      })) || [],
      total: response.data.number_of_results,
    };
  }

  private getOrCreateClient(provider: SearchProvider): AxiosInstance {
    if (this.clientCache.has(provider.id)) {
      return this.clientCache.get(provider.id);
    }

    const client = axios.create({
      timeout: provider.config?.timeout || 30000,
      ...provider.config?.axiosConfig,
    });

    this.clientCache.set(provider.id, client);
    return client;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
