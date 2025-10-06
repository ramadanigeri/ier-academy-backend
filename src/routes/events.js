import express from 'express';
import pool from '../database/connection.js';
import { sendEventRegistrationConfirmation } from '../services/email.js';
import { eventRegistrationSchema } from '../utils/validation.js';

const router = express.Router();

// Register for an event
router.post('/:eventId/register', async (req, res) => {
  try {
    const { eventId } = req.params;
    const registrationData = eventRegistrationSchema.parse(req.body);

    // Get event details
    const eventQuery = `
      SELECT * FROM events 
      WHERE id = $1 AND is_published = true
    `;
    const eventResult = await pool.query(eventQuery, [eventId]);
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = eventResult.rows[0];
    const now = new Date();
    const eventDate = new Date(event.event_date);

    // Check if event is in the future
    if (eventDate <= now) {
      return res.status(400).json({ message: 'Event registration is closed' });
    }

    // Check capacity
    if (event.current_registrations >= event.capacity) {
      return res.status(400).json({ message: 'Event is fully booked' });
    }

    // Check if user already registered
    const existingRegistrationQuery = `
      SELECT id FROM event_registrations 
      WHERE event_id = $1 AND email = $2
    `;
    const existingResult = await pool.query(existingRegistrationQuery, [
      eventId,
      registrationData.email
    ]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Insert registration
      const registrationQuery = `
        INSERT INTO event_registrations (
          event_id, first_name, last_name, email, phone, registered_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `;
      
      const registrationResult = await pool.query(registrationQuery, [
        eventId,
        registrationData.firstName,
        registrationData.lastName,
        registrationData.email,
        registrationData.phone
      ]);

      const registrationId = registrationResult.rows[0].id;

      // Update event registration count
      const updateEventQuery = `
        UPDATE events 
        SET current_registrations = current_registrations + 1
        WHERE id = $1
      `;
      await pool.query(updateEventQuery, [eventId]);

      // Commit transaction
      await pool.query('COMMIT');

      // Send confirmation email
      try {
        await sendEventRegistrationConfirmation({
          registrationId,
          event: {
            title: event.title,
            eventDate: event.event_date,
            location: event.location,
            price: event.price,
            currency: event.currency
          },
          participant: {
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            email: registrationData.email
          }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the registration if email fails
      }

      res.status(201).json({
        message: 'Registration successful',
        registrationId,
        eventTitle: event.title
      });

    } catch (error) {
      // Rollback transaction
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Event registration error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Invalid registration data',
        errors: error.errors
      });
    }

    res.status(500).json({
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get event registrations (admin only)
router.get('/:eventId/registrations', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const query = `
      SELECT 
        er.*,
        e.title as event_title,
        e.event_date,
        e.location
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.event_id = $1
      ORDER BY er.registered_at DESC
    `;
    
    const result = await pool.query(query, [eventId]);
    
    res.json({
      registrations: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      message: 'Failed to fetch registrations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        id, title, slug, description, event_date, event_end_date,
        location, capacity, current_registrations, price, currency,
        event_type, featured_image, is_published, created_at
      FROM events 
      WHERE is_published = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status === 'upcoming') {
      query += ` AND event_date > NOW()`;
    } else if (status === 'past') {
      query += ` AND event_date <= NOW()`;
    }
    
    query += ` ORDER BY event_date ASC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    res.json({
      events: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      message: 'Failed to fetch events',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
