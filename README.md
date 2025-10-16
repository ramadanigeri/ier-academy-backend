# IER Academy Backend

Production-ready Node.js backend API with PostgreSQL database for IER Academy.

## 🚀 Features

- ✅ **Express.js** REST API with comprehensive security
- ✅ **PostgreSQL** database with connection pooling
- ✅ **Authentication** - JWT-based admin authentication
- ✅ **Email** notifications via Resend
- ✅ **Enrollment** management system
- ✅ **Events** and course management
- ✅ **CMS** endpoints for content management
- ✅ **File Upload** handling with Multer
- ✅ **Contact** form processing
- ✅ **Security** - Helmet, CORS, rate limiting, input validation
- ✅ **Docker** ready for easy deployment

## 📋 Prerequisites

- Docker & Docker Compose (recommended)
- **OR** Node.js 18+ and PostgreSQL 12+ (for local development)

## 🐳 Quick Start with Docker (Recommended for Production)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your values

# 2. Start services
docker-compose up -d

# 3. Initialize database
docker-compose exec api npm run db:migrate
docker-compose exec api node scripts/create-admin.js

# 4. Verify
curl http://localhost:3001/health
```

📖 **[DevOps Deployment Guide](./DEVOPS_DEPLOYMENT.md)** - Complete deployment instructions

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with local settings

# 3. Create database
createdb ier_academy

# 4. Run migrations
npm run db:migrate

# 5. Create admin user
node scripts/create-admin.js

# 6. Start dev server
npm run dev
```

Server runs on `http://localhost:3001`

👨‍💻 **[Developer Setup Guide](./DEV_SETUP.md)** - Complete local development setup

## 📚 API Documentation

### Public Endpoints

- `GET /health` - Health check
- `POST /api/contact` - Contact form submission
- `POST /api/enrollment/checkout` - Create enrollment
- `GET /api/events` - List public events
- `GET /api/courses` - List courses
- `GET /api/content/*` - Content endpoints
- `GET /api/venues` - List venues

### Protected Endpoints (Require Authentication)

- `POST /api/auth/login` - Admin login
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/cms/*` - CMS management
- `POST /api/upload` - File upload
- All admin management endpoints

## 🗄️ Database

### Schema Management

Migrations are located in `src/database/migrations/`

```bash
npm run db:migrate  # Run migrations
npm run db:seed     # Verify database setup
```

### Main Tables

- `admin_users` - Admin authentication
- `enrollments` - Student enrollments
- `events` - Events and webinars
- `courses` - Course catalog
- `sessions` - Course sessions
- `contact_inquiries` - Contact form submissions
- `email_log` - Email tracking

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Configurable origins
- **Rate Limiting** - Tiered limits (general, auth, public API)
- **Input Validation** - Zod schemas
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Input sanitization
- **HPP Protection** - HTTP Parameter Pollution prevention
- **JWT Authentication** - Secure admin access

## 🛠️ Scripts

```bash
npm run dev         # Development with nodemon
npm start           # Production server
npm run prod        # Production with NODE_ENV set
npm run db:migrate  # Run database migrations
npm run db:seed     # Verify database setup
```

## 📁 Project Structure

```
ier-academy-backend/
├── src/
│   ├── database/           # Database config and migrations
│   ├── middleware/         # Auth and security middleware
│   ├── routes/            # API route handlers
│   ├── services/          # External services (email, etc)
│   ├── utils/             # Utility functions
│   └── index.js           # Application entry point
├── scripts/               # Utility scripts
├── uploads/               # File upload directory
├── Dockerfile             # Production Docker image
├── docker-compose.yml     # Docker Compose configuration
└── .env.example          # Environment template
```

## 🚢 Deployment

📖 **For DevOps:** [DEVOPS_DEPLOYMENT.md](./DEVOPS_DEPLOYMENT.md) - Complete deployment guide with migration options

👨‍💻 **For Developers:** [DEV_SETUP.md](./DEV_SETUP.md) - Local development setup on any machine

## 📝 Environment Variables

See `.env.example` for all available configuration options. Key variables:

- `NODE_ENV` - Environment (production/development)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `FRONTEND_URL` - Frontend domain for CORS
- `CORS_ORIGINS` - Allowed origins (comma-separated)
- `RESEND_API_KEY` - Email service API key

## 🔧 Troubleshooting

- **Production issues:** See [DEVOPS_DEPLOYMENT.md](./DEVOPS_DEPLOYMENT.md#-troubleshooting)
- **Local development:** See [DEV_SETUP.md](./DEV_SETUP.md#-troubleshooting)

## 📄 License

MIT

## 👥 Author

IER Academy
