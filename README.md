# Enrichify 🔍✨

**Open-source, multi-agent data enrichment for leads and professional data.**

Turn raw web data into **verified, structured, and actionable** leads—using **any search provider** (Exa, Tavily, Google, etc.) with **Bring Your Own Key (BYOK)** support.

---

## 🚀 **What is Enrichify?**
Enrichify is a **scalable, self-hostable** system for:
- **Enriching leads** (emails, social profiles, company data).
- **Aggregating search results** from multiple providers (Exa, Firecrawl, Google, etc.).
- **Verifying data** with customizable agents.
- **Bring Your Own Key (BYOK)** – Use your existing API keys for any provider.

**100% open-source** – No locked features. Deploy anywhere.

---

## 🛠️ **Features**
✅ **Multi-Provider Search** – Plug in Exa, Tavily, Google, or add your own.
✅ **Bring Your Own Key (BYOK)** – Securely use your API keys.
✅ **Queue System** – Async job processing with retries.
✅ **Self-Hostable** – Run locally or deploy with Docker.
✅ **Extensible** – Add new providers in minutes.

---

## 📋 **About Exa Websets**

Exa Websets is an AI-powered data search and enrichment platform designed for professionals who need exact, verified data results. It transforms the internet into a structured dataset that can be filtered and searched using natural language queries.

### Key Capabilities:
- **Semantic Search**: Find relevant information using natural language instead of keywords
- **Structured Data Extraction**: Extract structured data from web pages into tabular formats
- **Data Verification**: AI-powered validation of extracted information
- **Customizable Filters**: Apply multiple criteria to refine search results
- **API Access**: Programmatically access and manipulate datasets
- **Large-Scale Processing**: Handle tens of thousands of results efficiently

### Core Features:
- Natural language semantic search
- Structured "Webset" tables with enrichment columns
- Multiple search modes and filtering options
- Support for parsing over 1000 web pages
- Advanced search capabilities for complex queries

Enrichify aims to provide an open-source, self-hostable alternative to Exa Websets with similar capabilities but with the flexibility of BYOK (Bring Your Own Keys) and extensibility to support multiple search providers.

---

## 🏗️ **Architecture**

The project follows a microservices architecture with:

- **Frontend**: Next.js application with TypeScript, Tailwind CSS, shadcn/ui, and modern UI components
- **Backend**: NestJS API server with PostgreSQL database
- **Queue System**: BullMQ for handling asynchronous jobs and data processing
- **Database**: PostgreSQL for storing structured data and metadata
- **Deployment**: Docker Compose for easy local development and deployment

---

## 🚀 **Getting Started**

### Prerequisites
- Docker & Docker Compose v2
- Node.js (for local development)
- PostgreSQL client (optional)

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd enrichify

# Start the services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

---

## 📁 **Project Structure**

```
enrichify/
├── docker-compose.yml          # Docker orchestration
├── frontend/                   # Next.js frontend application
│   ├── app/                    # App Router pages
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utility functions
│   ├── public/                 # Static assets
│   └── package.json            # Dependencies
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── app.module.ts       # Main application module
│   │   ├── main.ts             # Application entry point
│   │   ├── controllers/        # API controllers
│   │   ├── services/           # Business logic services
│   │   └── entities/           # Database entities
│   └── package.json            # Dependencies
├── shared/                     # Shared types and utilities
└── docker/
    ├── postgres/               # PostgreSQL configuration
    └── redis/                  # Redis configuration for BullMQ
```

---

## 🤝 **Contributing**

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.