# SMTP Email Setup Guide

This guide shows you how to configure SMTP email sending as an alternative to Microsoft Graph API.

## Installation

First, install the required package:

```bash
npm install nodemailer
```

## Configuration

### 1. Update Environment Variables

Add the following to your `.env` file:

```env
# Switch to SMTP instead of Microsoft Graph API
USE_SMTP=true

# SMTP Configuration
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false  # true for port 465, false for other ports
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password-or-app-password
SMTP_FROM=IER Academy <noreply@ieracademy.com>
```

### 2. Provider-Specific Examples

#### Gmail

```env
USE_SMTP=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
SMTP_FROM=IER Academy <noreply@ieracademy.com>
```

**Note:** Gmail requires an [App Password](https://support.google.com/accounts/answer/185833) if you have 2FA enabled.

#### Microsoft 365 (Office 365) - SMTP AUTH

**Note:** You must enable SMTP AUTH in your Office 365 tenant first.

```env
USE_SMTP=true
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@ieracademy.com
SMTP_PASSWORD=your-mailbox-password
SMTP_FROM=IER Academy <noreply@ieracademy.com>
```

**To enable SMTP AUTH in Office 365:**

1. Go to Microsoft 365 admin center
2. Navigate to Exchange admin center
3. Go to Mail flow → Configure SMTP AUTH
4. Enable SMTP AUTH for your organization or specific mailboxes

#### SendGrid

```env
USE_SMTP=true
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=IER Academy <noreply@ieracademy.com>
```

#### Mailgun

```env
USE_SMTP=true
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@yourdomain.com
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=IER Academy <noreply@yourdomain.com>
```

#### AWS SES

```env
USE_SMTP=true
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASSWORD=your-aws-smtp-password
SMTP_FROM=IER Academy <noreply@yourdomain.com>
```

## Usage

### Current Implementation (Automatic Routing)

The email service now automatically routes to the configured provider:

```javascript
import { sendEnrollmentConfirmationEmail } from "./services/email.js";

await sendEnrollmentConfirmationEmail({
  enrollmentId: "ENV-123",
  fullName: "John Doe",
  email: "john@example.com",
  // ... other fields
});
```

The system will:

- Use SMTP if `USE_SMTP=true` in environment
- Use Microsoft Graph API if `USE_SMTP` is not set or is `false`

### Direct SMTP Usage

You can also use the SMTP service directly:

```javascript
import { sendMail } from "./services/smtpService.js";

await sendMail({
  to: "recipient@example.com",
  subject: "Test Email",
  html: "<h1>Hello</h1><p>This is a test email.</p>",
  replyTo: "support@ieracademy.com",
});
```

## Testing

To test your SMTP configuration:

```javascript
import { sendMail } from "./services/smtpService.js";

try {
  const result = await sendMail({
    to: "your-test-email@example.com",
    subject: "SMTP Test",
    html: "<h1>Test Email</h1><p>If you receive this, SMTP is working!</p>",
  });
  console.log("Email sent successfully:", result.messageId);
} catch (error) {
  console.error("Failed to send email:", error);
}
```

## Troubleshooting

### Common Issues

1. **"Invalid login" or "Authentication failed"**

   - Double-check your username and password
   - For Gmail, ensure you're using an App Password
   - For Outlook, check if 2FA requires special settings

2. **Connection timeout**

   - Verify SMTP_HOST and SMTP_PORT are correct
   - Check firewall settings
   - Try a different port (465, 587, or 25)

3. **Emails going to spam**

   - Set up SPF, DKIM, and DMARC records for your domain
   - Use a proper `SMTP_FROM` address
   - Ensure your domain is verified

4. **Rate limiting**
   - Some providers (like Gmail) have daily send limits
   - Consider using a transactional email service (SendGrid, Mailgun) for production

## Switching Between Providers

To switch between SMTP and Microsoft Graph API:

1. **Use SMTP:**

   ```env
   USE_SMTP=true
   # Add SMTP configuration
   ```

2. **Use Microsoft Graph:**
   ```env
   USE_SMTP=false  # or remove USE_SMTP
   # Add Azure configuration
   ```

No code changes are needed - just update your environment variables!

## Security Notes

- Never commit your `.env` file to version control
- Use strong, unique passwords for SMTP accounts
- Consider using environment variables in production (Heroku, AWS, etc.)
- For production, use dedicated transactional email services like SendGrid or Mailgun
