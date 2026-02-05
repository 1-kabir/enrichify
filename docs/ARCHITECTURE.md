# Architecture Overview

This document provides a comprehensive overview of Enrichify's system architecture.

## System Architecture

Enrichify follows a modern microservices-inspired architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
│                    (React + Next.js)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │ App Router  │  │ Components  │  │   API Client  │        │
│  │   Pages     │  │   Library   │  │   (Axios)     │        │
│  └─────────────┘  └─────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (NestJS)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐    │
│  │   Auth   │  │  Websets │  │   Chat   │  │ Providers│    │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │    │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├─────────┤    │
│  │ Export   │  │ Health   │  │Enrichment│  │   More  │    │
│  │  Module  │  │  Module  │  │  Module  │  │ Modules │    │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │          Queue System (BullMQ)                    │      │
│  │  - Enrichment Jobs  - Retry Logic  - Scheduling  │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
            │                           │
            │                           │
            ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   PostgreSQL DB     │     │      Redis          │
│  - Users            │     │  - Queues           │
│  - Websets          │     │  - Cache            │
│  - Enrichment Data  │     │  - Sessions         │
└─────────────────────┘     └─────────────────────┘
            │
            │ External APIs
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Providers                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐    │
│  │   LLMs   │  │  Search  │  │   Data   │  │   More  │    │
│  │ OpenAI   │  │   Exa    │  │ Sources  │  │ Providers│    │
│  │ Claude   │  │  Tavily  │  │          │  │         │    │
│  │ Gemini   │  │  Brave   │  │          │  │         │    │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Component Library**: Radix UI (shadcn/ui)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Real-time**: Socket.IO Client

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Cache/Queue**: Redis + BullMQ
- **Authentication**: JWT + Passport
- **Real-time**: Socket.IO (WebSocket Gateway)
- **Validation**: class-validator, class-transformer

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx (optional)

## Core Modules

### Frontend

#### `/app` - Application Routes
- **Purpose**: Next.js App Router pages and layouts
- **Structure**: File-based routing with server/client components
- **Key Routes**:
  - `/` - Root redirect
  - `/login` - Authentication
  - `/dashboard` - Main dashboard
  - `/websets` - Data management

#### `/components` - UI Components
- **Purpose**: Reusable React components
- **Categories**:
  - `ui/` - Base UI components (buttons, inputs, cards)
  - `layout/` - Layout components (header, sidebar, app-layout)
  - `websets/` - Feature-specific components

#### `/lib` - Utilities & API Client
- **Purpose**: Helper functions and API communication
- **Key Files**:
  - `api-client.ts` - Axios instance with interceptors
  - `query-client.ts` - TanStack Query configuration

### Backend

#### Auth Module (`src/auth`)
- **Purpose**: User authentication and authorization
- **Features**:
  - JWT token generation and validation
  - Password hashing (bcrypt)
  - Login/logout endpoints
  - Protected route guards

#### Users Module (`src/users`)
- **Purpose**: User management
- **Features**:
  - User CRUD operations
  - Role-based access control (RBAC)
  - Profile management

#### Websets Module (`src/websets`)
- **Purpose**: Core data management
- **Features**:
  - Webset CRUD operations
  - Row/column management
  - Version history tracking
  - Export functionality (CSV, JSON)

#### Chat Module (`src/chat`)
- **Purpose**: Real-time chat and enrichment interactions
- **Features**:
  - WebSocket gateway
  - Message streaming
  - LLM provider integration
  - Search provider integration

#### Providers Module (`src/providers`)
- **Purpose**: External API integrations
- **Features**:
  - LLM provider abstraction (OpenAI, Claude, Gemini, etc.)
  - Search provider abstraction (Exa, Tavily, Brave, etc.)
  - Unified provider interface
  - BYOK (Bring Your Own Key) support

#### Enrichment Module (`src/enrichment`)
- **Purpose**: Asynchronous data enrichment
- **Features**:
  - BullMQ job queue
  - Retry logic
  - Progress tracking
  - Batch processing
  - Agent swarm architecture
  - Job partitioning for large datasets
  - Real-time progress updates via WebSocket
  - Automatic snapshot creation after job completion

#### Export Module (`src/export`)
- **Purpose**: Data export functionality
- **Features**:
  - CSV, XLSX, and Google Sheets export formats
  - Asynchronous export processing
  - Export status tracking
  - Download URL generation
  - File cleanup after export

#### Health Module (`src/health`)
- **Purpose**: System health monitoring
- **Features**:
  - PostgreSQL connectivity check
  - Redis connectivity check
  - Overall system status reporting
  - Individual service status reporting

## Data Flow

### Authentication Flow
```
1. User submits credentials → Frontend
2. Frontend → POST /auth/login → Backend
3. Backend validates credentials → PostgreSQL
4. Backend generates JWT token
5. Backend → JWT token → Frontend
6. Frontend stores token (localStorage/memory)
7. Frontend includes token in subsequent requests (Authorization header)
```

### Webset Enrichment Flow
```
1. User creates/imports webset → Frontend
2. Frontend → POST /websets → Backend
3. Backend stores webset → PostgreSQL
4. User triggers enrichment → Frontend
5. Frontend → POST /websets/{id}/enrich → Backend
6. Backend creates enrichment job → Redis Queue (BullMQ)
7. Worker processes job:
   a. Fetch search results → External Search API
   b. Process with LLM → External LLM API
   c. Extract structured data
   d. Update webset → PostgreSQL
8. Backend emits progress → WebSocket
9. Frontend receives updates → Real-time UI update
```

### Real-time Chat Flow
```
1. User opens chat → Frontend
2. Frontend establishes WebSocket connection → Backend
3. User sends message → WebSocket
4. Backend processes message:
   a. Optional: Query search providers
   b. Send to LLM provider (streaming)
   c. Stream response chunks → WebSocket
5. Frontend receives chunks → Real-time rendering
6. Backend saves conversation → PostgreSQL
```

### Export Flow
```
1. User initiates export → Frontend
2. Frontend → POST /export/websets/{id} → Backend
3. Backend creates export record → PostgreSQL (status: PENDING)
4. Backend processes export asynchronously:
   a. Fetch webset data → PostgreSQL
   b. Transform data to requested format (CSV/XLSX/GSheets)
   c. Save exported file to disk
   d. Update export record → PostgreSQL (status: COMPLETED, exportUrl)
5. Frontend polls for export status → GET /export/{id}
6. Frontend downloads file when ready → GET /export/{exportUrl}
```

### Health Check Flow
```
1. System/monitoring tool → GET /health → Backend
2. Backend checks PostgreSQL connectivity → SELECT 1
3. Backend checks Redis connectivity → PING
4. Backend aggregates results
5. Backend → JSON response with status details → System/monitoring tool
```

## Security Considerations

### Authentication
- JWT tokens with expiration
- Secure password hashing (bcrypt)
- HTTP-only cookies option (configurable)
- CORS configuration

### Authorization
- Role-based access control (RBAC)
- Route guards (NestJS Guards)
- Protected routes (Frontend)

### Data Protection
- Environment variable management
- Sensitive data encryption
- API key security (BYOK model)
- Input validation and sanitization

### Rate Limiting
- Configurable rate limits per endpoint
- Protection against abuse
- Redis-backed rate limiter

### Error Handling
- Comprehensive error handling for external API failures
- Specific handling for invalid API keys, rate limits, and insufficient credits
- Detailed error logging for debugging
- Graceful degradation when external services are unavailable

## Scalability

### Horizontal Scaling
- Stateless backend (can run multiple instances)
- Redis for shared state (cache, queues, sessions)
- PostgreSQL read replicas (optional)

### Vertical Scaling
- Database optimization (indexes, query optimization)
- Redis caching strategy
- Efficient queue processing

### Performance Optimization
- Frontend:
  - Code splitting
  - Image optimization
  - Static generation where possible
- Backend:
  - Connection pooling
  - Query optimization
  - Caching strategy (Redis)
  - Async processing (queues)

## Deployment

### Docker Compose (Development)
- Single-host deployment
- All services in containers
- Volume mounts for development

### Production Deployment
- Kubernetes (recommended for large scale)
- Docker Swarm (alternative)
- Separate database/Redis hosts
- Reverse proxy (Nginx/Traefik)
- SSL/TLS termination
- Health checks and monitoring

## Monitoring & Observability

### Logging
- Structured logging (JSON format)
- Log levels (debug, info, warn, error)
- Centralized log aggregation (optional)

### Metrics
- Application metrics (NestJS)
- Database metrics
- Redis metrics
- Queue metrics (BullMQ)

### Health Checks
- `/health` endpoint
- Database connectivity (PostgreSQL)
- Cache/Queue connectivity (Redis)
- Overall system status reporting
- Individual service status reporting
- External API status (optional)

## Development Workflow

### Local Development
```bash
# Start all services
docker-compose up -d

# Frontend: http://localhost:8080
# Backend: http://localhost:3001
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Adding New Features
1. Define data model (TypeORM entities)
2. Create backend module (NestJS)
3. Implement API endpoints
4. Add frontend components
5. Connect with API client
6. Test integration

### Adding New Providers
- See [Adding LLM Providers](development/ADDING_LLM_PROVIDERS.md)
- See [Adding Search Providers](development/ADDING_SEARCH_PROVIDERS.md)

## Future Enhancements

### Planned Features
- [ ] Multi-tenancy support
- [ ] Advanced analytics dashboard
- [ ] Webhook support
- [ ] API versioning
- [ ] GraphQL API (optional)
- [ ] Mobile app (React Native)

### Performance Improvements
- [ ] Query optimization
- [ ] Redis clustering
- [ ] Database sharding (if needed)
- [ ] CDN integration for static assets

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Check PostgreSQL is running
- Verify credentials in `.env`
- Check network connectivity

#### Redis Connection Errors
- Check Redis is running
- Verify Redis URL in `.env`
- Check firewall rules

#### WebSocket Connection Issues
- Check CORS configuration
- Verify WebSocket port is open
- Check reverse proxy configuration (if applicable)

#### Provider API Errors
- Verify API keys in `.env`
- Check rate limits
- Verify provider service status

#### Health Check Failures
- Check `/health` endpoint for detailed status
- Verify PostgreSQL and Redis connectivity
- Review system logs for specific error details

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Socket.IO Documentation](https://socket.io/docs/)
