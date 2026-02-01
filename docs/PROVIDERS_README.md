# Provider Configuration and Management System

This document describes the provider configuration and management system for Enrichify.

## Overview

The provider system supports multiple LLM (Language Model) and Search providers with automatic retry logic, rate limiting, and usage tracking.

## Supported Providers

### LLM Providers
- **OpenAI** - GPT-3.5, GPT-4, and other OpenAI models
- **Claude** - Anthropic's Claude models (Sonnet, Opus, Haiku)
- **Gemini** - Google's Gemini Pro and other models
- **Groq** - Fast inference with Mixtral and Llama models
- **OpenRouter** - Access to multiple models through a single API
- **Vercel AI Gateway** - Managed AI gateway for various providers
- **OpenAI-Compatible** - Any OpenAI-compatible endpoint

### Search Providers
- **Exa** - AI-powered search with semantic understanding
- **Brave** - Privacy-focused search API
- **Bing** - Microsoft Bing Search API
- **Google** - Google Custom Search API
- **Firecrawl** - Web scraping with markdown output
- **Tavily** - Research-focused search API
- **Serper** - Google search results API
- **Jina** - AI-powered search and reader
- **SearXNG** - Self-hosted meta-search engine

## Installation

The required dependencies are already installed via npm:

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai axios js-yaml
```

## Configuration

### Environment Variables

Set provider API keys and configuration via environment variables:

```bash
# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...

# Search Providers
EXA_API_KEY=...
BRAVE_API_KEY=...
BING_API_KEY=...
TAVILY_API_KEY=...
SERPER_API_KEY=...
```

### YAML Configuration

Alternatively, use `config.yml` for configuration:

```yaml
providers:
  llm:
    - name: OpenAI GPT-4
      type: openai
      apiKey: ${OPENAI_API_KEY}
      isActive: true
      config:
        defaultModel: gpt-4
      rateLimit: 60
      dailyLimit: 1000
  
  search:
    - name: Exa
      type: exa
      apiKey: ${EXA_API_KEY}
      isActive: true
      rateLimit: 30
```

See `config.yml.example` for a complete example.

## API Endpoints

### LLM Providers

#### Create Provider
```http
POST /api/llm-providers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "OpenAI GPT-4",
  "type": "openai",
  "apiKey": "sk-...",
  "isActive": true,
  "config": {
    "defaultModel": "gpt-4"
  },
  "rateLimit": 60,
  "dailyLimit": 1000
}
```

#### List Providers
```http
GET /api/llm-providers
Authorization: Bearer <token>
```

#### Get Active Providers
```http
GET /api/llm-providers/active
Authorization: Bearer <token>
```

#### Get Provider
```http
GET /api/llm-providers/:id
Authorization: Bearer <token>
```

#### Update Provider
```http
PUT /api/llm-providers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "isActive": false,
  "rateLimit": 30
}
```

#### Delete Provider
```http
DELETE /api/llm-providers/:id
Authorization: Bearer <token>
```

#### Make LLM Request
```http
POST /api/llm-providers/:id/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 1000
}
```

### Search Providers

#### Create Provider
```http
POST /api/search-providers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Exa Search",
  "type": "exa",
  "apiKey": "...",
  "isActive": true,
  "rateLimit": 30,
  "dailyLimit": 500
}
```

#### List Providers
```http
GET /api/search-providers
Authorization: Bearer <token>
```

#### Search
```http
POST /api/search-providers/:id/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "artificial intelligence",
  "numResults": 10,
  "includeText": true
}
```

## Database Schema

### LLMProvider Entity
- `id` - UUID primary key
- `name` - Provider name
- `type` - Provider type (openai, claude, gemini, etc.)
- `endpoint` - API endpoint (optional)
- `apiKey` - API key (encrypted in production)
- `isActive` - Active status
- `config` - JSONB configuration
- `rateLimit` - Requests per minute
- `dailyLimit` - Requests per day
- `createdAt`, `updatedAt` - Timestamps

### SearchProvider Entity
- `id` - UUID primary key
- `name` - Provider name
- `type` - Provider type (exa, brave, bing, etc.)
- `endpoint` - API endpoint (optional)
- `apiKey` - API key (encrypted in production)
- `isActive` - Active status
- `config` - JSONB configuration
- `rateLimit` - Requests per minute
- `dailyLimit` - Requests per day
- `createdAt`, `updatedAt` - Timestamps

### ProviderUsage Entity
- `id` - UUID primary key
- `type` - Usage type (llm or search)
- `llm_provider_id` - Foreign key to LLMProvider
- `search_provider_id` - Foreign key to SearchProvider
- `user_id` - Foreign key to User
- `requestCount` - Number of requests
- `tokensUsed` - Tokens consumed (LLM only)
- `metadata` - JSONB additional data
- `createdAt` - Timestamp

## Rate Limiting

The system implements three levels of rate limiting:

1. **Provider Rate Limit** - Requests per minute per provider
2. **Provider Daily Limit** - Requests per day per provider
3. **User Rate Limit** - Can be configured per user

When a rate limit is exceeded, the API returns a 429 (Too Many Requests) status.

## Retry Logic

All provider requests include automatic retry logic with exponential backoff:
- Default: 3 retry attempts
- Backoff: 2^attempt seconds (1s, 2s, 4s)
- Configurable per request

## Usage Tracking

All provider requests are tracked in the `provider_usage` table:
- Request counts
- Token usage (for LLM providers)
- Metadata (model, finish reason, etc.)
- User attribution

Usage data can be queried for analytics and billing purposes.

## Error Handling

The system provides comprehensive error handling:
- Invalid API keys
- Rate limit exceeded
- Provider unavailable
- Invalid requests
- Network errors

All errors include detailed messages and appropriate HTTP status codes.

## Security

### API Key Protection
- API keys should be stored securely
- Consider encrypting API keys in the database for production
- Use environment variables or secure vaults for sensitive data

### Access Control
- Provider management requires ADMIN role
- Provider usage requires authentication
- All endpoints protected by JWT authentication

## Development

### Adding a New LLM Provider

1. Add provider type to `LLMProviderType` enum
2. Implement provider-specific logic in `LLMProvidersService.executeRequest()`
3. Create client initialization method if needed
4. Update documentation

### Adding a New Search Provider

1. Add provider type to `SearchProviderType` enum
2. Implement provider-specific search in `SearchProvidersService.executeSearch()`
3. Map provider response to standard `SearchResponse` format
4. Update documentation

## Testing

Test provider functionality:

```bash
# Start the backend
npm run start:dev

# Create a provider via API
curl -X POST http://localhost:3000/api/llm-providers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Provider","type":"openai","apiKey":"sk-..."}'

# Make a test request
curl -X POST http://localhost:3000/api/llm-providers/:id/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}]}'
```

## Monitoring

Monitor provider usage and performance:
- Query `provider_usage` table for statistics
- Check rate limit enforcement
- Monitor error rates
- Track token consumption

## Best Practices

1. **Set Appropriate Rate Limits** - Prevent abuse and control costs
2. **Use Daily Limits** - Cap spending per provider
3. **Monitor Usage** - Track consumption patterns
4. **Handle Errors Gracefully** - Implement fallbacks for provider failures
5. **Rotate API Keys** - Update keys regularly for security
6. **Test Provider Changes** - Validate configuration before activation
7. **Use Config Files** - Manage multiple environments easily

## Support

For issues or questions:
- Check the API documentation
- Review error messages and logs
- Consult provider-specific documentation
- Report bugs via GitHub issues
