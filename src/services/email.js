import { sendMailViaGraph } from "./outlookOAuth.js";
import { sendMail as sendMailViaSMTP } from "./smtpService.js";

// Choose which email service to use based on environment variable
const USE_SMTP = process.env.USE_SMTP === 'true';

// Unified send function that routes to the appropriate service
async function sendEmail(message) {
  if (USE_SMTP) {
    return await sendMailViaSMTP(message);
  } else {
    return await sendMailViaGraph(message);
  }
}

// Bank transfer details (centralized)
const BANK_DETAILS = {
  all: {
    bankName: "Banka Raiffeisen Sha, Tirana, Albania",
    accountHolder: "IER ACADEMY SHPK L92217036A",
    accountNumber: "0011434704",
    swiftCode: "SGSBALTX",
    iban: "AL54202111300000000011434704",
  },
  eur: {
    bankName: "Banka Raiffeisen Sha, Tirana, Albania",
    accountHolder: "IER ACADEMY SHPK L92217036A",
    accountNumber: "0021434704",
    swiftCode: "SGSBALTX",
    iban: "AL39202111300000000021434704",
  },
};

export async function sendEnrollmentConfirmationEmail({
  enrollmentId,
  fullName,
  email,
  courseName,
  sessionName,
  amount,
  currency,
  courseDetails = {},
  sessionDetails = {},
}) {
  try {
    const message = {
      subject: `Enrollment Pending Payment - ${courseName}`,
      body: {
        contentType: "HTML",
        content: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enrollment Confirmation - ${courseName}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f9fafb;
            line-height: 1.6;
        }
        .email-container {
            max-width: 768px;
            margin: 0 auto;
            background-color: #f9fafb;
            padding: 16px;
            min-height: 100vh;
        }
        .soft-card {
            background: #f6f7fb;
            padding: 24px;
            border-radius: 16px;
            box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
            margin-bottom: 24px;
        }
        .soft-card-inset {
            background: #f9fafb;
            padding: 16px;
            border-radius: 12px;
            box-shadow: inset 8px 8px 16px #e8eaed, inset -8px -8px 16px #ffffff;
        }
        .success-header {
            text-align: center;
            margin-bottom: 40px;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background: #f6f7fb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
        }
        .success-icon svg {
            width: 40px;
            height: 40px;
            color: #00bceb;
        }
        .success-title {
            font-size: 30px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 8px 0;
        }
        .success-subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 16px 0;
        }
        .details-container {
            background: #f6f7fb;
            padding: 20px;
            border-radius: 12px;
            box-shadow: inset 6px 6px 12px rgba(0, 0, 0, 0.06), inset -6px -6px 12px rgba(255, 255, 255, 0.7);
            margin-top: 16px;
        }
        .detail-item {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }
        .detail-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
        }
        .detail-label {
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #6b7280;
            margin: 0 0 4px 0;
        }
        .detail-value {
            font-weight: 500;
            color: #111827;
            margin: 0;
        }
        .detail-value.mono {
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 14px;
        }
        .currency-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .currency-badge.all {
            background: #dcfce7;
            color: #166534;
        }
        .currency-badge.eur {
            background: #dbeafe;
            color: #1e40af;
        }
        .bank-details {
            margin-bottom: 16px;
        }
        .bank-details:last-child {
            margin-bottom: 0;
        }
        .payment-amount {
            background: #f9fafb;
            padding: 16px;
            border-radius: 12px;
            box-shadow: inset 8px 8px 16px #e8eaed, inset -8px -8px 16px #ffffff;
        }
        .amount-label {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #374151;
            margin: 0 0 4px 0;
        }
        .amount-value {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin: 0;
        }
        .important-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .important-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        .important-item:last-child {
            margin-bottom: 0;
        }
        .bullet-point {
            width: 4px;
            height: 4px;
            background: #9ca3af;
            border-radius: 50%;
            margin: 6px 8px 0 0;
            flex-shrink: 0;
        }
        .important-text {
            font-size: 14px;
            color: #374151;
            margin: 0;
        }
        .important-text strong {
            font-weight: 600;
        }
        .important-text a {
            color: #00bceb;
            text-decoration: underline;
            font-weight: 500;
        }
        .contact-info {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
        }
        .contact-info p {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Success Header -->
        <div class="success-header">
            <div class="soft-card">
                <div class="success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>
                </div>
                <h1 class="success-title">Enrollment Successful</h1>
                <p class="success-subtitle">Thank you for enrolling. Complete the payment to confirm your registration.</p>
            </div>
        </div>

        <!-- Enrollment Details -->
        <div class="soft-card">
            <h2 class="section-title">Enrollment Details</h2>
            <div class="details-container">
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Course</p>
                        <p class="detail-value">${courseName}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Session</p>
                        <p class="detail-value">${sessionName}</p>
                    </div>
                </div>
                ${
                  sessionDetails.startDate
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Start Date</p>
                        <p class="detail-value">${new Date(
                          sessionDetails.startDate
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</p>
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  sessionDetails.endDate
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">End Date</p>
                        <p class="detail-value">${new Date(
                          sessionDetails.endDate
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</p>
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  sessionDetails.time
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Time</p>
                        <p class="detail-value">${sessionDetails.time}</p>
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  sessionDetails.location
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Location</p>
                        <p class="detail-value">${sessionDetails.location}</p>
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  courseDetails.duration
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Duration</p>
                        <p class="detail-value">${courseDetails.duration}</p>
                    </div>
                </div>
                `
                    : ""
                }
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Enrollment ID</p>
                        <p class="detail-value mono">${enrollmentId}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bank Transfer Details -->
        <div class="soft-card">
            <h2 class="section-title">Bank Transfer Details</h2>
            
            <!-- ALL Account -->
            <div class="bank-details">
                <div class="currency-badge all">ALL (Albanian Lek)</div>
                <div class="details-container">
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">Bank Name</p>
                            <p class="detail-value">${BANK_DETAILS.all.bankName}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">Account Holder</p>
                            <p class="detail-value">${BANK_DETAILS.all.accountHolder}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">Account Number</p>
                            <p class="detail-value mono">${BANK_DETAILS.all.accountNumber}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">SWIFT Code</p>
                            <p class="detail-value mono">${BANK_DETAILS.all.swiftCode}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">IBAN Number</p>
                            <p class="detail-value mono">${BANK_DETAILS.all.iban}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- EUR Account -->
            <div class="bank-details">
                <div class="currency-badge eur">EUR (Euro)</div>
                <div class="details-container">
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">Bank Name</p>
                            <p class="detail-value">${BANK_DETAILS.eur.bankName}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">Account Holder</p>
                            <p class="detail-value">${BANK_DETAILS.eur.accountHolder}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">Account Number</p>
                            <p class="detail-value mono">${BANK_DETAILS.eur.accountNumber}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">SWIFT Code</p>
                            <p class="detail-value mono">${BANK_DETAILS.eur.swiftCode}</p>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div style="flex: 1;">
                            <p class="detail-label">IBAN Number</p>
                            <p class="detail-value mono">${BANK_DETAILS.eur.iban}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Amount -->
        ${
          amount
            ? `
        <div class="soft-card">
            <h2 class="section-title">Payment Amount</h2>
            <div class="payment-amount">
                <p class="amount-label">Total Amount</p>
                <p class="amount-value">${amount} ${currency}</p>
            </div>
        </div>
        `
            : ""
        }

        <!-- Important Information -->
        <div class="soft-card">
            <h3 class="section-title">Important Information</h3>
            <ul class="important-list">
                <li class="important-item">
                    <span class="bullet-point"></span>
                    <p class="important-text">Complete payment within <strong>3 days</strong> to secure your enrollment</p>
                </li>
                <li class="important-item">
                    <span class="bullet-point"></span>
                    <p class="important-text">You will receive email confirmation once payment is verified</p>
                </li>
                <li class="important-item">
                    <span class="bullet-point"></span>
                    <p class="important-text">Contact us at <a href="mailto:info@ieracademy.com">info@ieracademy.com</a> for any questions</p>
                </li>
            </ul>
        </div>

        <div class="contact-info">
            <p>This is an automated email from IER Academy.</p>
            <p>© ${new Date().getFullYear()} IER Academy. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
      },
      toRecipients: [
        {
          emailAddress: {
            address: email,
          },
        },
      ],
      replyTo: [
        {
          emailAddress: {
            address: "noreply@ieracademy.com",
          },
        },
      ],
    };

    const result = await sendEmail(message);
    return result;
  } catch (error) {
    console.error("Failed to send enrollment confirmation email:", error);
    throw error;
  }
}

export async function sendPaymentConfirmationEmail({
  enrollmentId,
  fullName,
  email,
  courseName,
  sessionName,
  amount,
  currency,
  courseDetails = {},
  sessionDetails = {},
}) {
  try {
    const message = {
      subject: `Payment Confirmed - ${courseName}`,
      body: {
        contentType: "HTML",
        content: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed - ${courseName}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f9fafb;
            line-height: 1.6;
        }
        .email-container {
            max-width: 768px;
            margin: 0 auto;
            background-color: #f9fafb;
            padding: 16px;
            min-height: 100vh;
        }
        .soft-card {
            background: #f6f7fb;
            padding: 24px;
            border-radius: 16px;
            box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
            margin-bottom: 24px;
        }
        .soft-card-inset {
            background: #f9fafb;
            padding: 16px;
            border-radius: 12px;
            box-shadow: inset 8px 8px 16px #e8eaed, inset -8px -8px 16px #ffffff;
        }
        .success-header {
            text-align: center;
            margin-bottom: 40px;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background: #f6f7fb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
        }
        .success-icon svg {
            width: 40px;
            height: 40px;
            color: #6ebe4a;
        }
        .success-title {
            font-size: 30px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 8px 0;
        }
        .success-subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 16px 0;
        }
        .details-container {
            background: #f6f7fb;
            padding: 20px;
            border-radius: 12px;
            box-shadow: inset 6px 6px 12px rgba(0, 0, 0, 0.06), inset -6px -6px 12px rgba(255, 255, 255, 0.7);
            margin-top: 16px;
        }
        .detail-item {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }
        .detail-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
        }
        .detail-label {
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #6b7280;
            margin: 0 0 4px 0;
        }
        .detail-value {
            font-weight: 500;
            color: #111827;
            margin: 0;
        }
        .detail-value.mono {
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 600;
            background: #dcfce7;
            color: #166534;
        }
        .payment-amount {
            background: #f9fafb;
            padding: 16px;
            border-radius: 12px;
            box-shadow: inset 8px 8px 16px #e8eaed, inset -8px -8px 16px #ffffff;
        }
        .amount-label {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #374151;
            margin: 0 0 4px 0;
        }
        .amount-value {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin: 0;
        }
        .next-steps-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .next-step-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        .next-step-item:last-child {
            margin-bottom: 0;
        }
        .bullet-point {
            width: 4px;
            height: 4px;
            background: #9ca3af;
            border-radius: 50%;
            margin: 6px 8px 0 0;
            flex-shrink: 0;
        }
        .next-step-text {
            font-size: 14px;
            color: #374151;
            margin: 0;
        }
        .next-step-text strong {
            font-weight: 600;
        }
        .contact-info {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
        }
        .contact-info p {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Success Header -->
        <div class="success-header">
            <div class="soft-card">
                <div class="success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>
                </div>
                <h1 class="success-title">Payment Confirmed!</h1>
                <p class="success-subtitle">Your enrollment is now complete and confirmed.</p>
            </div>
        </div>

        <!-- Enrollment Details -->
        <div class="soft-card">
            <h2 class="section-title">Enrollment Details</h2>
            <div class="details-container">
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Course</p>
                        <p class="detail-value">${courseName}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Session</p>
                        <p class="detail-value">${sessionName}</p>
                    </div>
                </div>
                ${
                  sessionDetails.startDate
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Start Date</p>
                        <p class="detail-value">${new Date(
                          sessionDetails.startDate
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</p>
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  sessionDetails.endDate
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">End Date</p>
                        <p class="detail-value">${new Date(
                          sessionDetails.endDate
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</p>
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  sessionDetails.time
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Time</p>
                        <p class="detail-value">${sessionDetails.time}</p>
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  sessionDetails.location
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Location</p>
                        <p class="detail-value">${sessionDetails.location}</p>
                    </div>
                </div>
                `
                    : ""
                }
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Enrollment ID</p>
                        <p class="detail-value mono">${enrollmentId}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Status</p>
                        <p class="detail-value"><span class="status-badge">REGISTERED</span></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Amount -->
        <div class="soft-card">
            <h2 class="section-title">Payment Confirmed</h2>
            <div class="payment-amount">
                <p class="amount-label">Amount Paid</p>
                <p class="amount-value">${amount} ${currency}</p>
            </div>
        </div>

        <!-- Next Steps -->
        <div class="soft-card">
            <h3 class="section-title">Next Steps</h3>
            <ul class="next-steps-list">
                <li class="next-step-item">
                    <span class="bullet-point"></span>
                    <p class="next-step-text">Add the course dates to your calendar</p>
                </li>
                <li class="next-step-item">
                    <span class="bullet-point"></span>
                    <p class="next-step-text">Please arrive <strong>15 minutes before</strong> the course starts</p>
                </li>
            </ul>
        </div>

        <div class="contact-info">
            <p><strong>Need Help?</strong> Contact us at <a href="mailto:info@ieracademy.com">info@ieracademy.com</a></p>
            <p>We look forward to seeing you in the course!</p>
            <p>Best regards,<br><strong>The IER Academy Team</strong></p>
            <p>© ${new Date().getFullYear()} IER Academy. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
      },
      toRecipients: [
        {
          emailAddress: {
            address: email,
          },
        },
      ],
      replyTo: [
        {
          emailAddress: {
            address: "noreply@ieracademy.com",
          },
        },
      ],
    };

    const result = await sendEmail(message);
    return result;
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error);
    throw error;
  }
}

export async function sendContactFormNotification({
  name,
  email,
  phone,
  subject,
  message,
}) {
  try {
    const message = {
      subject: `New Contact Form Submission: ${subject || "No Subject"}`,
      body: {
        contentType: "HTML",
        content: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission - IER Academy</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f9fafb;
            line-height: 1.6;
        }
        .email-container {
            max-width: 768px;
            margin: 0 auto;
            background-color: #f9fafb;
            padding: 16px;
            min-height: 100vh;
        }
        .soft-card {
            background: #f6f7fb;
            padding: 24px;
            border-radius: 16px;
            box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
            margin-bottom: 24px;
        }
        .details-container {
            background: #f6f7fb;
            padding: 20px;
            border-radius: 12px;
            box-shadow: inset 6px 6px 12px rgba(0, 0, 0, 0.06), inset -6px -6px 12px rgba(255, 255, 255, 0.7);
            margin-top: 16px;
        }
        .detail-item {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }
        .detail-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
        }
        .detail-label {
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #6b7280;
            margin: 0 0 4px 0;
        }
        .detail-value {
            font-weight: 500;
            color: #111827;
            margin: 0;
        }
        .detail-value.mono {
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 14px;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 16px 0;
        }
        .alert-header {
            text-align: center;
            margin-bottom: 40px;
        }
        .alert-icon {
            width: 80px;
            height: 80px;
            background: #f6f7fb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #ffffff;
        }
        .alert-icon svg {
            width: 40px;
            height: 40px;
            color: #fbab18;
        }
        .alert-title {
            font-size: 30px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 8px 0;
        }
        .alert-subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .message-container {
            background: #f6f7fb;
            padding: 20px;
            border-radius: 12px;
            box-shadow: inset 6px 6px 12px rgba(0, 0, 0, 0.06), inset -6px -6px 12px rgba(255, 255, 255, 0.7);
            margin-top: 16px;
        }
        .message-text {
            color: #374151;
            font-size: 16px;
            line-height: 1.6;
            margin: 0;
            white-space: pre-wrap;
        }
        .action-buttons {
            display: flex;
            gap: 16px;
            margin-top: 24px;
        }
        .action-button {
            flex: 1;
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
        }
        .action-button.primary {
            background: #00bceb;
            color: white;
            box-shadow: 8px 8px 16px rgba(0, 188, 235, 0.3), -8px -8px 16px rgba(0, 188, 235, 0.1);
        }
        .action-button.secondary {
            background: #f6f7fb;
            color: #374151;
            box-shadow: 8px 8px 16px #d1d5db, -8px -8px 16px #ffffff;
        }
        .contact-info {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
        }
        .contact-info p {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
        }
        .subject-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .subject-badge.course-inquiry {
            background: #dcfce7;
            color: #166534;
        }
        .subject-badge.enrollment-question {
            background: #dbeafe;
            color: #1e40af;
        }
        .subject-badge.technical-support {
            background: #fef3c7;
            color: #92400e;
        }
        .subject-badge.partnership-opportunity {
            background: #e0e7ff;
            color: #3730a3;
        }
        .subject-badge.other {
            background: #f3f4f6;
            color: #374151;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Alert Header -->
        <div class="alert-header">
            <div class="soft-card">
                <div class="alert-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                    </svg>
                </div>
                <h1 class="alert-title">New Contact Form Submission</h1>
                <p class="alert-subtitle">A user has submitted a question through your contact form</p>
            </div>
        </div>

        <!-- Contact Details -->
        <div class="soft-card">
            <h2 class="section-title">Contact Details</h2>
            <div class="details-container">
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Name</p>
                        <p class="detail-value">${name}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Email</p>
                        <p class="detail-value">${email}</p>
                    </div>
                </div>
                ${
                  phone
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Phone</p>
                        <p class="detail-value">${phone}</p>
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  subject
                    ? `
                <div class="detail-item">
                    <div style="flex: 1;">
                        <p class="detail-label">Subject</p>
                        <div class="subject-badge ${subject.toLowerCase().replace(/\s+/g, "-")}">${subject}</div>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>

        <!-- Message -->
        <div class="soft-card">
            <h2 class="section-title">Message</h2>
            <div class="message-container">
                <p class="message-text">${message}</p>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="soft-card">
            <h3 class="section-title">Quick Actions</h3>
            <div class="action-buttons">
                <a href="mailto:${email}?subject=Re: ${subject || "Your inquiry"}" class="action-button primary">Reply to ${name}</a>
                <a href="mailto:${email}" class="action-button secondary">View Email</a>
            </div>
        </div>

        <div class="contact-info">
            <p>This message was sent through the IER Academy contact form.</p>
            <p>© ${new Date().getFullYear()} IER Academy. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
      },
      toRecipients: [
        {
          emailAddress: {
            address: "info@ieracademy.com",
          },
        },
      ],
      replyTo: [
        {
          emailAddress: {
            address: email,
          },
        },
      ],
    };

    const result = await sendEmail(message);
    return result;
  } catch (error) {
    console.error("Failed to send contact form notification:", error);
    throw error;
  }
}

export async function sendEventRegistrationConfirmation({
  registrationId,
  event,
  participant,
}) {
  try {
    const message = {
      subject: `Event Registration Confirmed - ${event.title}`,
      body: {
        contentType: "HTML",
        content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #22c55e; color: white; padding: 15px 30px; border-radius: 50px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px;">✓ Registration Confirmed!</h1>
            </div>
            <p style="color: #6b7280; font-size: 16px;">You're registered for our upcoming event</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin-top: 0;">Dear ${participant.firstName},</p>
            
            <p>Thank you for registering for our event! Your registration has been confirmed.</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1f2937;">Event Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Event:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${event.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${new Date(
                  event.eventDate
                ).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Location:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${event.location}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Price:</strong></td>
                <td style="padding: 8px 0; text-align: right; color: #2563eb; font-size: 18px;"><strong>${event.price === 0 ? "Free" : `${event.price} ${event.currency}`}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Registration ID:</strong></td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${registrationId}</td>
              </tr>
            </table>
          </div>
          
          ${
            event.price > 0
              ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #78350f;">⚠️ Payment Instructions</h2>
            <p style="margin-bottom: 15px; color: #78350f;"><strong>Please complete your payment via bank transfer using the details below:</strong></p>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>Bank Name:</strong></td>
                  <td style="padding: 6px 0; text-align: right;">${BANK_DETAILS.all.bankName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>Account Name:</strong></td>
                  <td style="padding: 6px 0; text-align: right;">${BANK_DETAILS.all.accountHolder}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>Account Number:</strong></td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace;">${BANK_DETAILS.all.accountNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>IBAN:</strong></td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace;">${BANK_DETAILS.all.iban}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>SWIFT/BIC:</strong></td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace;">${BANK_DETAILS.all.swiftCode}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #dc2626; color: white; padding: 12px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 0; text-align: center;"><strong>Payment Reference (IMPORTANT):</strong></p>
              <p style="margin: 5px 0; text-align: center; font-family: monospace; font-size: 16px; font-weight: bold;">${registrationId}</p>
              <p style="margin: 0; text-align: center; font-size: 12px;">Please include this in your transfer reference</p>
            </div>
          </div>
          `
              : `
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #166534;">🎉 Free Event Registration</h2>
            <p style="margin-bottom: 15px; color: #166534;"><strong>Great news! This is a free event - no payment required.</strong></p>
            <p style="color: #166534;">Your registration is confirmed and you're all set to attend!</p>
          </div>
          `
          }
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">What Happens Next?</h3>
            <ol style="padding-left: 20px; color: #4b5563; line-height: 1.8;">
              ${
                event.price > 0
                  ? `
              <li>Complete the bank transfer using the details above</li>
              <li>Make sure to include your <strong>Registration ID</strong> in the payment reference</li>
              <li>Keep your payment receipt for your records</li>
              <li>Your payment will be verified within 1-2 business days</li>
              `
                  : `
              <li>No payment required - you're all set!</li>
              `
              }
              <li>You'll receive event details and materials 1 week before the event</li>
              <li>Save this registration ID for your records: <strong>${registrationId}</strong></li>
            </ol>
          </div>
          
          <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af; text-align: center;">
              <strong>Questions?</strong> Contact us at <a href="mailto:info@ieracademy.com" style="color: #2563eb;">info@ieracademy.com</a>
            </p>
          </div>
          
          <div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>This is an automated email from IER Academy.</p>
            <p>© ${new Date().getFullYear()} IER Academy. All rights reserved.</p>
          </div>
        </div>
      `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: participant.email,
          },
        },
      ],
      replyTo: [
        {
          emailAddress: {
            address: "noreply@ieracademy.com",
          },
        },
      ],
    };

    const result = await sendEmail(message);
    return result;
  } catch (error) {
    console.error(
      "Failed to send event registration confirmation email:",
      error
    );
    throw error;
  }
}
