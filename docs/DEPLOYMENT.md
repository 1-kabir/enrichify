# Deployment Guide

This guide covers deploying Enrichify in various environments.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (for production)
- SSL certificate (for production)
- API keys for LLM and search providers

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Required Variables

```bash
# Database
POSTGRES_USER=enrichify
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=enrichify
DATABASE_URL=postgresql://enrichify:your_secure_password@postgres:5432/enrichify

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Backend
PORT=3001
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_EXPIRATION=7d

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Admin User (Created on first startup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
```

### Optional Provider API Keys

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GOOGLE_API_KEY=...

# Groq
GROQ_API_KEY=gsk_...

# Mistral
MISTRAL_API_KEY=...

# OpenRouter
OPENROUTER_API_KEY=sk-or-...

# Exa Search
EXA_API_KEY=...

# Tavily Search
TAVILY_API_KEY=tvly-...

# Brave Search
BRAVE_API_KEY=...

# Serper
SERPER_API_KEY=...
```

## Deployment Options

### Option 1: Docker Compose (Recommended for Development/Small Production)

#### Step 1: Clone Repository

```bash
git clone https://github.com/1-kabir/enrichify.git
cd enrichify
```

#### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

#### Step 3: Start Services

```bash
docker-compose up -d
```

#### Step 4: Verify Deployment

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Access application
# Frontend: http://localhost:8080
# Backend: http://localhost:3001
```

#### Step 5: Create Admin User

The admin user is automatically created on first startup if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`.

Default credentials (if not configured):
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ Change the default password immediately after first login!**

### Option 2: Manual Deployment

#### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+

#### Step 1: Set Up Database

```bash
# Create PostgreSQL database
createdb enrichify

# Run migrations (if any)
cd backend
npm install
npm run migration:run
```

#### Step 2: Set Up Redis

```bash
# Start Redis server
redis-server
```

#### Step 3: Backend Setup

```bash
cd backend
npm install
npm run build

# Set environment variables
export DATABASE_URL=postgresql://user:password@localhost:5432/enrichify
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=your_secret
export PORT=3001

# Start backend
npm run start:prod
```

#### Step 4: Frontend Setup

```bash
cd frontend
npm install
npm run build

# Set environment variables
export NEXT_PUBLIC_API_URL=http://localhost:3001

# Start frontend
npm start
```

### Option 3: Kubernetes Deployment

#### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or self-hosted)
- kubectl configured
- Helm 3+ (optional but recommended)

#### Step 1: Create Namespace

```bash
kubectl create namespace enrichify
```

#### Step 2: Create Secrets

```bash
# Create database secret
kubectl create secret generic enrichify-db \
  --from-literal=username=enrichify \
  --from-literal=password=your_password \
  -n enrichify

# Create Redis secret
kubectl create secret generic enrichify-redis \
  --from-literal=password=your_redis_password \
  -n enrichify

# Create JWT secret
kubectl create secret generic enrichify-jwt \
  --from-literal=secret=your_jwt_secret \
  -n enrichify

# Create provider API keys secret
kubectl create secret generic enrichify-api-keys \
  --from-literal=openai-key=sk-... \
  --from-literal=anthropic-key=sk-ant-... \
  -n enrichify
```

#### Step 3: Deploy PostgreSQL

```yaml
# postgres-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: enrichify
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: enrichify
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: enrichify-db
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: enrichify-db
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: enrichify
spec:
  ports:
  - port: 5432
  selector:
    app: postgres
```

#### Step 4: Deploy Redis

```yaml
# redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: enrichify
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command: ["redis-server", "--requirepass", "$(REDIS_PASSWORD)"]
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: enrichify-redis
              key: password
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: enrichify
spec:
  ports:
  - port: 6379
  selector:
    app: redis
```

#### Step 5: Deploy Backend

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: enrichify-backend
  namespace: enrichify
spec:
  replicas: 2
  selector:
    matchLabels:
      app: enrichify-backend
  template:
    metadata:
      labels:
        app: enrichify-backend
    spec:
      containers:
      - name: backend
        image: your-registry/enrichify-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          value: postgresql://$(DB_USER):$(DB_PASSWORD)@postgres:5432/enrichify
        - name: REDIS_HOST
          value: redis
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: enrichify-jwt
              key: secret
        # Add more environment variables as needed
---
apiVersion: v1
kind: Service
metadata:
  name: enrichify-backend
  namespace: enrichify
spec:
  type: ClusterIP
  ports:
  - port: 3001
    targetPort: 3001
  selector:
    app: enrichify-backend
```

#### Step 6: Deploy Frontend

```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: enrichify-frontend
  namespace: enrichify
spec:
  replicas: 2
  selector:
    matchLabels:
      app: enrichify-frontend
  template:
    metadata:
      labels:
        app: enrichify-frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/enrichify-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: https://api.yourdomain.com
---
apiVersion: v1
kind: Service
metadata:
  name: enrichify-frontend
  namespace: enrichify
spec:
  type: ClusterIP
  ports:
  - port: 3000
    targetPort: 3000
  selector:
    app: enrichify-frontend
```

#### Step 7: Configure Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: enrichify-ingress
  namespace: enrichify
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - yourdomain.com
    - api.yourdomain.com
    secretName: enrichify-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: enrichify-frontend
            port:
              number: 3000
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: enrichify-backend
            port:
              number: 3001
```

#### Step 8: Apply Configurations

```bash
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml
```

## Production Considerations

### Security

1. **Use Strong Passwords**: Generate strong, random passwords for all services
2. **Enable SSL/TLS**: Use Let's Encrypt or your certificate authority
3. **Firewall Rules**: Restrict database and Redis access to backend only
4. **Environment Variables**: Never commit `.env` files
5. **Regular Updates**: Keep dependencies and Docker images updated

### Performance

1. **Database Optimization**:
   - Enable connection pooling
   - Add appropriate indexes
   - Regular VACUUM and ANALYZE

2. **Redis Configuration**:
   - Set maxmemory policy
   - Enable persistence if needed
   - Configure eviction policy

3. **Application**:
   - Enable caching
   - Use Redis for session storage
   - Configure rate limiting

### Monitoring

1. **Application Monitoring**:
   - Set up health check endpoints
   - Monitor API response times
   - Track error rates

2. **Infrastructure Monitoring**:
   - Database performance metrics
   - Redis memory usage
   - Container resource usage

3. **Logging**:
   - Centralized logging (ELK stack, CloudWatch, etc.)
   - Log rotation
   - Error tracking (Sentry, etc.)

### Backup & Recovery

1. **Database Backups**:
   ```bash
   # Automated backup script
   docker exec postgres pg_dump -U enrichify enrichify > backup_$(date +%Y%m%d).sql
   ```

2. **Redis Backups**:
   - Configure Redis persistence (AOF or RDB)
   - Regular snapshot backups

3. **Recovery Testing**:
   - Test restoration procedures regularly
   - Document recovery steps

## Scaling

### Horizontal Scaling

1. **Backend**: Add more instances (stateless)
2. **Frontend**: Add more instances
3. **Database**: Read replicas for read-heavy workloads
4. **Redis**: Redis Cluster for high availability

### Vertical Scaling

1. Increase container resources (CPU, memory)
2. Optimize database queries
3. Add indexes to frequently queried tables

## Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check service health
docker-compose ps
```

#### Database Connection Issues

```bash
# Test database connection
docker exec -it enrichify-postgres psql -U enrichify -d enrichify

# Check DATABASE_URL format
echo $DATABASE_URL
```

#### Redis Connection Issues

```bash
# Test Redis connection
docker exec -it enrichify-redis redis-cli ping

# Check Redis password
docker exec -it enrichify-redis redis-cli AUTH your_password
```

#### WebSocket Connection Issues

- Check CORS configuration in backend
- Verify WebSocket proxy settings (if using reverse proxy)
- Check firewall rules

## Maintenance

### Updating Enrichify

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose build
docker-compose up -d

# Run database migrations (if any)
docker-compose exec backend npm run migration:run
```

### Database Migrations

```bash
# Create new migration
cd backend
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Support

For deployment issues:
- Check the [Troubleshooting Guide](guides/TROUBLESHOOTING.md)
- Review [Architecture Documentation](ARCHITECTURE.md)
- Open an issue on GitHub
