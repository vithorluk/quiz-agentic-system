# Deployment Guide

## Render Deployment (Production)

### Prerequisites
- Render account
- GitHub repository
- Environment variables configured

### 1. Web Service Setup

**Service Configuration:**
```yaml
Name: quiz-agent-api
Environment: Docker
Region: Oregon (us-west)
Branch: main
```

**Build & Deploy:**
- Build Command: `docker build -t quiz-agent .`
- Start Command: `node dist/index.js --server`

**Environment Variables:**
```env
NODE_ENV=production
PORT=3000
GROQ_API_KEY=<your-key>
OPENAI_API_KEY=<optional-fallback>
DATABASE_PATH=/data/quiz.db
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<your-key>
```

**Health Check:**
- Path: `/health`
- Expected Status: `200`

### 2. Persistent Disk Setup

**Why needed:**
- SQLite database persistence
- Embedding model cache

**Configuration:**
```yaml
Mount Path: /data
Size: 1GB
```

**Database Path:**
```env
DATABASE_PATH=/data/quiz.db
```

### 3. Zero-Downtime Deployment

**Strategy: Blue-Green Deployment**

```bash
# Current approach (Render handles this)
1. New container builds
2. Health check passes on new container
3. Traffic switches from old → new
4. Old container drains connections (30s)
5. Old container terminates
```

**Critical for zero-downtime:**

1. **Health check endpoint must be reliable:**
```typescript
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});
```

2. **Database migrations must be backward-compatible:**
```typescript
// BAD: Breaking migration
ALTER TABLE quiz_sessions DROP COLUMN old_field;

// GOOD: Additive migration
ALTER TABLE quiz_sessions ADD COLUMN new_field TEXT;
```

3. **Graceful shutdown handling:**
```typescript
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...');

  await server.close();
  await database.close();

  process.exit(0);
});
```

### 4. Monitoring

**Render Metrics (built-in):**
- CPU usage
- Memory usage
- HTTP response times
- Error rate

**Custom Metrics (via LangSmith):**
- Quiz generation success rate
- Average quiz quality score
- LLM fallback usage
- Evaluation failure rate

**Alerts to set up:**
```yaml
High Error Rate:
  Threshold: >5% over 5min
  Action: Email + Slack

High Response Time:
  Threshold: >10s p95
  Action: Email

Memory Usage:
  Threshold: >85%
  Action: Email
```

### 5. Scaling Strategy

**Current setup:**
- Single instance (sufficient for MVP)
- Auto-scaling not needed initially

**When to scale:**

**Horizontal scaling triggers:**
- CPU >70% sustained
- Request queue >50
- p95 latency >5s

**Vertical scaling considerations:**
- Embedding model needs RAM (200MB minimum)
- SQLite is single-writer (horizontal scaling limited)
- Consider PostgreSQL if >1 instance needed

**Cost estimates:**
```
Render Starter: $7/mo
  - 512MB RAM (enough for embeddings)
  - 0.1 CPU
  - Suitable for <100 req/day

Render Standard: $25/mo
  - 2GB RAM
  - 1 CPU
  - Suitable for <1000 req/day
```

### 6. Database Backups

**Automatic backup strategy:**

```bash
# Cron job (daily at 2 AM UTC)
0 2 * * * /app/scripts/backup-db.sh

# backup-db.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 /data/quiz.db ".backup /data/backups/quiz_$DATE.db"
find /data/backups -mtime +7 -delete  # Keep 7 days
```

**Restore process:**
```bash
# Stop service
# Copy backup to /data/quiz.db
sqlite3 /data/quiz.db < /data/backups/quiz_20260413.db
# Restart service
```

### 7. Security Checklist

- [ ] API keys in environment variables (not code)
- [ ] HTTPS enabled (Render provides free SSL)
- [ ] CORS configured with allowed origins
- [ ] Rate limiting enabled (add middleware)
- [ ] Input validation on all endpoints
- [ ] Database backups automated
- [ ] Secrets rotation policy defined

### 8. CI/CD Pipeline

**GitHub Actions (recommended):**

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### 9. Rollback Procedure

**If deployment fails:**

1. Check Render logs:
```bash
render logs --service quiz-agent-api --tail 100
```

2. Revert via Render dashboard:
   - Navigate to service
   - Click "Manual Deploy"
   - Select previous commit
   - Deploy

**Time to rollback:** <2 minutes

### 10. Common Issues & Solutions

**Issue: Out of Memory**
```
Solution: Upgrade to 2GB RAM plan
Root cause: Embedding model + multiple concurrent requests
```

**Issue: Slow cold starts**
```
Solution: Keep service always-on (paid plan)
Root cause: Free tier spins down after 15min inactivity
```

**Issue: Database locked**
```
Solution: Ensure single writer (no horizontal scaling with SQLite)
Alternative: Migrate to PostgreSQL for multi-instance
```

## Alternative Deployment: Vercel (Frontend Only)

For frontend-only deployment, use Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Backend must be on Render or similar (Vercel Functions have 10s timeout).

## Alternative Deployment: AWS ECS

For enterprise needs:

**Benefits:**
- Better scaling
- VPC isolation
- More monitoring

**Trade-offs:**
- More complex setup
- Higher cost (~$50/mo minimum)
- Requires AWS expertise

**Not recommended unless:**
- >10k requests/day
- Compliance requires VPC
- Team already on AWS
