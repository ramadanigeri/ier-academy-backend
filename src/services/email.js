// Email service disabled - will be implemented in the future
// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// Bank transfer details (centralized)
const BANK_DETAILS = {
  bankName: "Your Bank Name",
  accountName: "IER Academy",
  accountNumber: "1234567890",
  iban: "XX00 0000 0000 0000 0000",
  swift: "XXXXXX00",
};

export async function sendEnrollmentConfirmationEmail({
  enrollmentId,
  fullName,
  email,
  courseName,
  sessionName,
  amount,
  currency,
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "IER Academy <noreply@ieracademy.com>",
      to: [email],
      subject: `Enrollment Pending Payment - ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">IER Academy</h1>
            <p style="color: #6b7280; font-size: 16px;">Thank you for enrolling!</p>
          </div>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin-top: 0;">Dear ${fullName},</p>
            
            <p>Thank you for enrolling in our course. Your enrollment has been received and is <strong>pending payment confirmation</strong>.</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1f2937;">Course Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Course:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${courseName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Session:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${sessionName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Amount to Pay:</strong></td>
                <td style="padding: 8px 0; text-align: right; color: #2563eb; font-size: 18px;"><strong>${amount} ${currency}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Enrollment ID:</strong></td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${enrollmentId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #78350f;">⚠️ Payment Instructions</h2>
            <p style="margin-bottom: 15px; color: #78350f;"><strong>Please complete your payment via bank transfer using the details below:</strong></p>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>Bank Name:</strong></td>
                  <td style="padding: 6px 0; text-align: right;">${
                    BANK_DETAILS.bankName
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>Account Name:</strong></td>
                  <td style="padding: 6px 0; text-align: right;">${
                    BANK_DETAILS.accountName
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>Account Number:</strong></td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace;">${
                    BANK_DETAILS.accountNumber
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>IBAN:</strong></td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace;">${
                    BANK_DETAILS.iban
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>SWIFT/BIC:</strong></td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace;">${
                    BANK_DETAILS.swift
                  }</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #dc2626; color: white; padding: 12px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 0; text-align: center;"><strong>Payment Reference (IMPORTANT):</strong></p>
              <p style="margin: 5px 0; text-align: center; font-family: monospace; font-size: 16px; font-weight: bold;">${enrollmentId}</p>
              <p style="margin: 0; text-align: center; font-size: 12px;">Please include this in your transfer reference</p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">What Happens Next?</h3>
            <ol style="padding-left: 20px; color: #4b5563; line-height: 1.8;">
              <li>Complete the bank transfer using the details above</li>
              <li>Make sure to include your <strong>Enrollment ID</strong> in the payment reference</li>
              <li>Keep your payment receipt for your records</li>
              <li>Your payment will be verified within 1-2 business days</li>
              <li>Once verified, you'll receive a confirmation email with course access details</li>
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
    });

    if (error) {
      throw error;
    }

    // Log email sent
    return data;
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
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "IER Academy <noreply@ieracademy.com>",
      to: [email],
      subject: `Payment Confirmed - ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #22c55e; color: white; padding: 15px 30px; border-radius: 50px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px;">✓ Payment Confirmed!</h1>
            </div>
            <p style="color: #6b7280; font-size: 16px;">Your enrollment is now complete</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin-top: 0;">Dear ${fullName},</p>
            
            <p>Great news! Your payment has been verified and your enrollment is now <strong>confirmed</strong>.</p>
            
            <p>You're all set to join the course!</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1f2937;">Enrollment Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Course:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${courseName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Session:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${sessionName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
                <td style="padding: 8px 0; text-align: right;"><strong>${amount} ${currency}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Enrollment ID:</strong></td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${enrollmentId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; text-align: right; color: #22c55e;"><strong>REGISTERED</strong></td>
              </tr>
            </table>
          </div>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Next Steps</h3>
            <ul style="padding-left: 20px; color: #4b5563; line-height: 1.8;">
              <li>You'll receive course materials and joining instructions 3-5 days before the start date</li>
              <li>Save this enrollment ID for your records</li>
              <li>Add the course dates to your calendar</li>
              <li>Prepare any questions you may have</li>
            </ul>
          </div>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #1e40af;">
              <strong>Need Help?</strong> Contact us at <a href="mailto:info@ieracademy.com" style="color: #2563eb;">info@ieracademy.com</a>
            </p>
          </div>
          
          <p>We look forward to seeing you in the course!</p>
          
          <p>Best regards,<br><strong>The IER Academy Team</strong></p>
          
          <div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>© ${new Date().getFullYear()} IER Academy. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      throw error;
    }

    return data;
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
    const { data, error } = await resend.emails.send({
      from: "IER Academy <noreply@ieracademy.com>",
      to: ["info@ieracademy.com"], // Replace with your admin email
      subject: `New Contact Form Submission: ${subject || "No Subject"}`,
      html: `
         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
           <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
             <h1 style="margin: 0; font-size: 28px;">New Contact Form Submission</h1>
             <p style="margin: 10px 0 0 0; opacity: 0.9;">IER Academy</p>
           </div>
           
           <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
             <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
             
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
             ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ""}
             
             <h3>Message:</h3>
             <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea;">
               <p style="margin: 0; white-space: pre-wrap;">${message}</p>
             </div>
             
             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
               <p>This message was sent through the IER Academy contact form.</p>
               <p>Reply directly to: <a href="mailto:${email}" style="color: #667eea;">${email}</a></p>
             </div>
           </div>
         </div>
       `,
    });

    if (error) {
      throw error;
    }

    return data;
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
    const { data, error } = await resend.emails.send({
      from: "IER Academy <noreply@ieracademy.com>",
      to: [participant.email],
      subject: `Event Registration Confirmed - ${event.title}`,
      html: `
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
                <td style="padding: 8px 0; text-align: right;">${
                  event.title
                }</td>
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
                <td style="padding: 8px 0; text-align: right;">${
                  event.location
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Price:</strong></td>
                <td style="padding: 8px 0; text-align: right; color: #2563eb; font-size: 18px;"><strong>${
                  event.price === 0
                    ? "Free"
                    : `${event.price} ${event.currency}`
                }</strong></td>
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
                  <td style="padding: 6px 0; text-align: right;">${BANK_DETAILS.bankName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>Account Name:</strong></td>
                  <td style="padding: 6px 0; text-align: right;">${BANK_DETAILS.accountName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>Account Number:</strong></td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace;">${BANK_DETAILS.accountNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>IBAN:</strong></td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace;">${BANK_DETAILS.iban}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;"><strong>SWIFT/BIC:</strong></td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace;">${BANK_DETAILS.swift}</td>
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
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(
      "Failed to send event registration confirmation email:",
      error
    );
    throw error;
  }
}
