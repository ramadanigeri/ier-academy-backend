import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database/connection.js';
import { contactSchema } from '../utils/validation.js';
import { sendContactFormNotification } from '../services/email.js';

const router = express.Router();

// Submit contact form
router.post('/', async (req, res) => {
  try {
    // Validate request data
    const validatedData = contactSchema.parse(req.body);

    // Save to database
    const contactId = uuidv4();

    const result = await pool.query(
      `
      INSERT INTO contact_messages (
        id, name, email, phone, subject, message
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        contactId,
        validatedData.name,
        validatedData.email,
        validatedData.phone || null,
        validatedData.subject || null,
        validatedData.message,
      ],
    );

    const contactMessage = result.rows[0];

    // Send notification email
    try {
      await sendContactFormNotification({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        subject: validatedData.subject,
        message: validatedData.message,
      });
    } catch (emailError) {
      console.error('Failed to send contact notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      id: contactMessage.id,
      message: 'Contact form submitted successfully',
    });
  } catch (error) {
    console.error('Contact form error:', error);

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

// Get contact messages (admin endpoint)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `
      SELECT * FROM contact_messages 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `,
      [limit, offset],
    );

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM contact_messages
    `);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      messages: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
