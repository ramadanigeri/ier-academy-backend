# DevOps Deployment Guide - IER Academy Backend

> **Complete deployment guide including Docker setup and data migration options**

## 📋 Table of Contents

1. [Quick Deploy (Docker)](#-quick-deploy-docker)
2. [Database Migration Options](#-database-migration-options-important)
3. [Manual Deployment](#-manual-deployment-without-docker)
4. [Security Configuration](#-security-configuration)
5. [Troubleshooting](#-troubleshooting)

---

## 🐳 Quick Deploy (Docker)

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### Fast Track (5 Minutes)

#### 1. Configure Environment

```bash
cp .env.example .env
nano .env  # Edit with production values
```

**Required variables:**

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@db:5432/ier_academy
DATABASE_SSL_ENABLED=false
JWT_SECRET=<generate-64-character-random-string>
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RESEND_API_KEY=<your-resend-api-key>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong-secure-password>
```

#### 2. Start Services

```bash
docker-compose up -d
```

#### 3. Initialize Database

```bash
docker-compose exec api npm run db:migrate
docker-compose exec api node scripts/create-admin.js
```

#### 4. Verify

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

✅ **Deployment Complete!** API running on port 3001

---

## ⚠️ Database Migration Options (IMPORTANT)

### Decision Point: Do You Have Existing Data?

**Before proceeding, you must decide:**

- **Scenario A:** Fresh deployment (no existing data) → Continue above
- **Scenario B:** Migrating from existing database → Follow migration guide below

---

### Option 1: Fresh Start (No Existing Data)

✅ Use this if:

- First time deploying
- No data to preserve
- Starting fresh

**What you get:**

- Empty database with proper schema
- One admin user (created via script)
- No existing enrollments, events, or files

**Steps:** Already completed in Quick Deploy above ✓

---

### Option 2: Migrate Existing Data

✅ Use this if:

- Moving from development/staging
- Have existing enrollments, events, courses
- Need to preserve uploaded files

**What you get:**

- All existing data preserved
- All uploaded files
- Existing admin users

#### Step-by-Step Migration

**1. Backup Current Database**

On your source/development machine:

```bash
# Export database
pg_dump -U postgres ier_academy > ier_academy_backup.sql

# Or using connection string
pg_dump postgresql://user:pass@host:5432/ier_academy > ier_academy_backup.sql
```

**2. Transfer Backup to Production**

```bash
# Copy to production server
scp ier_academy_backup.sql user@production-server:/tmp/

# Or use WinSCP, FileZilla, etc. on Windows
```

**3. Deploy and Import**

On production server:

```bash
# Start Docker containers
docker-compose up -d

# Wait for database to be ready
docker-compose ps

# Import your data
cat /tmp/ier_academy_backup.sql | docker-compose exec -T db psql -U postgres ier_academy

# Run any new migrations (if schema changed)
docker-compose exec api npm run db:migrate

# Verify data imported
docker-compose exec db psql -U postgres ier_academy -c "SELECT COUNT(*) FROM enrollments;"
```

**4. Migrate Uploaded Files**

```bash
# Copy uploads directory from source to production
scp -r uploads/* user@production-server:/path/to/ier-academy-backend/uploads/

# Or copy into Docker volume
docker cp uploads/. <container-name>:/app/uploads/

# Set proper permissions
docker-compose exec api chmod -R 755 /app/uploads
```

**5. Verify Migration**

```bash
# Check health
curl http://localhost:3001/health

# Check data counts
docker-compose exec db psql -U postgres ier_academy -c "
  SELECT
    (SELECT COUNT(*) FROM enrollments) as enrollments,
    (SELECT COUNT(*) FROM events) as events,
    (SELECT COUNT(*) FROM courses) as courses,
    (SELECT COUNT(*) FROM admin_users) as admins;
"

# Test admin login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

---

### Option 3: Use Existing External Database

Instead of Docker's PostgreSQL, connect to existing/managed database.

**Modify `.env`:**

```env
DATABASE_URL=postgresql://user:password@external-db-host:5432/ier_academy
```

**Modify `docker-compose.yml`:**

Remove the `db` service and `depends_on` from `api` service.

**Then:**

```bash
docker-compose up -d
docker-compose exec api npm run db:migrate
```

---

### Migration Troubleshooting

**Issue: "relation does not exist"**

```bash
# Run migrations first
docker-compose exec api npm run db:migrate
```

**Issue: Admin login fails after import**

```bash
# Reset admin password
docker-compose exec api node scripts/create-admin.js
```

**Issue: Uploaded files return 404**

```bash
# Check permissions
docker-compose exec api ls -la /app/uploads
docker-compose exec api chmod -R 755 /app/uploads
```

---

## 🛠️ Manual Deployment (Without Docker)

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- PM2 (process manager)
- Nginx (reverse proxy)

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2
```

### Step 2: Clone & Setup

```bash
git clone <repo-url> /var/www/ier-academy-backend
cd /var/www/ier-academy-backend
npm ci --production
cp .env.example .env
nano .env  # Configure
```

### Step 3: Database Setup

```bash
# Create database
sudo -u postgres psql
```

```sql
CREATE DATABASE ier_academy;
CREATE USER ier_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ier_academy TO ier_user;
\q
```

```bash
# Configure .env with DATABASE_URL
# Then run migrations
npm run db:migrate
node scripts/create-admin.js
```

### Step 4: Start with PM2

```bash
pm2 start src/index.js --name ier-academy-api
pm2 startup
pm2 save
```

### Step 5: Nginx Reverse Proxy

Create `/etc/nginx/sites-available/ier-academy-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /var/www/ier-academy-backend/uploads;
        expires 30d;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ier-academy-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: SSL Certificate

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🔒 Security Configuration

### Pre-Deployment Checklist

- [ ] `JWT_SECRET` is 64+ characters random string
- [ ] `ADMIN_PASSWORD` is strong (12+ chars, mixed case, numbers, symbols)
- [ ] Database password changed from defaults
- [ ] `NODE_ENV=production` set
- [ ] `CORS_ORIGINS` configured (no wildcards like `*`)
- [ ] HTTPS/SSL enabled
- [ ] Firewall configured
- [ ] Backups scheduled

### Generate Secure JWT Secret

```bash
# Option 1: OpenSSL
openssl rand -base64 64

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Firewall Setup (UFW)

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

### Environment Variables

| Variable         | Required | Example                               | Notes                   |
| ---------------- | -------- | ------------------------------------- | ----------------------- |
| `NODE_ENV`       | ✅       | `production`                          | Must be "production"    |
| `PORT`           | ✅       | `3001`                                | API port                |
| `DATABASE_URL`   | ✅       | `postgresql://user:pass@host:5432/db` | PostgreSQL connection   |
| `JWT_SECRET`     | ✅       | `<64-char-random-string>`             | Token signing           |
| `FRONTEND_URL`   | ✅       | `https://yourdomain.com`              | For CORS                |
| `BACKEND_URL`    | ✅       | `https://api.yourdomain.com`          | For file URLs           |
| `CORS_ORIGINS`   | ✅       | `https://yourdomain.com`              | Comma-separated         |
| `RESEND_API_KEY` | Optional | `re_xxxxx`                            | Email service           |
| `JWT_EXPIRES_IN` | Optional | `24h`                                 | Default: 24h            |
| `ADMIN_USERNAME` | Optional | `admin`                               | For create-admin script |
| `ADMIN_PASSWORD` | Optional | `<strong-password>`                   | For create-admin script |

---

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check database running
docker-compose ps db

# Test connection
docker-compose exec api node -e "require('./src/database/connection.js')"

# View logs
docker-compose logs db
```

### API Won't Start

```bash
# Check logs
docker-compose logs api

# Verify environment
docker-compose exec api printenv | grep -E 'NODE_ENV|DATABASE_URL|PORT'

# Restart
docker-compose restart
```

### Health Check Fails

```bash
# Test locally
curl http://localhost:3001/health

# Test externally
curl https://api.yourdomain.com/health

# Check if port is accessible
telnet localhost 3001
```

### Admin Login Fails

```bash
# Reset admin password
# Update ADMIN_PASSWORD in .env first
docker-compose exec api node scripts/create-admin.js
```

### Port Already in Use

```bash
# Find process using port
lsof -ti:3001

# Kill it
kill -9 <PID>

# Or change PORT in .env
```

---

## 📊 Useful Commands

### Docker Management

```bash
# View logs (all services)
docker-compose logs

# View logs (API only, live)
docker-compose logs -f api

# View logs (last 100 lines)
docker-compose logs --tail=100 api

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Execute commands in container
docker-compose exec api sh
```

### Database Operations

```bash
# Backup database
docker-compose exec db pg_dump -U postgres ier_academy > backup_$(date +%Y%m%d).sql

# Restore database
cat backup.sql | docker-compose exec -T db psql -U postgres ier_academy

# Connect to database
docker-compose exec db psql -U postgres ier_academy

# Run query
docker-compose exec db psql -U postgres ier_academy -c "SELECT COUNT(*) FROM enrollments;"
```

### PM2 Management (Manual Deployment)

```bash
# Status
pm2 status

# Logs
pm2 logs ier-academy-api

# Restart
pm2 restart ier-academy-api

# Stop
pm2 stop ier-academy-api

# Monitor
pm2 monit

# Startup script
pm2 startup
pm2 save
```

---

## 🔄 Updates & Maintenance

### Deploying Code Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Run any new migrations
docker-compose exec api npm run db:migrate
```

### Database Backups

**Automated backup script:**

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U postgres ier_academy > /backups/ier_academy_$DATE.sql
find /backups -name "ier_academy_*.sql" -mtime +7 -delete
```

**Schedule with cron:**

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## 📞 Support Checklist

When reporting issues, provide:

1. **Logs:** `docker-compose logs`
2. **Health check:** `curl http://localhost:3001/health`
3. **Environment:** `docker-compose exec api printenv | grep NODE_ENV`
4. **Database status:** `docker-compose ps db`
5. **Docker version:** `docker --version && docker-compose --version`

---

## ✅ Post-Deployment Verification

After deployment, verify:

- [ ] Health endpoint returns 200: `curl http://localhost:3001/health`
- [ ] Admin can login
- [ ] Database has expected data (if migrated)
- [ ] Uploaded files accessible
- [ ] Frontend can connect
- [ ] CORS working properly
- [ ] SSL certificate valid
- [ ] Backups running

---

**Your backend is production-ready!** 🚀
