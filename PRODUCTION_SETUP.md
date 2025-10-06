# IER Academy Backend - Production Setup Guide

## 🚀 Production Deployment Checklist

### 1. Environment Configuration

Create a `.env` file with the following production values:

```env
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=ier_academy
DB_USER=your-db-user
DB_PASSWORD=your-secure-db-password

# Frontend URL (for Sanity API proxy)
FRONTEND_URL=https://your-frontend-domain.com

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key

# Sanity CMS Configuration
SANITY_PROJECT_ID=nyz4k3ve
SANITY_DATASET=production
SANITY_API_VERSION=2023-01-01

# Security
JWT_SECRET=your-very-secure-jwt-secret-key-here

# CORS Origins (comma-separated)
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-domain.com
```

### 2. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Optional: Seed initial data
npm run db:seed
```

### 3. Production Commands

```bash
# Install dependencies
npm install --production

# Start production server
npm run prod
# or
npm start
```

### 4. Security Considerations

- ✅ Environment variables configured
- ✅ CORS properly configured
- ✅ Helmet security headers enabled
- ✅ Input validation with Zod
- ✅ SQL injection protection with parameterized queries
- ✅ No sensitive data in console logs

### 5. Monitoring & Logging

- All debug console.log statements removed
- Error logging maintained for troubleshooting
- Health check endpoint: `/health`

### 6. Admin Dashboard

- Production-ready admin interface at `/api/admin/dashboard`
- Complete enrollment management workflow
- Secure status update endpoints

### 7. API Endpoints

- `POST /api/enrollment/checkout` - Create new enrollment
- `PATCH /api/enrollment/:id/status` - Update enrollment status
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/enrollment/:id/status` - Update status via GET (admin)
- `GET /health` - Health check

## 🔧 Production Features

- ✅ Complete enrollment workflow (enrolled → paid → registered)
- ✅ Admin dashboard with filtering and status management
- ✅ Payment record management
- ✅ Date formatting (DD/MM/YYYY)
- ✅ Sanity CMS integration via frontend proxy
- ✅ Email service ready (when API key configured)
- ✅ Database migrations and schema management

## 📊 Status Workflow

1. **Enrolled** - Student completed form, pending payment
2. **Paid** - Admin confirmed payment received
3. **Registered** - Student officially registered to course
4. **Cancelled** - Enrollment cancelled (with rollback options)

The system is now production-ready! 🎉
