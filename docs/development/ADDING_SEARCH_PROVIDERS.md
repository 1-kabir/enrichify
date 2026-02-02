# Adding Custom Search Providers

This guide explains how to add a new search provider to Enrichify.

---

## 📋 Overview

Search providers power Enrichify's data enrichment capabilities. They fetch web data, articles, and structured information that can be processed and enriched with LLMs.

Each search provider integration includes:
- API client configuration
- Request/response handling
- Error handling and rate limiting
- Structured result formatting

---

## 🔴 Step-by-Step Implementation

### Step 1: Add Provider Type to Enum

**File:** `backend/src/entities/search-provider.entity.ts`

```typescript
export enum SearchProviderType {
  EXA = 'exa',
  TAVILY = 'tavily',
  BRAVE = 'brave',
  SERPER = 'serper',
  SEARXNG = 'searxng',
  MYPROVIDER = 'myprovider',  // ← Add your provider
}
```

### Step 2: Create Provider Service

Create: `backend/src/providers/search/providers/myprovider.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  metadata?: Record<string, any>;
}

interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

@Injectable()
export class MyProviderService {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint?: string) {
    if (!apiKey) {
      throw new BadRequestException('MyProvider API key is required');
    }
    this.apiKey = apiKey;
    this.endpoint = endpoint || 'https://api.myprovider.com/v1';
  }

  /**
   * Search using the provider's API
   * Returns structured results
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${this.endpoint}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: options.query,
          limit: options.limit || 10,
          offset: options.offset || 0,
          ...options.filters,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatResults(data.results);
    } catch (error) {
      throw new Error(`MyProvider search failed: ${error.message}`);
    }
  }

  /**
   * Format provider-specific results into standard format
   */
  private formatResults(providerResults: any[]): SearchResult[] {
    return providerResults.map((result) => ({
      title: result.title || result.name,
      url: result.url || result.link,
      snippet: result.description || result.excerpt,
      metadata: {
        // Store any additional data from the provider
        publishDate: result.published_date,
        author: result.author,
        source: result.source,
      },
    }));
  }

  /**
   * Test the API connection (called when saving provider)
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }
}
```

### Step 3: Register Service in Module

**File:** `backend/src/providers/providers.module.ts`

Add your service to imports and exports:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LLMProvider, SearchProvider } from '../entities';
import { LLMProvidersService } from './llm/llm-providers.service';
import { LLMProvidersController } from './llm/llm-providers.controller';
import { SearchProvidersService } from './search/search-providers.service';
import { SearchProvidersController } from './search/search-providers.controller';
import { MyProviderService } from './search/providers/myprovider.service';

@Module({
  imports: [TypeOrmModule.forFeature([LLMProvider, SearchProvider])],
  controllers: [LLMProvidersController, SearchProvidersController],
  providers: [
    LLMProvidersService,
    SearchProvidersService,
    MyProviderService,  // ← Add here
  ],
  exports: [LLMProvidersService, SearchProvidersService, MyProviderService],
})
export class ProvidersModule {}
```

### Step 4: Update Search Providers Service

**File:** `backend/src/providers/search/search-providers.service.ts`

Find the `getClient()` method and add your provider:

```typescript
async getClient(provider: SearchProvider): Promise<any> {
  switch (provider.type) {
    case SearchProviderType.EXA:
      return this.getExaClient(provider);
    case SearchProviderType.TAVILY:
      return this.getTavilyClient(provider);
    // ... other providers
    case SearchProviderType.MYPROVIDER:  // ← Add this
      return this.getMyProviderClient(provider);
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`);
  }
}

private getMyProviderClient(provider: SearchProvider): MyProviderService {
  return new MyProviderService(provider.apiKey, provider.endpoint);
}
```

Also update the `search()` method:

```typescript
async search(
  providerId: string,
  query: string,
  options?: Record<string, any>,
): Promise<SearchResult[]> {
  const provider = await this.getProvider(providerId);
  const client = await this.getClient(provider);

  // Provider-specific search logic
  const results = await client.search({ query, ...options });

  // Log usage for rate limiting
  await this.logUsage(provider.id);

  return results;
}
```

### Step 5: Update Configuration Example

**File:** `config.yml.example`

```yaml
providers:
  search:
    # ... existing providers
    - name: My Search Provider
      type: myprovider
      endpoint: https://api.myprovider.com/v1
      apiKey: ${MYPROVIDER_API_KEY}
      isActive: false
      config:
        searchType: web  # Provider-specific config
        language: en
      rateLimit: 100     # 100 requests per minute
      dailyLimit: 5000   # 5000 requests per day
```

**File:** `.env.example`

```env
MYPROVIDER_API_KEY=your-api-key-here
```

### Step 6: Create DTO

**File:** `backend/src/providers/search/search-provider.dto.ts`

Update the existing DTO or create provider-specific validation:

```typescript
import { IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { SearchProviderType } from '../../entities/search-provider.entity';

export class CreateSearchProviderDto {
  @IsString()
  name: string;

  @IsEnum(SearchProviderType)
  type: SearchProviderType;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsInt()
  rateLimit?: number;

  @IsOptional()
  @IsInt()
  dailyLimit?: number;
}
```

### Step 7: Add Tests

**File:** `backend/src/providers/search/providers/myprovider.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MyProviderService } from './myprovider.service';

describe('MyProviderService', () => {
  let service: MyProviderService;

  beforeEach(() => {
    service = new MyProviderService('test-api-key');
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      expect(() => new MyProviderService('')).toThrow(BadRequestException);
    });
  });

  describe('search', () => {
    it('should return formatted search results', async () => {
      // Mock the fetch call
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  title: 'Test Result',
                  url: 'https://example.com',
                  description: 'Test snippet',
                },
              ],
            }),
        }),
      ) as jest.Mock;

      const results = await service.search({ query: 'test' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Result');
      expect(results[0].url).toBe('https://example.com');
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        }),
      ) as jest.Mock;

      await expect(service.search({ query: 'test' })).rejects.toThrow();
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({ ok: true }),
      ) as jest.Mock;

      const result = await service.testConnection();
      expect(result).toBe(true);
    });
  });
});
```

Run tests:
```bash
cd backend
npm run test -- providers/search/providers/myprovider.service
```

---

## 📝 Important Details

### Result Formatting

Always return results in the standard format:
```typescript
interface SearchResult {
  title: string;      // Article/page title
  url: string;        // Link to the resource
  snippet: string;    // Preview text (100-200 chars)
  metadata?: {        // Provider-specific data
    publishDate?: string;
    author?: string;
    source?: string;
    [key: string]: any;
  };
}
```

### Rate Limiting

Configure in `config.yml`:
```yaml
rateLimit: 60      # Requests per minute
dailyLimit: 1000   # Requests per day
```

The backend automatically enforces these limits.

### Error Handling

Always throw descriptive errors:
```typescript
try {
  // API call
} catch (error) {
  throw new Error(`MyProvider API Error: ${error.message}`);
}
```

### Authentication

Support multiple auth methods:
```typescript
private getAuthHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,    // Bearer token
    // OR
    'X-API-Key': apiKey,                     // Custom header
    // OR
    'api_key': apiKey,                       // Query param
  };
}
```

---

## 🧪 Integration Testing

Test your provider with the enrichment module:

```bash
cd backend
npm run test:e2e -- enrichment
```

Or test manually via API:

```bash
# Create the provider
curl -X POST http://localhost:3001/providers/search \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Provider",
    "type": "myprovider",
    "apiKey": "your-key",
    "endpoint": "https://api.myprovider.com",
    "isActive": true,
    "rateLimit": 60,
    "dailyLimit": 1000
  }'

# Search using it
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "provider-uuid",
    "query": "machine learning"
  }'
```

---

## 🚀 Submitting Your Provider

1. **Fork and create a branch**:
   ```bash
   git checkout -b feat/add-myprovider-search
   ```

2. **Implement following the steps above**

3. **Test thoroughly**:
   ```bash
   npm test
   npm run lint
   ```

4. **Submit Pull Request** with:
   - Provider name and description
   - Link to API documentation
   - Example API key (test/free account)
   - Test coverage proof

We'll review and merge! 🎉

---

## 📚 Example Implementations

See existing providers for reference:

- **Exa**: `backend/src/providers/search/providers/exa.service.ts`
- **Tavily**: `backend/src/providers/search/providers/tavily.service.ts`
- **Brave**: `backend/src/providers/search/providers/brave.service.ts`

---

## ❓ Questions?

- [GitHub Issues](https://github.com/1-kabir/enrichify/issues)
- [GitHub Discussions](https://github.com/1-kabir/enrichify/discussions)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
