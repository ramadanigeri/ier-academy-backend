# Email Integration Summary - Microsoft 365 / Outlook

## Why Microsoft 365 / Outlook?

Your backend integrates with **Microsoft 365 / Exchange Online** via Azure AD to send emails. This is the standard approach for organizations using Microsoft 365.

## Architecture Overview

### 1. **Outlook OAuth Token Provider** (`src/services/outlookOAuth.js`)

- **Purpose**: Handles Azure AD authentication and token management
- **Scope**: `https://outlook.office365.com/.default`
- **Flow**: Client Credentials Flow (app-only authentication)
- **Features**:
  - ✅ Token caching (avoids unnecessary API calls)
  - ✅ Automatic token refresh before expiry
  - ✅ 5-minute safety buffer for token renewal

### 2. **Email Service** (`src/services/email.js`)

- **Purpose**: Contains all email templates and sending logic
- **Functions**:
  - `sendEnrollmentConfirmationEmail()` - Sent when student enrolls
  - `sendPaymentConfirmationEmail()` - Sent when payment is confirmed
  - `sendContactFormNotification()` - Sent to admin when form submitted
  - `sendEventRegistrationConfirmation()` - Sent for event registrations

### 3. **Communication Flow**

```
Application → outlookOAuth.js → Azure AD → Get Access Token
                    ↓
Application → Microsoft Graph API → Send Email
```

## Why Not Use the Microsoft Graph SDK?

I **initially** included the Microsoft Graph SDK, but then **removed it** because:

### ❌ **Microsoft Graph SDK Disadvantages**:

1. **Extra dependency** (adds ~2MB to node_modules)
2. **More complex** - requires custom auth provider
3. **Unnecessary abstraction** - We only need to send emails
4. **Callback-based auth** - Awkward with modern async/await

### ✅ **Direct HTTP Approach (Current Implementation)**:

1. **Lightweight** - Only uses native `fetch` API
2. **Simple** - Direct API calls, easy to debug
3. **Matches your C# implementation** - Same OAuth flow
4. **Better error handling** - Direct access to HTTP responses
5. **Token caching** - Implemented in `outlookOAuth.js`

## How It Works

### Step 1: Get Access Token

```javascript
// outlookOAuth.js
POST https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
Body:
  client_id: {AZURE_CLIENT_ID}
  client_secret: {AZURE_CLIENT_SECRET}
  scope: https://outlook.office365.com/.default
  grant_type: client_credentials

Response:
  {
    access_token: "eyJ0eXAiOiJKV1...",
    expires_in: 3600,
    token_type: "Bearer"
  }
```

### Step 2: Send Email via Graph API

```javascript
// outlookOAuth.js
POST https://graph.microsoft.com/v1.0/users/{MAILBOX}/sendMail
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
  {
    message: {
      subject: "...",
      body: { contentType: "HTML", content: "..." },
      toRecipients: [...],
      replyTo: [...]
    }
  }
```

### Step 3: Token Caching

- Token is cached in memory
- Expiry time stored separately
- Automatic refresh 5 minutes before expiry
- No Redis required for basic use case

## Environment Variables Required

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_SERVICE_MAILBOX=noreply@ieracademy.com
```

## Comparison with Your C# Implementation

| Feature           | C# Implementation                        | Node.js Implementation                      |
| ----------------- | ---------------------------------------- | ------------------------------------------- |
| **OAuth Scope**   | `https://outlook.office365.com/.default` | `https://outlook.office365.com/.default` ✅ |
| **Auth Flow**     | Client Credentials                       | Client Credentials ✅                       |
| **Token Caching** | Redis cache                              | In-memory cache ✅                          |
| **API Library**   | ConfidentialClientApplicationBuilder     | Direct fetch() calls ✅                     |
| **Token Refresh** | Manual expiry check                      | Automatic with 5-min buffer ✅              |

## Why This Is the Right Approach

1. **Matches existing C# code** - Same OAuth scope and flow
2. **No external dependencies** - Only native Node.js features
3. **Simpler debugging** - Clear HTTP requests/responses
4. **Production-ready** - Token caching, error handling, retry logic
5. **Maintainable** - Easy to understand and modify

## Setup Instructions

See `AZURE_EMAIL_SETUP.md` for complete setup instructions.

## Key Points

- ✅ Uses **Outlook 365 scope** (`https://outlook.office365.com/.default`)
- ✅ **No Microsoft Graph SDK** - Direct HTTP calls with native `fetch`
- ✅ **Token caching** - Reduces API calls to Azure AD
- ✅ **Same pattern as your C# code** - OAuth client credentials flow
- ✅ **Simple and maintainable** - No complex SDK abstractions

