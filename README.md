# IER Academy Backend

Node.js backend API with PostgreSQL database for IER Academy.

## Features

- ✅ **Express.js** REST API
- ✅ **PostgreSQL** database with connection pooling
- ✅ **Stripe** payment integration
- ✅ **Email** notifications via Resend
- ✅ **Enrollment** management system
- ✅ **Contact** form handling
- ✅ **Webhook** processing for payments
- ✅ **CORS** enabled for frontend integration
- ✅ **Security** headers with Helmet
- ✅ **Validation** with Zod

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database:**

   ```bash
   # Create database
   createdb ier_academy

   # Run migrations
   npm run db:migrate

   # Verify setup
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check

- `GET /health` - Server and database status

### Enrollment

- `POST /api/enrollment/checkout` - Create enrollment and payment session
- `GET /api/enrollment/:id` - Get enrollment details

### Contact

- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get contact messages (admin)

### Webhooks

- `POST /api/webhooks/stripe` - Stripe payment webhooks

## Database Schema

### Tables

- **enrollments** - Student enrollment records
- **payments** - Payment transaction logs
- **email_log** - Email delivery tracking
- **contact_messages** - Contact form submissions

### Key Features

- UUID primary keys
- Automatic timestamps
- Foreign key constraints
- Optimized indexes
- Enum types for status fields

## Scripts

```bash
npm run dev        # Start development server
npm run start      # Start production server
npm run db:migrate # Run database migrations
npm run db:seed    # Seed database (verify setup)
```

## Environment Variables

See `ENVIRONMENT_VARIABLES_BACKEND.md` for detailed configuration.

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set up proper CORS origins
4. Configure Stripe webhooks
5. Set strong JWT secrets
6. Monitor logs and health endpoint

## Security

- CORS protection
- Helmet security headers
- Input validation with Zod
- Environment variable validation
- Secure webhook signature verification
