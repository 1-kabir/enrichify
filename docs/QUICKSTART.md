# Enrichify Quick Start Guide

Welcome! This guide will help you get Enrichify up and running.

---

## 📋 **System Requirements**

### Minimal (Local Development)
- **CPU**: 2 cores
- **RAM**: 2GB minimum
- **Storage**: 5GB free
- **OS**: Windows, macOS, or Linux

### Recommended (Production)
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ (depends on data volume)
- **OS**: Linux (Ubuntu 20.04+, Debian 11+)

---

## 🚀 **Installation**

Choose your preferred setup method:

### Option 1: Docker Compose (Recommended)

**Prerequisites:**
- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

**Steps:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/1-kabir/enrichify.git
   cd enrichify
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` and add your API keys** (see [API Keys Setup](#api-keys-setup) below):
   ```bash
   nano .env  # or use your preferred editor
   ```

4. **Start services:**
   ```bash
   docker compose up -d
   ```

5. **Verify services are running:**
   ```bash
   docker compose ps
   ```
   
   You should see 4 containers: `frontend`, `backend`, `postgres`, `redis`

6. **Access Enrichify:**
   - **Frontend**: http://localhost:8080
   - **API**: http://localhost:3001

7. **Check logs** (if something goes wrong):
   ```bash
   docker compose logs -f backend   # Backend logs
   docker compose logs -f frontend  # Frontend logs
   ```

---

### Option 2: Local Development (Node.js)

**Prerequisites:**
- Node.js v18+ ([download](https://nodejs.org/))
- PostgreSQL 15+ ([download](https://www.postgresql.org/download/))
- Redis ([download](https://redis.io/download))

**Backend setup:**
```bash
cd backend
npm install
npm run start:dev  # Runs on port 3001
```

**Frontend setup** (new terminal):
```bash
cd frontend
npm install
npm run dev  # Runs on port 3000
```

Then access at http://localhost:3000

---

### Option 3: Cloud Deployment

Coming soon! Support for:
- Vercel (Frontend)
- Railway / Heroku (Backend)
- AWS / GCP / Azure (Infrastructure)

---

## 🔑 **API Keys Setup**

Enrichify supports multiple providers. Choose which ones you want to use.

### Getting Started (Minimal)

To just test the system, you only need **one LLM provider**:

1. **Pick an LLM provider:**
   - [OpenAI](https://platform.openai.com/api-keys) (GPT-4)
   - [Anthropic](https://console.anthropic.com/) (Claude)
   - [Google](https://makersuite.google.com/app/apikey) (Gemini)
   - [Groq](https://console.groq.com/) (Free, fast)

2. **Add to `.env`:**
   ```env
   # Example: Using Groq (free tier available)
   GROQ_API_KEY=gsk_xxxxxxxxxxxxx
   ```

3. **Start Enrichify** and create provider via UI or API

### Full Setup (Recommended)

For production use, configure multiple providers:

**LLM Providers:**
```env
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_API_KEY=xxxxx
MISTRAL_API_KEY=xxxxx
GROQ_API_KEY=gsk_xxxxx
```

**Search Providers:**
```env
EXA_API_KEY=xxxxx
TAVILY_API_KEY=xxxxx
BRAVE_API_KEY=xxxxx
SERPER_API_KEY=xxxxx
```

**Don't have all keys?** No problem! Start with what you have. You can add more later via the UI.

---

## ⚙️ **Configuration**

### Via Environment Variables

Edit `.env` file:
```bash
NODE_ENV=development
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://enrichify:password@localhost:5432/enrichify
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Via Configuration File

Edit `config.yml` (copy from `config.yml.example`):
```yaml
jwt:
  secret: your-secret-key
  expiresIn: 7d

providers:
  llm:
    - name: My OpenAI
      type: openai
      apiKey: ${OPENAI_API_KEY}
      isActive: true
      config:
        defaultModel: gpt-4
```

---

## 🎯 **First Steps After Setup**

1. **Open Frontend:** http://localhost:8080

2. **Create an Account:**
   - Click "Register"
   - Set username, email, password
   - You'll be logged in automatically

3. **Configure Providers:**
   - Go to Settings → Providers
   - Add your API keys
   - Test the connection

4. **Create a Webset** (data table):
   - Click "New Webset"
   - Add columns for the data you want
   - Configure search provider
   - Configure LLM for enrichment

5. **Run an Enrichment:**
   - Add rows to your webset
   - Click "Enrich"
   - Watch the queue process your data

---

## 📖 **Common Tasks**

### Stopping Services
```bash
docker compose down
```

### Restarting Services
```bash
docker compose restart
```

### Rebuilding After Changes
```bash
docker compose up -d --build
```

### Viewing Logs
```bash
docker compose logs -f          # All services
docker compose logs -f backend  # Just backend
docker compose logs -f frontend # Just frontend
```

### Resetting Database
```bash
docker compose down -v  # Removes volumes
docker compose up -d    # Fresh start
```

---

## 🐛 **Troubleshooting**

### "Connection refused" on localhost
- Make sure Docker is running: `docker ps`
- Services might still be starting. Wait 10-15 seconds and refresh.

### "Database connection failed"
- Check PostgreSQL is running: `docker compose ps postgres`
- Verify `DATABASE_URL` in `.env`

### "API key invalid"
- Double-check your API key in `.env` (no extra spaces)
- Verify the key is active on the provider's website

### Frontend shows blank page
- Check browser console for errors (F12 → Console)
- Verify `NEXT_PUBLIC_API_URL` points to correct backend
- Check backend logs: `docker compose logs -f backend`

### Out of memory
- Increase Docker memory in Docker Desktop settings
- Or reduce number of concurrent enrichments

---

## 📚 **Next Steps**

- **[README.md](README.md)** – Project overview and features
- **[CONTRIBUTING.md](CONTRIBUTING.md)** – Help improve Enrichify
- **[Issues](https://github.com/1-kabir/enrichify/issues)** – Report bugs or request features

---

## 💬 **Need Help?**

- **Issues**: [GitHub Issues](https://github.com/1-kabir/enrichify/issues)
- **Discussions**: [GitHub Discussions](https://github.com/1-kabir/enrichify/discussions)

---

**Happy enriching! 🚀**
