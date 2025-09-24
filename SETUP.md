# IER Academy Backend Setup

🎉 **Backend successfully separated from frontend!**

## Quick Start

1. **Copy environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**

   ```bash
   # Database - Create PostgreSQL database first
   DATABASE_URL=postgresql://username:password@localhost:5432/ier_academy

   # Stripe - Move these from frontend .env.local
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Email - Set up Resend account (free tier available)
   RESEND_API_KEY=re_your_resend_api_key

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

3. **Set up database:**

   ```bash
   # Create PostgreSQL database
   createdb ier_academy

   # Run migrations
   npm run db:migrate

   # Verify setup
   npm run db:seed
   ```

4. **Start backend:**
   ```bash
   npm run dev
   ```

Backend will run on `http://localhost:3001`

## Environment Variables

See `.env.example` for all required variables.

## API Endpoints

- `GET /health` - Health check
- `POST /api/enrollment/checkout` - Create enrollment
- `GET /api/enrollment/:id` - Get enrollment
- `POST /api/contact` - Contact form
- `POST /api/webhooks/stripe` - Stripe webhooks

## Database Tables

- **enrollments** - Student registrations
- **payments** - Payment records
- **email_log** - Email delivery tracking
- **contact_messages** - Contact form submissions

## Development with Frontend

1. Start backend: `npm run dev` (port 3001)
2. Start frontend: `cd ../ier-academy && npm run dev` (port 3000)

## Production Deployment

Deploy to Railway, Render, AWS, etc. Update `FRONTEND_URL` and `CORS_ORIGINS` for production domains.
