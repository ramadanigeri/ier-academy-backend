# IER Academy Backend - Complete Setup Guide

## 🎯 Overview

This is the **backend API server** for IER Academy. It handles:

- ✅ **Database operations** (PostgreSQL via Prisma)
- ✅ **Payment processing** (Stripe)
- ✅ **Email notifications** (Resend)
- ✅ **Course enrollment**
- ✅ **Webhook handling**

**Architecture:** Microservices (Backend API + Frontend)

---

## 📦 Technology Stack

| Technology     | Purpose             | Version |
| -------------- | ------------------- | ------- |
| **Node.js**    | Runtime environment | 18+     |
| **Express.js** | Web framework       | 4.x     |
| **PostgreSQL** | Database            | 14+     |
| **Prisma ORM** | Database toolkit    | 6.x     |
| **Stripe**     | Payment processing  | Latest  |
| **Resend**     | Email service       | Latest  |
| **dotenv**     | Environment config  | Latest  |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/ramadanigeri/ier-academy-backend.git
cd ier-academy-backend

# Install dependencies
npm install
```

### 2. Set Up Database

**Option A: Local PostgreSQL**

```bash
# Create database
createdb ier_academy

# Or using psql
psql -U postgres
CREATE DATABASE ier_academy;
\q
```

**Option B: Cloud PostgreSQL (Supabase/Neon/Railway)**

1. Create a new PostgreSQL database
2. Get connection string
3. Add to `.env` file

### 3. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Required variables:**

```env
# Database - Direct PostgreSQL connection
DATABASE_URL="postgresql://user:password@localhost:5432/ier_academy"
DIRECT_URL="postgresql://user:password@localhost:5432/ier_academy"

# OR use individual parameters (recommended for special characters in password)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ier_academy
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Server
PORT=3001
NODE_ENV=development

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (Email)
RESEND_API_KEY=re_...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Sanity CMS (if backend fetches content)
NEXT_PUBLIC_SANITY_PROJECT_ID=nyz4k3ve
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2023-01-01
SANITY_API_READ_TOKEN=your_token
```

### 4. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### 5. Start Development Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

Server will start at: `http://localhost:3001`

---

## 📁 Project Structure

```
ier-academy-backend/
├── src/
│   ├── server.js                 # Main entry point
│   ├── routes/
│   │   ├── enrollment.js         # POST /api/enrollment
│   │   ├── payment.js            # POST /api/payment
│   │   └── webhooks.js           # POST /api/webhooks/stripe
│   ├── services/
│   │   ├── email.js              # Email sending logic
│   │   ├── payment.js            # Stripe integration
│   │   └── sanity.js             # Sanity CMS queries
│   ├── database/
│   │   ├── connection.js         # PostgreSQL connection pool
│   │   └── migrate.js            # Database migrations
│   └── lib/
│       ├── prisma.js             # Prisma singleton
│       └── utils.js              # Helper functions
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
├── .env                          # Environment variables (local)
├── .env.example                  # Environment template
├── package.json                  # Dependencies
└── README.md                     # Basic readme
```

---

## 🗄️ Database Schema

### Enrollment Table

```prisma
model Enrollment {
  id            String   @id @default(cuid())
  name          String
  email         String
  phone         String?
  courseSlug    String
  sessionId     String?
  status        String   @default("pending")
  createdAt     DateTime @default(now())
  payments      Payment[]
  emailLogs     EmailLog[]
}
```

### Payment Table

```prisma
model Payment {
  id                String   @id @default(cuid())
  enrollmentId      String
  amount            Float
  currency          String   @default("EUR")
  stripePaymentId   String?  @unique
  status            String   @default("pending")
  paymentMethod     String?
  createdAt         DateTime @default(now())
  enrollment        Enrollment @relation(fields: [enrollmentId], references: [id])
}
```

### EmailLog Table

```prisma
model EmailLog {
  id                String   @id @default(cuid())
  enrollmentId      String
  emailType         String
  recipientEmail    String
  subject           String?
  sentAt            DateTime @default(now())
  status            String   @default("sent")
  providerMessageId String?
  enrollment        Enrollment @relation(fields: [enrollmentId], references: [id])
}
```

---

## 🔌 API Endpoints

### 1. Create Enrollment

**Endpoint:** `POST /api/enrollment`

**Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "courseSlug": "advanced-leadership",
  "sessionId": "session-123"
}
```

**Response:**

```json
{
  "success": true,
  "enrollment": {
    "id": "clx1234567",
    "name": "John Doe",
    "email": "john@example.com",
    "courseSlug": "advanced-leadership",
    "status": "pending"
  }
}
```

### 2. Create Payment Intent

**Endpoint:** `POST /api/payment/create-intent`

**Request:**

```json
{
  "enrollmentId": "clx1234567",
  "amount": 29900,
  "currency": "EUR"
}
```

**Response:**

```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentId": "pm_1234567"
}
```

### 3. Confirm Payment

**Endpoint:** `POST /api/payment/confirm`

**Request:**

```json
{
  "enrollmentId": "clx1234567",
  "paymentIntentId": "pi_1234567",
  "paymentMethodId": "pm_card_visa"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment confirmed and enrollment completed"
}
```

### 4. Stripe Webhook

**Endpoint:** `POST /api/webhooks/stripe`

**Headers:**

```
stripe-signature: t=xxx,v1=yyy
```

Handles:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

## 📧 Email System

Uses **Resend** for transactional emails.

### Email Templates

1. **Enrollment Confirmation**
   - Sent when enrollment is created
   - Contains course details
   - Payment instructions

2. **Payment Confirmation**
   - Sent after successful payment
   - Receipt with payment details
   - Course access information

3. **Payment Failed**
   - Sent when payment fails
   - Instructions to retry

### Configure Resend

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Get API key
4. Add to `.env`: `RESEND_API_KEY=re_...`

---

## 💳 Stripe Configuration

### Test Mode Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle to **Test mode**
3. Get test keys from **Developers → API keys**
4. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   ```

### Webhook Setup

1. Install Stripe CLI:

   ```bash
   # Windows (scoop)
   scoop install stripe

   # Mac
   brew install stripe/stripe-cli/stripe
   ```

2. Login:

   ```bash
   stripe login
   ```

3. Forward webhooks (development):

   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

4. Copy webhook secret:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Test Cards

| Card Number           | Description                         |
| --------------------- | ----------------------------------- |
| `4242 4242 4242 4242` | Successful payment                  |
| `4000 0000 0000 9995` | Declined payment                    |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

---

## 🌍 Deployment

### Option 1: Railway

1. Create account at [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL database
4. Deploy from GitHub
5. Set environment variables
6. Get deployment URL

### Option 2: Render

1. Create account at [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Add PostgreSQL database
5. Configure environment variables
6. Deploy

### Option 3: DigitalOcean App Platform

1. Create account at [digitalocean.com](https://digitalocean.com)
2. App Platform → Create App
3. Connect GitHub
4. Add PostgreSQL database
5. Set environment variables
6. Deploy

### Environment Variables for Production

```env
# Production Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Server
PORT=3001
NODE_ENV=production

# Stripe LIVE keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Resend
RESEND_API_KEY=re_...

# Frontend URL (production)
FRONTEND_URL=https://ieracademy.com
```

---

## 🔐 Security Checklist

- [x] Environment variables not committed
- [x] Database credentials secured
- [x] Stripe webhook signature verification
- [x] CORS configured for frontend only
- [x] Input validation on all endpoints
- [x] SQL injection protection (Prisma)
- [x] Rate limiting on API endpoints
- [x] HTTPS in production
- [x] Secrets rotation policy

---

## 🧪 Testing

### Manual Testing

```bash
# Test enrollment creation
curl -X POST http://localhost:3001/api/enrollment \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "courseSlug": "test-course"
  }'

# Test payment intent
curl -X POST http://localhost:3001/api/payment/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentId": "xxx",
    "amount": 29900
  }'
```

### Automated Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

---

## 🐛 Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server`

**Solution:**

1. Check database is running
2. Verify connection string
3. Check firewall settings
4. Test connection:
   ```bash
   npx prisma studio
   ```

### Stripe Webhook Error

**Error:** `Webhook signature verification failed`

**Solution:**

1. Check webhook secret matches
2. Verify request came from Stripe
3. Use Stripe CLI for local testing

### Email Not Sending

**Error:** `Email delivery failed`

**Solution:**

1. Verify Resend API key
2. Check domain verification
3. Review Resend logs
4. Check email template

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

---

## 📊 Monitoring

### Health Check Endpoint

```bash
GET /health
```

Response:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Logs

```bash
# View logs (development)
npm run dev

# View logs (production - Railway)
railway logs

# View logs (production - Render)
# Available in Render dashboard
```

---

## 🔄 Database Migrations

### Create New Migration

```bash
# After modifying schema.prisma
npx prisma migrate dev --name add_new_field
```

### Apply Migrations (Production)

```bash
npx prisma migrate deploy
```

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

### View Database

```bash
# Open Prisma Studio
npx prisma studio
```

---

## 🌿 Git Branching Strategy

See `BRANCHING_STRATEGY.md` for complete workflow.

**Quick reference:**

- **`master`** → Production (live backend)
- **`dev`** → Staging/testing
- **`feature/*`** → New features

**Workflow:**

```bash
# Create feature
git checkout dev
git checkout -b feature/my-feature

# Develop & test

# Merge to dev
git checkout dev
git merge feature/my-feature

# After testing, merge to master
git checkout master
git merge dev
git push origin master
```

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Resend Documentation](https://resend.com/docs)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs)

---

## 🆘 Support

**Issues?**

- Check troubleshooting section
- Review logs
- Test with minimal example
- Open GitHub issue with details

**Need help?**

- Email: support@ieracademy.com
- GitHub Issues
- Documentation

---

## ✅ Post-Setup Checklist

After completing setup, verify:

- [ ] Backend server runs successfully
- [ ] Database connection works
- [ ] Prisma Studio opens
- [ ] Test enrollment creates successfully
- [ ] Stripe test payment works
- [ ] Email sending works
- [ ] Webhooks are configured
- [ ] Environment variables set
- [ ] Git branches configured
- [ ] Deployment successful

---

## 🎉 You're Ready!

Your backend is now configured and ready to serve the IER Academy frontend!

**Next steps:**

1. Configure frontend to use backend URL
2. Test full enrollment flow
3. Set up production deployment
4. Configure monitoring
5. Test payment gateway

**Happy coding!** 🚀
