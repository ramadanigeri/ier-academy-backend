// SMTP Email Service using Nodemailer

import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Create or return cached SMTP transporter
 */
async function createTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    throw new Error(
      'SMTP credentials not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD'
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for other ports
    auth: {
      user,
      pass: password,
    },
    // Optional: Add timeout settings
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  // Verify transporter connection
  try {
    await transporter.verify();
    console.log('SMTP server connection verified successfully');
  } catch (error) {
    console.error('SMTP server verification failed:', error);
    throw error;
  }

  return transporter;
}

/**
 * Send email via SMTP
 * @param {Object} mailOptions - Email options
 * @param {string} mailOptions.to - Recipient email address
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.html - HTML content
 * @param {string} mailOptions.text - Plain text content (optional)
 * @param {string} mailOptions.replyTo - Reply-to address (optional)
 */
export async function sendMailViaSMTP({
  to,
  subject,
  html,
  text,
  replyTo = 'noreply@ieracademy.com',
}) {
  try {
    const smtpTransporter = await createTransporter();
    const from = process.env.SMTP_FROM || 'IER Academy <noreply@ieracademy.com>';

    const mailOptions = {
      from,
      to,
      subject,
      html,
      text: text || '', // Fallback to empty string if no text provided
      replyTo,
    };

    const result = await smtpTransporter.sendMail(mailOptions);
    console.log('Email sent successfully via SMTP:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send email via SMTP:', error);
    throw error;
  }
}

/**
 * Send email with the same interface as sendMailViaGraph
 * This makes it easy to swap between SMTP and Graph API
 */
export async function sendMail(message) {
  // Convert Graph API message format to SMTP format
  const to = message.toRecipients
    ? message.toRecipients.map((r) => r.emailAddress.address).join(', ')
    : '';
  
  const replyTo = message.replyTo
    ? message.replyTo.map((r) => r.emailAddress.address).join(', ')
    : 'noreply@ieracademy.com';

  return sendMailViaSMTP({
    to,
    subject: message.subject,
    html: message.body?.content || '',
    replyTo,
  });
}

/**
 * Close transporter connection (useful for cleanup or testing)
 */
export function closeTransporter() {
  if (transporter) {
    transporter.close();
    transporter = null;
  }
}


