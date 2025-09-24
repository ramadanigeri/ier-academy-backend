import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database/connection.js';
import { enrollmentSchema } from '../utils/validation.js';
import { getCourseBySlug } from '../services/sanity.js';
import { createPaymentSession } from '../services/stripe.js';

const router = express.Router();

// Create enrollment and initiate payment
router.post('/checkout', async (req, res) => {
  try {
    // Validate request data
    const validatedData = enrollmentSchema.parse(req.body);

    // Get course data from Sanity (you might want to move this to backend)
    const course = await getCourseBySlug(validatedData.courseSlug);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find the specific session
    const session = course.sessions?.find(
      (s) => s._id === validatedData.sessionId,
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if session is open for enrollment
    if (session.status !== 'open') {
      return res
        .status(400)
        .json({ error: 'Session is not open for enrollment' });
    }

    // Check available spots
    const availableSpots = session.capacity - session.enrolledCount;
    if (availableSpots <= 0) {
      return res.status(400).json({ error: 'Session is full' });
    }

    // Create enrollment record
    const enrollmentId = uuidv4();

    const result = await pool.query(
      `
      INSERT INTO enrollments (
        id, course_slug, session_id, full_name, email, phone, 
        gdpr_consent, marketing_consent, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        enrollmentId,
        validatedData.courseSlug,
        validatedData.sessionId,
        validatedData.fullName,
        validatedData.email,
        validatedData.phone,
        validatedData.gdprConsent,
        validatedData.marketingConsent || false,
        'pending',
      ],
    );

    const enrollment = result.rows[0];

    // Create payment session
    const paymentSession = await createPaymentSession({
      enrollmentId: enrollment.id,
      amount: course.price,
      currency: course.currency || 'EUR',
      description: `${course.title} - ${session.title}`,
      customerEmail: validatedData.email,
      returnUrl: `${process.env.FRONTEND_URL}/thank-you?enrollment=${enrollment.id}&course=${encodeURIComponent(course.title)}&session=${encodeURIComponent(session.title)}`,
      metadata: {
        courseSlug: validatedData.courseSlug,
        sessionId: validatedData.sessionId,
        enrollmentId: enrollment.id,
      },
    });

    // Update enrollment with payment reference
    await pool.query(
      `
      UPDATE enrollments 
      SET payment_ref = $1 
      WHERE id = $2
    `,
      [paymentSession.sessionId, enrollment.id],
    );

    res.json({
      enrollmentId: enrollment.id,
      paymentUrl: paymentSession.sessionUrl,
    });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enrollment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT * FROM enrollments WHERE id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
