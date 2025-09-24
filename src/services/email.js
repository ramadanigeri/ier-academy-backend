import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEnrollmentConfirmation({
  to,
  enrollmentId,
  studentName,
  courseName,
  sessionName,
  sessionDate,
  amount,
  currency,
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'IER Academy <noreply@ieracademy.com>',
      to: [to],
      subject: `Enrollment Confirmation - ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to IER Academy!</h1>
          
          <p>Dear ${studentName},</p>
          
          <p>Thank you for enrolling in our course. Your enrollment has been confirmed!</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Course Details</h2>
            <p><strong>Course:</strong> ${courseName}</p>
            <p><strong>Session:</strong> ${sessionName}</p>
            <p><strong>Start Date:</strong> ${new Date(sessionDate).toLocaleDateString()}</p>
            <p><strong>Amount Paid:</strong> ${amount} ${currency}</p>
            <p><strong>Enrollment ID:</strong> ${enrollmentId}</p>
          </div>
          
          <p>We'll send you more details about the course location and materials closer to the start date.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The IER Academy Team</p>
        </div>
      `,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send enrollment confirmation email:', error);
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
      from: 'IER Academy <noreply@ieracademy.com>',
      to: ['info@ieracademy.com'], // Replace with your admin email
      subject: `New Contact Form Submission: ${subject || 'No Subject'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">New Contact Form Submission</h1>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
            
            <h3>Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <p><small>Submitted on: ${new Date().toLocaleString()}</small></p>
        </div>
      `,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send contact form notification:', error);
    throw error;
  }
}
