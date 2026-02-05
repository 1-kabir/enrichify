# Enrichify 🔍✨

**Open-source, multi-agent data enrichment for leads and professional data.**

Turn raw web data into **verified, structured, and actionable** leads—using **any search provider** (Exa, Tavily, Brave, etc.) with **Bring Your Own Key (BYOK)** support.

---

## 🚀 **What is Enrichify?**

Enrichify is a **scalable, self-hostable** system for:
- **Enriching leads** (emails, social profiles, company data)
- **Aggregating search results** from multiple providers
- **Processing with AI/LLM** for data verification and enrichment
- **Bring Your Own Key (BYOK)** – Use your existing API keys for any provider

**100% open-source** – No locked features. Deploy anywhere.

---

## 🛠️ **Features**

✅ **Multi-Provider Search** – Exa, Tavily, Brave, Serper, SearXNG, or add your own  
✅ **Multi-Provider LLM** – OpenAI, Claude, Gemini, Groq, Mistral, OpenRouter, or custom  
✅ **Bring Your Own Key (BYOK)** – Securely use your API keys  
✅ **Queue System** – Async job processing with retries (BullMQ)  
✅ **Real-time Chat** – WebSocket-powered conversations  
✅ **Data Export** – CSV, JSON, and custom formats  
✅ **Self-Hostable** – Run locally or deploy with Docker  
✅ **Extensible** – Add new providers in minutes  

---

## 🤖 **Supported Providers**

### LLM Providers
Built-in exclusive integrations:
- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic Claude** (Claude 3 Opus, Sonnet, Haiku)
- **Google Gemini** (Pro)
- **Groq** (Mixtral, LLaMA)
- **Mistral** (Mistral Large)
- **OpenRouter** (Multi-model proxy)
- **OpenAI-compatible** (Local models, vLLM, etc.)

### Search Providers
Built-in integrations:
- **Exa** – AI-powered semantic search
- **Tavily** – Search & research API
- **Brave Search** – Privacy-focused search
- **Serper** – Google search API
- **SearXNG** – Self-hosted metasearch engine

> **Want to add a custom provider?** See [Adding LLM Providers](docs/development/ADDING_LLM_PROVIDERS.md) or [Adding Search Providers](docs/development/ADDING_SEARCH_PROVIDERS.md).

---

## 📁 **Project Structure**

```
enrichify/
├── frontend/                   # Next.js React application
│   ├── app/                    # App Router pages
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utility functions & API client
│   └── package.json
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── modules/            # Feature modules (auth, chat, websets, etc.)
│   │   ├── providers/          # LLM & Search provider integrations
│   │   ├── entities/           # TypeORM database entities
│   │   └── main.ts             # Application entry point
│   └── package.json
├── shared/                     # Shared types/interfaces
├── docker/                     # Docker configurations
├── docs/                       # Developer & contribution guides
├── config.yml.example          # Configuration template
├── .env.example                # Environment variables template
└── docker-compose.yml          # Local development orchestration
```

---

## 🚀 **Quick Start**

### Prerequisites

Before starting, ensure you have:
- Docker and Docker Compose installed
- API keys for at least one LLM provider (OpenAI, Anthropic, etc.)
- API keys for at least one search provider (Tavily, Exa, etc.)

### Understanding the BYOK Model

Enrichify uses a **Bring Your Own Key (BYOK)** model, meaning you provide your own API keys for LLM and search providers. This ensures:
- You maintain control over your API usage and billing
- No third-party access to your API keys
- Direct payment to providers for services used

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd enrichify

# Create environment file
cp .env.example .env

# Edit .env and add your API keys
# See detailed configuration below
nano .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3001
```

> For detailed setup instructions, see [Quick Start Guide](docs/guides/QUICKSTART.md)

### Configuration Guide

#### Required Environment Variables

**Database Configuration:**
- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name

**Redis Configuration:**
- `REDIS_HOST`: Redis server hostname
- `REDIS_PORT`: Redis server port

**Authentication:**
- `JWT_SECRET`: Secret key for JWT token signing (use a strong, random string)

**Provider API Keys (BYOK Model):**
- At least one LLM provider key (OpenAI, Anthropic, etc.)
- At least one search provider key (Tavily, Exa, etc.)

#### Setting Up API Keys

**LLM Providers:**
1. **OpenAI**: Visit [platform.openai.com](https://platform.openai.com/) to get your API key
2. **Anthropic Claude**: Visit [anthropic.com](https://www.anthropic.com/) for API access
3. **Google Gemini**: Visit [ai.google.dev](https://ai.google.dev/) for API access
4. **Other providers**: Refer to individual provider documentation

**Search Providers:**
1. **Tavily**: Visit [tavily.com](https://tavily.com/) for API access
2. **Exa**: Visit [exa.ai](https://exa.ai/) for API access
3. **Brave Search**: Visit [brave.com/search/api](https://brave.com/search/api/) for API access
4. **Serper**: Visit [serper.dev](https://serper.dev/) for API access

> For complete configuration documentation, see [Deployment Guide](docs/DEPLOYMENT.md)

### Reverse Proxy Configuration

For production deployments, configure a reverse proxy (Nginx, Apache, etc.) to handle SSL termination and route traffic to the appropriate services. See the [Deployment Guide](docs/DEPLOYMENT.md) for detailed configuration examples.

---

## 📖 **Documentation**

### User Guides
- **[Quick Start Guide](docs/guides/QUICKSTART.md)** – Setup, installation, and getting started

### Development
- **[Architecture](docs/ARCHITECTURE.md)** – System architecture and design
- **[Deployment Guide](docs/DEPLOYMENT.md)** – Production deployment instructions
- **[Contributing](CONTRIBUTING.md)** – How to contribute to the project
- **[Adding LLM Providers](docs/development/ADDING_LLM_PROVIDERS.md)** – Guide for adding custom LLM providers
- **[Adding Search Providers](docs/development/ADDING_SEARCH_PROVIDERS.md)** – Guide for adding custom search providers

### API Reference
- **[API Documentation](docs/api/README.md)** – Complete REST API and WebSocket documentation

---

## 🏗️ **Architecture**

**Tech Stack:**
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, BullMQ
- **Infrastructure**: Docker, Docker Compose

**Key Components:**
- **API**: RESTful endpoints for providers, websets, chat, and exports
- **Real-time**: WebSocket gateway for live chat and updates
- **Queue System**: BullMQ for async enrichment jobs
- **Database**: PostgreSQL for structured data, Redis for caching & queues
- **Auth**: JWT-based authentication with role-based access control (RBAC)

---

## 🤝 **Contributing**

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Want to add a new LLM or Search provider? Check the provider-specific guides:
- [Adding LLM Providers](docs/development/ADDING_LLM_PROVIDERS.md)
- [Adding Search Providers](docs/development/ADDING_SEARCH_PROVIDERS.md)

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.