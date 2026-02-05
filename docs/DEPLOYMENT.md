# Deployment Guide

This guide covers deploying Enrichify in various environments with comprehensive configuration documentation.

## Understanding the BYOK Model

Enrichify uses a **Bring Your Own Key (BYOK)** model, meaning you provide your own API keys for LLM and search providers. This ensures:
- You maintain control over your API usage and billing
- No third-party access to your API keys
- Direct payment to providers for services used
- Enhanced privacy and compliance

## Prerequisites

- Docker and Docker Compose installed
- Domain name (for production)
- SSL certificate (for production)
- API keys for at least one LLM provider (OpenAI, Anthropic, etc.)
- API keys for at least one search provider (Tavily, Exa, etc.)

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Required Variables

#### Application Configuration
```bash
# Application
NODE_ENV=production                 # Environment mode (development, production, test)
PORT=3001                           # Backend server port
FRONTEND_PORT=8080                  # Frontend server port (for development)
BACKEND_PORT=3001                   # Backend server port (for development)

# Frontend (Next.js)
NEXT_PUBLIC_API_URL=https://yourdomain.com  # API URL accessible to frontend (use domain in production)
```

#### Database Configuration
```bash
# Database Configuration
# For production, use strong passwords and secure connection strings
DATABASE_URL=postgresql://enrichify:your_secure_password@postgres:5432/enrichify  # Full connection string
DATABASE_HOST=postgres              # Database host (use IP or domain in production)
DATABASE_PORT=5432                  # Database port
DATABASE_USER=enrichify             # Database username
DATABASE_PASSWORD=your_secure_password  # Database password (use strong password in production)
DATABASE_NAME=enrichify             # Database name
POSTGRES_DB=enrichify               # Database name for Docker initialization
POSTGRES_USER=enrichify             # Database user for Docker initialization
POSTGRES_PASSWORD=your_secure_password  # Database password for Docker initialization
```

#### Redis Configuration
```bash
# Redis Configuration
# For production, use password authentication and secure connections
REDIS_HOST=redis                   # Redis host (use IP or domain in production)
REDIS_PORT=6379                    # Redis port
# REDIS_PASSWORD=your_redis_password  # Uncomment and set if Redis requires password authentication
```

#### JWT Authentication
```bash
# JWT Authentication
# Generate a strong secret key for production (at least 32 characters)
JWT_SECRET=your_strong_secret_key_here  # Secret key for signing JWT tokens (minimum 32 characters)
JWT_EXPIRES_IN=7d                  # Token expiration time (e.g., 7d, 24h, 60m)
```

### Provider API Keys (BYOK Model)

#### LLM Provider API Keys
```bash
# LLM Providers (Bring Your Own Key - BYOK Model)
# To use these providers, you need to obtain API keys from their respective platforms
# The BYOK model means you pay for the API usage directly to the provider
# Enrichify does not store or transmit your API keys to any third party

# OpenAI Provider
# Sign up at: https://platform.openai.com/
# Required permissions: API access
OPENAI_API_KEY=sk-...              # Your OpenAI API key (starts with sk-...)

# Anthropic Claude Provider
# Sign up at: https://www.anthropic.com/
# Required permissions: API access
ANTHROPIC_API_KEY=sk-ant-...       # Your Anthropic API key (starts with sk-ant-...)

# Google Gemini Provider
# Sign up at: https://ai.google.dev/
# Required permissions: API access with billing enabled
GOOGLE_API_KEY=AI...               # Your Google API key (starts with AI...)

# Groq Provider
# Sign up at: https://console.groq.com/
# Required permissions: API access
GROQ_API_KEY=gsk_...               # Your Groq API key (starts with gsk_...)

# OpenRouter Provider
# Sign up at: https://openrouter.ai/
# Required permissions: API access
OPENROUTER_API_KEY=sk-or-...       # Your OpenRouter API key (starts with sk-or-...)

# Mistral Provider
# Sign up at: https://docs.mistral.ai/
# Required permissions: API access
MISTRAL_API_KEY=...                # Your Mistral API key
```

#### Search Provider API Keys
```bash
# Search Providers (Bring Your Own Key - BYOK Model)
# Similar to LLM providers, you need to obtain API keys from these platforms
# The BYOK model ensures you maintain control over your API usage and billing

# Exa Search Provider
# Sign up at: https://exa.ai/
# Required permissions: API access
EXA_API_KEY=...                    # Your Exa API key

# Brave Search Provider
# Sign up at: https://brave.com/search/api/
# Required permissions: API access
BRAVE_API_KEY=...                  # Your Brave API key

# Tavily Search Provider
# Sign up at: https://tavily.com/
# Required permissions: API access
TAVILY_API_KEY=tvly-...            # Your Tavily API key (starts with tvly-...)

# Serper Search Provider
# Sign up at: https://serper.dev/
# Required permissions: API access
SERPER_API_KEY=...                 # Your Serper API key
```

#### Admin User Configuration
```bash
# Admin User (created on first startup if user doesn't exist)
# Change these default credentials immediately after first login in production
ADMIN_USERNAME=admin              # Default admin username
ADMIN_EMAIL=admin@yourdomain.com  # Default admin email
ADMIN_PASSWORD=your_secure_password  # Default admin password (change in production!)
```

### Advanced Configuration
```bash
# Advanced Configuration
# BULLMQ_REDIS_URL=redis://redis:6379  # Redis connection string for BullMQ (if different from above)
# LOG_LEVEL=info                      # Logging level (error, warn, info, debug, verbose, silly)
# MAX_ENRICHMENT_ROWS=10000          # Maximum number of rows that can be enriched in a single job
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

**Important Configuration Notes:**
- Set `NODE_ENV=production` for production deployments
- Configure `NEXT_PUBLIC_API_URL` to your domain (e.g., `https://yourdomain.com`)
- Set strong passwords for database and Redis
- Generate a secure JWT secret (at least 32 random characters)
- Add your API keys for LLM and search providers (BYOK model)

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
# Frontend: http://localhost:8080 (or your domain)
# Backend: http://localhost:3001 (or your domain/api)
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
export NODE_ENV=production
export DATABASE_URL=postgresql://user:password@localhost:5432/enrichify
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=your_strong_secret_key_here
export PORT=3001
export NEXT_PUBLIC_API_URL=https://yourdomain.com

# Start backend
npm run start:prod
```

#### Step 4: Frontend Setup

```bash
cd frontend
npm install
npm run build

# Set environment variables
export NEXT_PUBLIC_API_URL=https://yourdomain.com

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
  --from-literal=password=your_secure_password \
  -n enrichify

# Create Redis secret (if using password authentication)
kubectl create secret generic enrichify-redis \
  --from-literal=password=your_redis_password \
  -n enrichify

# Create JWT secret
kubectl create secret generic enrichify-jwt \
  --from-literal=secret=your_strong_jwt_secret \
  -n enrichify

# Create provider API keys secret
kubectl create secret generic enrichify-api-keys \
  --from-literal=openai-key=sk-... \
  --from-literal=anthropic-key=sk-ant-... \
  --from-literal=tavily-key=tvly-... \
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
        # Uncomment the following lines if using password authentication
        # command: ["redis-server", "--requirepass", "$(REDIS_PASSWORD)"]
        # env:
        # - name: REDIS_PASSWORD
        #   valueFrom:
        #     secretKeyRef:
        #       name: enrichify-redis
        #       key: password
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
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: enrichify-db
              key: database_url  # You'll need to create this in the secret
        - name: REDIS_HOST
          value: "redis.enrichify.svc.cluster.local"
        - name: REDIS_PORT
          value: "6379"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: enrichify-jwt
              key: secret
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.yourdomain.com"
        # Add more environment variables as needed from enrichify-api-keys secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
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
        - containerPort: 80
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.yourdomain.com"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: enrichify-frontend
  namespace: enrichify
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
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
    nginx.ingress.kubernetes.io/configuration-snippet: |
      proxy_set_header Accept-Encoding "";
      gzip on;
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - yourdomain.com
    - www.yourdomain.com
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
              number: 80
  - host: www.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: enrichify-frontend
            port:
              number: 80
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
6. **API Key Security**: Store API keys securely and rotate them regularly
7. **Access Controls**: Implement proper RBAC (Role-Based Access Control)

### Performance

1. **Database Optimization**:
   - Enable connection pooling
   - Add appropriate indexes
   - Regular VACUUM and ANALYZE
   - Monitor slow queries

2. **Redis Configuration**:
   - Set maxmemory policy
   - Enable persistence if needed
   - Configure eviction policy
   - Monitor memory usage

3. **Application**:
   - Enable caching
   - Use Redis for session storage
   - Configure rate limiting
   - Optimize API responses

### Monitoring

1. **Application Monitoring**:
   - Set up health check endpoints (`/health`)
   - Monitor API response times
   - Track error rates
   - Monitor provider API usage

2. **Infrastructure Monitoring**:
   - Database performance metrics
   - Redis memory usage
   - Container resource usage
   - Network traffic

3. **Logging**:
   - Centralized logging (ELK stack, CloudWatch, etc.)
   - Log rotation
   - Error tracking (Sentry, etc.)
   - Audit logs for security

### Backup & Recovery

1. **Database Backups**:
   ```bash
   # Automated backup script
   docker exec postgres pg_dump -U enrichify enrichify > backup_$(date +%Y%m%d).sql
   ```

2. **Redis Backups**:
   - Configure Redis persistence (AOF or RDB)
   - Regular snapshot backups

3. **Configuration Backups**:
   - Version control for environment files (without secrets)
   - Backup of Kubernetes configurations

4. **Recovery Testing**:
   - Test restoration procedures regularly
   - Document recovery steps
   - Validate data integrity after recovery

## Scaling

### Horizontal Scaling

1. **Backend**: Add more instances (stateless)
2. **Frontend**: Add more instances
3. **Database**: Read replicas for read-heavy workloads
4. **Redis**: Redis Cluster for high availability
5. **Load Balancing**: Distribute traffic across instances

### Vertical Scaling

1. Increase container resources (CPU, memory)
2. Optimize database queries
3. Add indexes to frequently queried tables
4. Upgrade hardware resources

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

#### Provider API Issues

- Verify API keys are correctly configured
- Check rate limits with providers
- Validate API key permissions
- Review provider-specific documentation

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
- Join our community Discord (if available)

## Reverse Proxy Configuration

When deploying Enrichify in production, you'll typically want to set up a reverse proxy to handle SSL termination, load balancing, and routing. Here's how to configure popular reverse proxy solutions:

### Nginx Configuration

Create an Nginx configuration file (e.g., `/etc/nginx/sites-available/enrichify`):

```nginx
# Main application server block
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:8080;  # Frontend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;  # Backend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket proxy for real-time features
    location /enrichment {
        proxy_pass http://localhost:3001;  # Backend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Separate server block for API subdomain (optional)
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # API proxy
    location / {
        proxy_pass http://localhost:3001;  # Backend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket proxy for real-time features
    location /enrichment {
        proxy_pass http://localhost:3001;  # Backend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/enrichify /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Apache Configuration

If using Apache as a reverse proxy, add this to your virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key

    # Security Headers
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options nosniff

    # Frontend proxy
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3001
    ProxyPassReverse /api http://localhost:3001
    ProxyPass /enrichment http://localhost:3001
    ProxyPassReverse /enrichment http://localhost:3001
    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/

    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3001/$1" [P,L]

    # Timeouts
    ProxyTimeout 60
</VirtualHost>
```

### Important Notes for Reverse Proxy Configuration

1. **WebSocket Support**: Ensure your reverse proxy is configured to handle WebSocket connections for real-time features.

2. **Headers**: Properly set headers to preserve client information and enable security features.

3. **Timeouts**: Configure appropriate timeouts for different types of requests.

4. **SSL Termination**: Handle SSL termination at the proxy level for better performance.

5. **Health Checks**: Configure your proxy to perform health checks on the backend services.

## Provider-Specific Configuration

### OpenAI Configuration
- Recommended models: gpt-4, gpt-3.5-turbo
- Monitor token usage for cost management
- Set up billing alerts

### Anthropic Claude Configuration
- Recommended models: claude-3-opus, claude-3-sonnet
- Understand Claude's unique capabilities
- Monitor usage for cost management

### Google Gemini Configuration
- Enable billing in Google Cloud Console
- Configure API quotas appropriately
- Understand Gemini's strengths

### Search Provider Configuration
- Tavily: Good for research tasks
- Exa: Semantic search capabilities
- Brave: Privacy-focused search
- Serper: Google search alternative

Each provider has different rate limits, pricing, and capabilities. Review their documentation for optimal configuration.