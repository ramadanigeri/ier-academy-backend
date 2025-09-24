import express from 'express';
import pool from '../database/connection.js';
import { verifyWebhookSignature } from '../services/stripe.js';
import { sendEnrollmentConfirmation } from '../services/email.js';
import { getCourseBySlug } from '../services/sanity.js';

const router = express.Router();

// Stripe webhook handler
router.post('/stripe', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature
    const event = verifyWebhookSignature(req.body, signature);

    console.log('Stripe webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

async function handleCheckoutCompleted(session) {
  try {
    const enrollmentId = session.metadata.enrollmentId;

    if (!enrollmentId) {
      console.error('No enrollment ID in session metadata');
      return;
    }

    // Get enrollment details
    const enrollmentResult = await pool.query(
      `
      SELECT * FROM enrollments WHERE id = $1
    `,
      [enrollmentId],
    );

    if (enrollmentResult.rows.length === 0) {
      console.error('Enrollment not found:', enrollmentId);
      return;
    }

    const enrollment = enrollmentResult.rows[0];

    // Update enrollment status to paid
    await pool.query(
      `
      UPDATE enrollments 
      SET status = 'paid', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `,
      [enrollmentId],
    );

    // Create payment record
    await pool.query(
      `
      INSERT INTO payments (
        enrollment_id, provider, provider_payment_id, 
        amount, currency, status, webhook_payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        enrollmentId,
        'stripe',
        session.payment_intent,
        session.amount_total,
        session.currency.toUpperCase(),
        'paid',
        JSON.stringify(session),
      ],
    );

    // Get course and session details for email
    try {
      const course = await getCourseBySlug(enrollment.course_slug);
      const sessionInfo = course?.sessions?.find(
        (s) => s._id === enrollment.session_id,
      );

      if (course && sessionInfo) {
        // Send confirmation email
        await sendEnrollmentConfirmation({
          to: enrollment.email,
          enrollmentId: enrollment.id,
          studentName: enrollment.full_name,
          courseName: course.title,
          sessionName: sessionInfo.title,
          sessionDate: sessionInfo.startDate,
          amount: course.price,
          currency: course.currency || 'EUR',
        });

        // Log email
        await pool.query(
          `
          INSERT INTO email_log (
            enrollment_id, email_type, recipient_email, subject, status
          ) VALUES ($1, $2, $3, $4, $5)
        `,
          [
            enrollmentId,
            'enrollment_confirmation',
            enrollment.email,
            `Enrollment Confirmation - ${course.title}`,
            'sent',
          ],
        );
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);

      // Log failed email
      await pool.query(
        `
        INSERT INTO email_log (
          enrollment_id, email_type, recipient_email, subject, status
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        [
          enrollmentId,
          'enrollment_confirmation',
          enrollment.email,
          'Enrollment Confirmation',
          'failed',
        ],
      );
    }

    console.log('✅ Enrollment completed successfully:', enrollmentId);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  try {
    // Update payment status if needed
    await pool.query(
      `
      UPDATE payments 
      SET status = 'paid', updated_at = CURRENT_TIMESTAMP 
      WHERE provider_payment_id = $1
    `,
      [paymentIntent.id],
    );

    console.log('✅ Payment succeeded:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    // Update payment and enrollment status
    await pool.query(
      `
      UPDATE payments 
      SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
      WHERE provider_payment_id = $1
    `,
      [paymentIntent.id],
    );

    // Update enrollment status
    const paymentResult = await pool.query(
      `
      SELECT enrollment_id FROM payments WHERE provider_payment_id = $1
    `,
      [paymentIntent.id],
    );

    if (paymentResult.rows.length > 0) {
      await pool.query(
        `
        UPDATE enrollments 
        SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `,
        [paymentResult.rows[0].enrollment_id],
      );
    }

    console.log('❌ Payment failed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

export default router;
