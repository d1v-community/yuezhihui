# Deployment Guide

This guide covers deploying the Remix + Neon Email Authentication Template to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel](#vercel)
- [Netlify](#netlify)
- [Railway](#railway)
- [Fly.io](#flyio)
- [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Domain Configuration](#domain-configuration)

---

## Prerequisites

Before deploying, ensure you have:

1. ✅ A Neon account with a created database
2. ✅ A Resend account (for email functionality)
3. ✅ Your code pushed to a Git repository
4. ✅ Environment variables configured

---

## Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Add Environment Variables**
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add RESEND_API_KEY
```

### Option 2: Deploy via GitHub

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. Push your code to GitHub
2. Click the "Deploy with Vercel" button above
3. Import your repository
4. Add environment variables in the dashboard
5. Deploy!

### Vercel Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "remix"
}
```

### Database Migration on Vercel

Option A: Run migrations locally before deploying
```bash
npm run db:migrate
git add .
git commit -m "Apply database migrations"
git push
```

Option B: Create a Vercel Build Hook
1. Go to Settings → Git
2. Create a Deploy Hook
3. Name it `database-migrate`
4. Call the hook URL in your CI/CD pipeline before deployment

---

## Netlify

### Deploy via GitHub

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/remix-neon-auth)

1. Push code to GitHub
2. Click "Deploy to Netlify"
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
4. Add environment variables
5. Deploy!

### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/build/client/index.js"
  status = 200
```

### Edge Functions (Alternative)

Netlify now supports Edge Functions with Remix. Check their documentation for edge deployment.

---

## Railway

### Deploy via Railway CLI

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login**
```bash
railway login
```

3. **Initialize**
```bash
railway init
```

4. **Deploy**
```bash
railway up
```

5. **Add Environment Variables**
```bash
railway variables set DATABASE_URL=your_db_url
railway variables set JWT_SECRET=your_secret
```

### Deploy via GitHub

1. Push to GitHub
2. Visit [railway.app](https://railway.app)
3. "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables in dashboard

---

## Fly.io

### 1. Install flyctl

```bash
# macOS
brew install flyctl

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Linux
curl -L https://fly.io/install.sh | sh
```

### 2. Login

```bash
flyctl auth login
```

### 3. Launch App

```bash
flyctl launch
```

### 4. Add Secrets

```bash
flyctl secrets set DATABASE_URL=your_db_url
flyctl secrets set JWT_SECRET=your_secret
flyctl secrets set RESEND_API_KEY=your_api_key
```

### 5. Deploy

```bash
flyctl deploy
```

### fly.toml

```toml
app = "remix-neon-auth"
primary_region = "iad"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]
```

---

## Docker

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 remix

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=remix:nodejs /app/build ./build
COPY --from=builder --chown=remix:nodejs /app/public ./public
COPY --from=builder --chown=remix:nodejs /app/node_modules ./node_modules

USER remix

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - RESEND_API_KEY=${RESEND_API_KEY}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped
```

### Build and Run

```bash
# Build
docker build -t remix-neon-auth .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=your_db_url \
  -e JWT_SECRET=your_secret \
  -e RESEND_API_KEY=your_api_key \
  remix-neon-auth
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key-32-chars-min` |
| `RESEND_API_KEY` | Resend API key for emails | `re_xxxxxxxxxxxxxxxxxxxxxxxxxx` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_URL` | Your application URL | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |

### Setting Environment Variables

#### Vercel
```bash
vercel env add VARIABLE_NAME
```

#### Netlify
Site Settings → Environment Variables → Add variable

#### Railway
```bash
railway variables set VARIABLE_NAME=value
```

#### Fly.io
```bash
flyctl secrets set VARIABLE_NAME=value
```

#### Docker (docker-compose.yml)
```yaml
environment:
  - VARIABLE_NAME=value
```

---

## Database Setup

### Create Database on Neon

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from Settings → Connection String
4. Use the connection string as `DATABASE_URL`

### Run Migrations

#### Local Development
```bash
npm run db:migrate
```

#### Production (via API)
```bash
npm run db:migrate:api
```

**Important**: For production, prefer using `db:migrate:api` which uses Neon's secure API instead of exposing the DATABASE_URL.

---

## Domain Configuration

### Custom Domain

1. **Add Domain to Platform**
   - Vercel: Settings → Domains
   - Netlify: Domain settings
   - Railway: Settings → Domains

2. **Update DNS Records**
   ```
   Type: CNAME
   Name: www
   Value: your-app.vercel.app

   Type: A
   Name: @
   Value: [IP from platform]
   ```

3. **Update Environment Variables**
   ```env
   APP_URL=https://your-domain.com
   ```

### SSL/TLS

Most platforms (Vercel, Netlify, Railway, Fly.io) automatically provision SSL certificates via Let's Encrypt. No additional configuration needed.

### Email Domain (Resend)

1. In Resend Dashboard, go to "Domains"
2. Add your domain
3. Configure DNS records as shown:
   ```
   Type: TXT
   Name: _resend
   Value: [value from Resend]

   Type: MX
   Name: @
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10

   Type: TXT
   Name: @
   Value: v=spf1 include:amazonses.com ~all

   Type: CNAME
   Name: [random]._domainkey
   Value: [random].dkim.amazonses.com
   ```

---

## Monitoring & Logs

### Vercel
```bash
vercel logs
```

### Railway
```bash
railway logs
```

### Fly.io
```bash
flyctl logs
```

### Docker
```bash
docker logs -f container_name
```

---

## Troubleshooting

### Build Fails

**Issue**: `Cannot find module '@remix-run/...'`

**Solution**: Ensure all dependencies are installed
```bash
npm install
```

### Database Connection Error

**Issue**: `ECONNREFUSED` or similar

**Solution**:
1. Verify DATABASE_URL is correct
2. Check Neon database is active
3. Ensure your IP is allowed (Neon allows by default)

### Email Not Sending

**Issue**: Verification code not received

**Solution**:
1. Check RESEND_API_KEY is set
2. Verify domain is verified in Resend
3. Check spam folder
4. In development, check server logs for the code

### 500 Error

**Issue**: Server error

**Solution**:
1. Check server logs
2. Verify all environment variables are set
3. Ensure database migrations are applied

---

## Performance Optimization

### Enable Caching

Remix has built-in caching. Add to routes:

```typescript
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json(data, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
};
```

### Database Connection Pooling

Neon automatically handles connection pooling. For high traffic, consider:
- Increasing Neon connection limits
- Using a connection pooler like PgBouncer

### CDN

- Vercel: Automatically provides global CDN
- Netlify: Enable CDN in site settings
- Cloudflare: Use as DNS and CDN layer

---

## Security Checklist

- [ ] `JWT_SECRET` is at least 32 characters
- [ ] `DATABASE_URL` uses SSL mode: `?sslmode=require`
- [ ] All environment variables are set in platform dashboard
- [ ] Custom domain configured with SSL
- [ ] Email domain verified in Resend
- [ ] `NODE_ENV=production` in production
- [ ] No sensitive data in client-side code
- [ ] Security headers configured (if using nginx/CloudFlare)

---

## Support

- 📚 [Remix Documentation](https://remix.run/docs)
- 📚 [Neon Documentation](https://neon.tech/docs)
- 📚 [Drizzle Documentation](https://orm.drizzle.team/docs)
- 📧 [Resend Documentation](https://resend.com/docs)

---

**Last Updated**: November 2024
