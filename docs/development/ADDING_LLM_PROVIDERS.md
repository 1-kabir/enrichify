# Adding Custom LLM Providers

This guide explains how to add a new Large Language Model (LLM) provider to Enrichify.

---

## 📋 Overview

Enrichify supports two types of LLM integrations:

1. **OpenAI-Compatible** (Easy) – Providers that support the OpenAI API format
2. **Custom Exclusive** (Advanced) – Providers with unique SDKs or API signatures

---

## 🟢 Option 1: OpenAI-Compatible Providers (Easy)

If your provider supports the OpenAI API format, use the `openai-compatible` type:

### Example: vLLM, Together AI, or Any OpenAI-Clone

**In `config.yml.example`:**
```yaml
providers:
  llm:
    - name: vLLM (Local)
      type: openai-compatible
      endpoint: http://localhost:8000/v1
      isActive: false
      config:
        defaultModel: meta-llama/Llama-2-7b-hf
      rateLimit: 100
```

**In `.env.example`:**
```env
# For OpenAI-compatible endpoints, use the endpoint URL
# No separate API key needed if running locally
```

No code changes needed! The backend will automatically handle it.

---

## 🔴 Option 2: Custom Exclusive Provider (Advanced)

For providers with unique SDKs or API formats (e.g., Mistral, Claude), follow this guide.

### Step 1: Add Provider Type to Enum

**File:** `backend/src/entities/llm-provider.entity.ts`

```typescript
export enum LLMProviderType {
  OPENAI = 'openai',
  OPENAI_COMPATIBLE = 'openai-compatible',
  CLAUDE = 'claude',
  // ... other providers
  MYPROVIDER = 'myprovider',  // ← Add your provider
}
```

### Step 2: Create Provider Service

Create a new service file: `backend/src/providers/llm/providers/myprovider.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyProviderService {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint?: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint || 'https://api.myprovider.com/v1';
  }

  /**
   * Call the model to generate text
   * Must implement this interface
   */
  async complete(
    prompt: string,
    model?: string,
    temperature?: number,
  ): Promise<string> {
    // Call your provider's API
    const response = await fetch(`${this.endpoint}/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'default-model',
        prompt: prompt,
        temperature: temperature || 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    return data.completion || data.choices[0].text;
  }

  /**
   * Stream responses (optional)
   */
  async completeStream(
    prompt: string,
    model?: string,
    temperature?: number,
  ) {
    // Return an async generator or stream
    const response = await fetch(`${this.endpoint}/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'default-model',
        prompt: prompt,
        temperature: temperature || 0.7,
        stream: true,
      }),
    });

    // Implement streaming logic
    // ...
  }
}
```

### Step 3: Update LLM Providers Service

**File:** `backend/src/providers/llm/llm-providers.service.ts`

Add import:
```typescript
import { MyProviderService } from './providers/myprovider.service';
```

Add instantiation method:
```typescript
private getMyProviderClient(provider: LLMProvider): MyProviderService {
  return new MyProviderService(provider.apiKey, provider.endpoint);
}
```

Update the `getClient()` method to include your provider:
```typescript
async getClient(provider: LLMProvider): Promise<any> {
  switch (provider.type) {
    case LLMProviderType.OPENAI:
      return this.getOpenAIClient(provider);
    case LLMProviderType.CLAUDE:
      return this.getClaudeClient(provider);
    // ... other cases
    case LLMProviderType.MYPROVIDER:  // ← Add this
      return this.getMyProviderClient(provider);
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`);
  }
}
```

### Step 4: Update Configuration Example

**File:** `config.yml.example`

```yaml
providers:
  llm:
    # ... existing providers
    - name: My Custom Provider
      type: myprovider
      endpoint: https://api.myprovider.com/v1
      apiKey: ${MYPROVIDER_API_KEY}
      isActive: false
      config:
        defaultModel: my-large-model
      rateLimit: 80
      dailyLimit: 1200
```

**File:** `.env.example`

```env
MYPROVIDER_API_KEY=your-api-key-here
```

### Step 5: Install Dependencies (if needed)

If your provider has an official SDK:

```bash
cd backend
npm install @myprovider/sdk
```

Then update `backend/src/providers/llm/providers/myprovider.service.ts` to use it:

```typescript
import { MyProvider } from '@myprovider/sdk';

@Injectable()
export class MyProviderService {
  private client: MyProvider;

  constructor(apiKey: string, endpoint?: string) {
    this.client = new MyProvider({
      apiKey,
      endpoint,
    });
  }

  async complete(prompt: string, model?: string, temperature?: number): Promise<string> {
    const response = await this.client.complete({
      prompt,
      model: model || 'default',
      temperature: temperature || 0.7,
    });
    return response.text;
  }
}
```

### Step 6: Testing Your Provider

Create a test file: `backend/src/providers/llm/providers/myprovider.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyProviderService } from './myprovider.service';

describe('MyProviderService', () => {
  let service: MyProviderService;

  beforeEach(() => {
    service = new MyProviderService('test-key');
  });

  it('should call the API and return a response', async () => {
    const result = await service.complete('Hello, world!');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
```

Run tests:
```bash
cd backend
npm run test -- providers/llm/providers/myprovider.service
```

---

## 📝 Common Patterns

### Handling API Errors

```typescript
async complete(prompt: string, model?: string, temperature?: number): Promise<string> {
  try {
    const response = await fetch(`${this.endpoint}/completions`, {
      // ...
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.completion;
  } catch (error) {
    throw new Error(`MyProvider API Error: ${error.message}`);
  }
}
```

### Rate Limiting

Use the `rateLimit` and `dailyLimit` fields in the provider config:

```yaml
providers:
  llm:
    - name: My Provider
      type: myprovider
      rateLimit: 60        # 60 requests per minute
      dailyLimit: 1000     # 1000 requests per day
```

The backend automatically enforces these limits.

### Handling Streaming

For streaming responses, return an async generator:

```typescript
async *completeStream(
  prompt: string,
  model?: string,
  temperature?: number,
): AsyncGenerator<string> {
  const response = await fetch(`${this.endpoint}/completions`, {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      stream: true,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    yield text;
  }
}
```

---

## 🧪 Integration Testing

Test your provider with the existing chat or enrichment modules:

```bash
cd backend
npm run test:e2e
```

To test specifically with your new provider, update the test config:

```typescript
describe('Chat with MyProvider', () => {
  it('should send a message and get a response', async () => {
    const provider = new MyProviderService('test-key');
    const response = await provider.complete('What is 2+2?');
    expect(response).toContain('4');
  });
});
```

---

## 🚀 Submitting Your Provider

1. **Fork the repo** and create a feature branch:
   ```bash
   git checkout -b feat/add-myprovider
   ```

2. **Make your changes** following the steps above

3. **Test thoroughly**:
   ```bash
   npm test
   npm run lint
   ```

4. **Submit a Pull Request** with:
   - Description of the provider
   - Link to the provider's API docs
   - Example configuration
   - Test coverage

We'll review and merge! 🎉

---

## 📚 Example Providers

See how existing providers are implemented:

- **OpenAI-compatible**: `backend/src/providers/llm/llm-providers.service.ts` (search for `openai-compatible`)
- **Mistral**: Search for `mistral` in the codebase
- **Groq**: Search for `groq` in the codebase

---

## ❓ Questions?

- Check [GitHub Issues](https://github.com/1-kabir/enrichify/issues)
- Start a [GitHub Discussion](https://github.com/1-kabir/enrichify/discussions)
- Review the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
