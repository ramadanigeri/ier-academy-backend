import { BANK_DETAILS } from "./bankDetails.js";

export function getEnrollmentConfirmationTemplate({
  courseName,
  enrollmentId,
  sessionName,
  amount,
  currency,
  courseDetails,
  sessionDetails,
}) {
  return `
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
</html>`;
}


