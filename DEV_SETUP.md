# Developer Setup Guide - IER Academy Backend

> **For Developers**: Quick setup on any machine for local development

## 🎯 Overview

This guide helps you set up the backend on any development machine (new PC, teammate's computer, etc.).

---

## 📋 Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/)
- **Git** - For cloning the repository

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Clone Repository

```bash
git clone <your-repository-url>
cd ier-academy-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

**Edit `.env` with your local values:**

```env
# Development Environment
NODE_ENV=development
PORT=3001

# Local PostgreSQL Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ier_academy

# Local URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# JWT Secret (any string for development)
JWT_SECRET=dev-secret-key-not-for-production-use-only-local

# CORS (allow local frontend)
CORS_ORIGINS=http://localhost:3000

# Optional: Email service (leave empty for dev if not testing emails)
RESEND_API_KEY=

# Admin credentials for create-admin script
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Step 4: Create Database

**Option A: Using PostgreSQL CLI**

```bash
# On Windows (in Command Prompt or PowerShell)
psql -U postgres
```

```sql
CREATE DATABASE ier_academy;
\q
```

**Option B: Using pgAdmin**

1. Open pgAdmin
2. Right-click on "Databases" → Create → Database
3. Name: `ier_academy`
4. Click Save

### Step 5: Run Migrations

```bash
npm run db:migrate
```

This creates all tables, columns, and database structure.

### Step 6: Create Admin User

```bash
node scripts/create-admin.js
```

This creates an admin user with credentials from your `.env` file.

### Step 7: Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001` with hot reload (nodemon).

### Step 8: Verify Everything Works

**Test the health endpoint:**

```bash
curl http://localhost:3001/health
```

Or open in browser: `http://localhost:3001/health`

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

**Test admin login:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

---

## 📁 Project Structure

```
ier-academy-backend/
├── src/
│   ├── index.js           # Entry point
│   ├── database/
│   │   ├── connection.js  # PostgreSQL connection
│   │   ├── schema.sql     # Main schema
│   │   ├── migrate.js     # Migration runner
│   │   └── migrations/    # Database migrations
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & security
│   ├── services/          # External services (email, etc.)
│   └── utils/             # Utilities
├── scripts/
│   └── create-admin.js    # Admin user creation
├── uploads/               # File uploads (local)
├── .env                   # Your local config (gitignored)
└── package.json           # Dependencies
```

---

## 🛠️ Development Commands

```bash
# Start with hot reload (recommended)
npm run dev

# Start without hot reload
npm start

# Run database migrations
npm run db:migrate

# Verify database setup
npm run db:seed

# Create/reset admin user
node scripts/create-admin.js
```

---

## 🔧 Common Development Tasks

### Adding a New Migration

1. Create new file in `src/database/migrations/`:

```
src/database/migrations/005_your_migration_name.sql
```

2. Write your SQL:

```sql
-- Example migration
ALTER TABLE enrollments ADD COLUMN notes TEXT;
```

3. Run migration:

```bash
npm run db:migrate
```

### Testing API Endpoints

Use tools like:

- **Postman** - Full-featured API client
- **Thunder Client** - VS Code extension
- **cURL** - Command line
- **Insomnia** - Alternative to Postman

### Viewing Database

**Option 1: psql CLI**

```bash
psql -U postgres ier_academy
```

```sql
-- List all tables
\dt

-- View table structure
\d enrollments

-- Query data
SELECT * FROM enrollments;

-- Exit
\q
```

**Option 2: pgAdmin** (GUI)

1. Open pgAdmin
2. Navigate to: Servers → PostgreSQL → Databases → ier_academy
3. Right-click table → View/Edit Data

**Option 3: VS Code Extension**

- Install "PostgreSQL" extension by Chris Kolkman
- Connect to your database
- Browse tables visually

### Reset Database (Clean Slate)

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS ier_academy;"
psql -U postgres -c "CREATE DATABASE ier_academy;"

# Run migrations
npm run db:migrate

# Recreate admin
node scripts/create-admin.js
```

---

## 🐛 Troubleshooting

### Port 3001 Already in Use

**Find and kill the process:**

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

**Or change port in `.env`:**

```env
PORT=3002
```

### Database Connection Failed

**Check PostgreSQL is running:**

```bash
# Windows
pg_isready

# Or check services
services.msc  # Look for "postgresql-x64-XX"
```

**Verify credentials in `.env`:**

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ier_academy
```

**Test connection manually:**

```bash
psql -U postgres -d ier_academy -c "SELECT 1;"
```

### Migration Errors

**Error: "relation already exists"**

```bash
# Drop database and start fresh
psql -U postgres -c "DROP DATABASE ier_academy;"
psql -U postgres -c "CREATE DATABASE ier_academy;"
npm run db:migrate
```

### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Admin Login Fails

**Reset admin password:**

```bash
# Update ADMIN_PASSWORD in .env, then:
node scripts/create-admin.js
```

---

## 🔄 Pulling Latest Changes

When teammates make changes:

```bash
# Pull latest code
git pull

# Install any new dependencies
npm install

# Run any new migrations
npm run db:migrate

# Restart dev server
npm run dev
```

---

## 📝 Environment Variables Explained

| Variable         | Development Value                 | Description                    |
| ---------------- | --------------------------------- | ------------------------------ |
| `NODE_ENV`       | `development`                     | Enables dev features           |
| `PORT`           | `3001`                            | Server port                    |
| `DATABASE_URL`   | `postgresql://...@localhost:5432` | Local PostgreSQL               |
| `JWT_SECRET`     | Any string                        | Token signing (not critical)   |
| `FRONTEND_URL`   | `http://localhost:3000`           | Your frontend dev server       |
| `BACKEND_URL`    | `http://localhost:3001`           | This backend                   |
| `CORS_ORIGINS`   | `http://localhost:3000`           | Allow local frontend           |
| `RESEND_API_KEY` | Leave empty                       | Only needed for email testing  |
| `ADMIN_USERNAME` | `admin`                           | For create-admin script        |
| `ADMIN_PASSWORD` | `admin123`                        | For create-admin script (dev)  |

---

## 💡 Pro Tips

### 1. Use Nodemon for Auto-Restart

Already configured with `npm run dev` - automatically restarts when you save files.

### 2. Database GUI Tools

- **pgAdmin** - Full-featured PostgreSQL GUI
- **DBeaver** - Universal database tool
- **TablePlus** - Modern, native GUI (paid)

### 3. API Testing

Create a Postman/Thunder Client collection with common requests:

- Login (POST `/api/auth/login`)
- Get enrollments (GET `/api/enrollment`)
- Create event (POST `/api/content/events`)
- etc.

### 4. VS Code Extensions

Recommended:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostgreSQL** - Database management
- **Thunder Client** - API testing
- **GitLens** - Git visualization

### 5. Check Logs

The console output shows:

- Server startup info
- Request logs (via security middleware)
- Error messages

---

## 🚀 Ready to Code!

You're all set! The backend is running on `http://localhost:3001`

**Next steps:**

1. Connect your frontend to `http://localhost:3001`
2. Test API endpoints
3. Start building features!

**Need help?** Check the main [README.md](./README.md) for API documentation.

---

## 📦 Moving to Another PC

Just repeat this guide:

1. Clone repo
2. `npm install`
3. Copy/create `.env`
4. Create database
5. `npm run db:migrate`
6. `node scripts/create-admin.js`
7. `npm run dev`

**Pro tip:** Keep a backup of your `.env` file in a secure location (not in git!) so you can quickly set up on new machines.

