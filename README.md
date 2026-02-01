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

> **Want to add a custom provider?** See [docs/ADDING_LLM_PROVIDERS.md](docs/ADDING_LLM_PROVIDERS.md) (LLM) or [docs/ADDING_SEARCH_PROVIDERS.md](docs/ADDING_SEARCH_PROVIDERS.md) (Search).

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

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd enrichify

# Create environment file
cp .env.example .env
# Edit .env and add your API keys

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3001
```

> For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md)

---

## 📖 **Documentation**

- **[QUICKSTART.md](QUICKSTART.md)** – Setup, installation, and getting started
- **[CONTRIBUTING.md](CONTRIBUTING.md)** – How to contribute
- **[docs/ADDING_LLM_PROVIDERS.md](docs/ADDING_LLM_PROVIDERS.md)** – Guide for adding custom LLM providers
- **[docs/ADDING_SEARCH_PROVIDERS.md](docs/ADDING_SEARCH_PROVIDERS.md)** – Guide for adding custom search providers

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
- [Adding LLM Providers](docs/ADDING_LLM_PROVIDERS.md)
- [Adding Search Providers](docs/ADDING_SEARCH_PROVIDERS.md)

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.