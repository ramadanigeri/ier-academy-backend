import express from "express";
import pool from "../database/connection.js";
import { sendEventRegistrationConfirmation } from "../services/email.js";
import {
  eventRegistrationSchema,
  eventRegistrationByTitleSchema,
} from "../utils/validation.js";

const router = express.Router();

// ========== CMS ROUTES (Admin) ==========

// Get all events (CMS - returns all events including unpublished)
router.get("/all", async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        id, title, slug, description, event_date, event_end_date,
        location, capacity, current_registrations, price, currency,
        event_type, featured_image, is_published, sort_order, created_at
      FROM events 
    `;

    const params = [];
    let paramCount = 0;

    // Only filter by published status if specifically requested
    if (status === "upcoming") {
      query += ` WHERE event_date > NOW()`;
    } else if (status === "past") {
      query += ` WHERE event_date <= NOW()`;
    }

    query += ` ORDER BY sort_order ASC, event_date ASC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      error: "Failed to fetch events",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Create new event (CMS)
router.post("/", async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      event_date,
      event_end_date,
      location,
      capacity,
      price,
      currency,
      event_type,
      is_published,
      sort_order,
    } = req.body;

    const query = `
      INSERT INTO events (
        title, slug, description, event_date, event_end_date,
        location, capacity, price, currency, event_type,
        is_published, sort_order, current_registrations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0)
      RETURNING *
    `;

    const result = await pool.query(query, [
      title,
      slug,
      description || null,
      event_date,
      event_end_date || null,
      location,
      capacity || 100,
      price || 0,
      currency || "EUR",
      event_type || "workshop",
      is_published || false,
      sort_order || 0,
    ]);

    res.status(201).json({
      data: result.rows[0],
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      error: "Failed to create event",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Update event (CMS)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      description,
      event_date,
      event_end_date,
      location,
      capacity,
      price,
      currency,
      event_type,
      is_published,
      sort_order,
    } = req.body;

    const query = `
      UPDATE events SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        event_date = COALESCE($4, event_date),
        event_end_date = $5,
        location = COALESCE($6, location),
        capacity = COALESCE($7, capacity),
        price = COALESCE($8, price),
        currency = COALESCE($9, currency),
        event_type = COALESCE($10, event_type),
        is_published = COALESCE($11, is_published),
        sort_order = COALESCE($12, sort_order)
      WHERE id = $13
      RETURNING *
    `;

    const result = await pool.query(query, [
      title,
      slug,
      description,
      event_date,
      event_end_date,
      location,
      capacity,
      price,
      currency,
      event_type,
      is_published,
      sort_order,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      data: result.rows[0],
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      error: "Failed to update event",
    });
  }
});

// Delete event (CMS)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM events WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      error: "Failed to delete event",
    });
  }
});

// POST - Register for an event (MUST be before /:id route)
router.post("/:eventId/register", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { firstName, lastName, email, schoolName } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !schoolName) {
      return res
        .status(400)
        .json({ error: "All required fields must be filled" });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check event capacity
      const eventQuery = await client.query(
        "SELECT capacity, current_registrations, title FROM events WHERE id = $1",
        [eventId]
      );

      if (eventQuery.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Event not found" });
      }

      const event = eventQuery.rows[0];
      const availableSeats = event.capacity - event.current_registrations;

      if (availableSeats <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Event is fully booked" });
      }

      // Check if email already registered for this event
      const existingReg = await client.query(
        "SELECT id FROM event_registrations WHERE event_id = $1 AND email = $2",
        [eventId, email]
      );

      if (existingReg.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Email already registered for this event" });
      }

      // Insert registration
      await client.query(
        `INSERT INTO event_registrations (event_id, first_name, last_name, email, school, event_title)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [eventId, firstName, lastName, email, schoolName, event.title]
      );

      // Update current_registrations
      await client.query(
        "UPDATE events SET current_registrations = current_registrations + 1 WHERE id = $1",
        [eventId]
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Registration successful",
        data: {
          firstName,
          lastName,
          email,
          schoolName,
          eventTitle: event.title,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({
      error: "Registration failed",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get single event by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id, title, slug, description, event_date, event_end_date,
        location, capacity, current_registrations, price, currency,
        event_type, featured_image, is_published, sort_order, created_at
      FROM events 
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      error: "Failed to fetch event",
    });
  }
});

// ========== PUBLIC ROUTES ==========

// Get public events (for frontend /events page)
router.get("/", async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        id, title, slug, description, event_date, event_end_date,
        location, capacity, current_registrations, price, currency,
        event_type, featured_image, is_published, sort_order, created_at
      FROM events 
      WHERE is_published = true
    `;

    const params = [];
    let paramCount = 0;

    if (status === "upcoming") {
      query += ` AND event_date > NOW()`;
    } else if (status === "past") {
      query += ` AND event_date <= NOW()`;
    }

    query += ` ORDER BY sort_order ASC, event_date ASC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Get public events error:", error);
    res.status(500).json({
      error: "Failed to fetch events",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Register for an event
router.post("/:eventId/register", async (req, res) => {
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
      return res.status(404).json({ message: "Event not found" });
    }

    const event = eventResult.rows[0];
    const now = new Date();
    const eventDate = new Date(event.event_date);

    // Check if event is in the future
    if (eventDate <= now) {
      return res.status(400).json({ message: "Event registration is closed" });
    }

    // Check capacity
    if (event.current_registrations >= event.capacity) {
      return res.status(400).json({ message: "Event is fully booked" });
    }

    // Check if user already registered
    const existingRegistrationQuery = `
      SELECT id FROM event_registrations 
      WHERE event_id = $1 AND email = $2
    `;
    const existingResult = await pool.query(existingRegistrationQuery, [
      eventId,
      registrationData.email,
    ]);

    if (existingResult.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event" });
    }

    // Start transaction
    await pool.query("BEGIN");

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
        registrationData.phone,
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
      await pool.query("COMMIT");

      // Send confirmation email
      try {
        await sendEventRegistrationConfirmation({
          registrationId,
          event: {
            title: event.title,
            eventDate: event.event_date,
            location: event.location,
            price: event.price,
            currency: event.currency,
          },
          participant: {
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            email: registrationData.email,
          },
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the registration if email fails
      }

      res.status(201).json({
        message: "Registration successful",
        registrationId,
        eventTitle: event.title,
      });
    } catch (error) {
      // Rollback transaction
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Event registration error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Invalid registration data",
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: "Registration failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Register for an event by title (for frontend modal)
router.post("/register", async (req, res) => {
  try {
    const registrationData = eventRegistrationByTitleSchema.parse(req.body);

    // Find event by title (case-insensitive)
    const eventQuery = `
      SELECT * FROM events 
      WHERE LOWER(title) = LOWER($1) AND is_published = true
      ORDER BY event_date DESC
      LIMIT 1
    `;
    const eventResult = await pool.query(eventQuery, [
      registrationData.eventTitle,
    ]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
        message: `No event found with title: ${registrationData.eventTitle}`,
      });
    }

    const event = eventResult.rows[0];
    const eventId = event.id;
    const now = new Date();
    const eventDate = new Date(event.event_date);

    // Check if event is in the future
    if (eventDate <= now) {
      return res.status(400).json({
        success: false,
        error: "Event registration is closed",
        message: "This event has already passed or is currently happening",
      });
    }

    // Check capacity
    if (event.current_registrations >= event.capacity) {
      return res.status(400).json({
        success: false,
        error: "Event is fully booked",
        message: "Sorry, this event is at full capacity",
      });
    }

    // Check if user already registered
    const existingRegistrationQuery = `
      SELECT id FROM event_registrations 
      WHERE event_id = $1 AND email = $2
    `;
    const existingResult = await pool.query(existingRegistrationQuery, [
      eventId,
      registrationData.email,
    ]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Already registered",
        message: "You are already registered for this event",
      });
    }

    // Start transaction
    await pool.query("BEGIN");

    try {
      // Insert registration with school and event_title fields
      const registrationQuery = `
        INSERT INTO event_registrations (
          event_id, first_name, last_name, email, phone, school, event_title, registered_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      const registrationResult = await pool.query(registrationQuery, [
        eventId,
        registrationData.firstName,
        registrationData.lastName,
        registrationData.email,
        "", // phone is empty since frontend doesn't provide it
        registrationData.school,
        registrationData.eventTitle,
        registrationData.registeredAt
          ? new Date(registrationData.registeredAt)
          : new Date(),
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
      await pool.query("COMMIT");

      // Send confirmation email
      try {
        await sendEventRegistrationConfirmation({
          registrationId,
          event: {
            title: event.title,
            eventDate: event.event_date,
            location: event.location,
            price: event.price,
            currency: event.currency,
          },
          participant: {
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            email: registrationData.email,
          },
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the registration if email fails
      }

      res.status(201).json({
        success: true,
        message: "Registration successful",
        registrationId,
        data: {
          id: registrationId,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          email: registrationData.email,
          school: registrationData.school,
          eventTitle: registrationData.eventTitle,
          registeredAt:
            registrationData.registeredAt || new Date().toISOString(),
          status: "confirmed",
        },
      });
    } catch (error) {
      // Rollback transaction
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Event registration error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Invalid registration data",
        message: "Please check your input and try again",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Registration failed",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Admin dashboard for event registrations
router.get("/admin/dashboard", async (req, res) => {
  try {
    const { eventTitle, search, dateFrom, dateTo } = req.query;

    let query = `
      SELECT 
        er.*,
        e.title as event_title,
        e.event_date,
        e.location,
        e.capacity,
        e.current_registrations
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (eventTitle && eventTitle !== "all") {
      query += ` AND LOWER(e.title) = LOWER($${paramIndex})`;
      params.push(eventTitle);
      paramIndex++;
    }

    if (search && search.trim().length > 0) {
      query += ` AND (er.first_name ILIKE $${paramIndex} OR er.last_name ILIKE $${paramIndex} OR er.email ILIKE $${paramIndex} OR er.school ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND er.registered_at >= $${paramIndex}::date`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND er.registered_at < ($${paramIndex}::date + INTERVAL '1 day')`;
      params.push(dateTo);
      paramIndex++;
    }

    query += " ORDER BY er.registered_at DESC";

    const result = await pool.query(query, params);
    const registrations = result.rows;

    // Get unique event titles for filter
    const eventsResult = await pool.query(`
      SELECT DISTINCT e.title 
      FROM events e
      JOIN event_registrations er ON e.id = er.event_id
      ORDER BY e.title
    `);
    const events = eventsResult.rows;

    // Get event statistics
    const statsQuery = `
      SELECT 
        e.title,
        e.capacity,
        e.current_registrations,
        e.event_date,
        COUNT(er.id) as total_registrations
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      WHERE e.is_published = true
      GROUP BY e.id, e.title, e.capacity, e.current_registrations, e.event_date
      ORDER BY e.event_date DESC
    `;
    const statsResult = await pool.query(statsQuery);
    const eventStats = statsResult.rows;

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IER Academy - Event Registrations Dashboard</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #0d274d 0%, #1a3a5f 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px;
        }
        .controls {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
        }
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            align-items: end;
        }
        .form-group {
            display: flex;
            flex-direction: column;
        }
        .form-group label {
            margin-bottom: 8px;
            font-weight: 600;
            color: #0d274d;
            font-size: 14px;
        }
        .form-group input,
        .form-group select {
            padding: 10px 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s;
        }
        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: #00beeb;
        }
        .btn-group {
            display: flex;
            gap: 10px;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .btn-primary {
            background: #00beeb;
            color: white;
        }
        .btn-primary:hover {
            background: #0099c7;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 190, 235, 0.4);
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-export {
            background: #fbab2c;
            color: white;
        }
        .btn-export:hover {
            background: #e89b1a;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #00beeb;
            transition: transform 0.3s;
        }
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #0d274d;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #6c757d;
            font-size: 14px;
            font-weight: 600;
        }
        .event-stats {
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
        }
        .event-stats h3 {
            margin: 0 0 20px 0;
            color: #0d274d;
        }
        .event-stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #fbab2c;
        }
        .event-stat-item:last-child {
            margin-bottom: 0;
        }
        .event-name {
            font-weight: 600;
            color: #0d274d;
        }
        .event-date {
            font-size: 12px;
            color: #6c757d;
        }
        .event-capacity {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .capacity-bar {
            width: 150px;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
        }
        .capacity-fill {
            height: 100%;
            background: linear-gradient(90deg, #00beeb 0%, #0099c7 100%);
            transition: width 0.3s;
        }
        .capacity-full {
            background: linear-gradient(90deg, #dc3545 0%, #c82333 100%);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        thead {
            background: linear-gradient(135deg, #0d274d 0%, #1a3a5f 100%);
            color: white;
        }
        th {
            padding: 16px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        td {
            padding: 16px 12px;
            border-bottom: 1px solid #e9ecef;
        }
        tbody tr:hover {
            background: #f8f9fa;
        }
        tbody tr:last-child td {
            border-bottom: none;
        }
        .user-info strong {
            color: #0d274d;
            display: block;
            margin-bottom: 4px;
        }
        .user-info small {
            color: #6c757d;
            font-size: 12px;
        }
        .email-link {
            color: #00beeb;
            text-decoration: none;
        }
        .email-link:hover {
            text-decoration: underline;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #6c757d;
        }
        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            .stats-grid {
                grid-template-columns: 1fr;
            }
            table {
                font-size: 12px;
            }
            th, td {
                padding: 10px 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Event Registrations Dashboard</h1>
            <p>Track and manage all event registrations in real-time</p>
        </div>
        
        <div class="content">
            <!-- Filters -->
            <div class="controls">
                <form method="GET" class="form-grid">
                    <div class="form-group">
                        <label>🎪 Event Filter</label>
                        <select name="eventTitle" onchange="this.form.submit()">
                            <option value="all" ${eventTitle === "all" || !eventTitle ? "selected" : ""}>All Events</option>
                            ${events
                              .map(
                                (e) => `
                                <option value="${e.title}" ${eventTitle === e.title ? "selected" : ""}>
                                    ${e.title}
                                </option>
                            `
                              )
                              .join("")}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>🔍 Search</label>
                        <input type="text" name="search" placeholder="Name, email, or school..." value="${search || ""}" />
                    </div>
                    
                    <div class="form-group">
                        <label>📅 Date From</label>
                        <input type="date" name="dateFrom" value="${dateFrom || ""}" onchange="this.form.submit()" />
                    </div>
                    
                    <div class="form-group">
                        <label>📅 Date To</label>
                        <input type="date" name="dateTo" value="${dateTo || ""}" onchange="this.form.submit()" />
                    </div>
                    
                    <div class="btn-group">
                        <button type="submit" class="btn btn-primary">🔍 Search</button>
                        <a href="/api/events/admin/dashboard" class="btn btn-secondary">🔄 Clear</a>
                    </div>
                </form>
            </div>

            <!-- Quick Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${registrations.length}</div>
                    <div class="stat-label">📋 Total Registrations</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${events.length}</div>
                    <div class="stat-label">🎪 Active Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${new Set(registrations.map((r) => r.email)).size}</div>
                    <div class="stat-label">👥 Unique Participants</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${new Set(registrations.map((r) => r.school)).size}</div>
                    <div class="stat-label">🏫 Schools Represented</div>
                </div>
            </div>

            <!-- Event Capacity Overview -->
            ${
              eventStats.length > 0
                ? `
            <div class="event-stats">
                <h3>📊 Event Capacity Overview</h3>
                ${eventStats
                  .map((event) => {
                    const percentage =
                      event.capacity > 0
                        ? (event.current_registrations / event.capacity) * 100
                        : 0;
                    const isFull = percentage >= 100;
                    return `
                    <div class="event-stat-item">
                        <div>
                            <div class="event-name">${event.title}</div>
                            <div class="event-date">${new Date(
                              event.event_date
                            ).toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}</div>
                        </div>
                        <div class="event-capacity">
                            <div class="capacity-bar">
                                <div class="capacity-fill ${isFull ? "capacity-full" : ""}" style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            <span><strong>${event.current_registrations}</strong> / ${event.capacity}</span>
                        </div>
                    </div>
                    `;
                  })
                  .join("")}
            </div>
            `
                : ""
            }

            <!-- Registrations Table -->
            ${
              registrations.length > 0
                ? `
            <table>
                <thead>
                    <tr>
                        <th>👤 Participant</th>
                        <th>🏫 School</th>
                        <th>📧 Contact</th>
                        <th>🎪 Event</th>
                        <th>📅 Registered</th>
                    </tr>
                </thead>
                <tbody>
                    ${registrations
                      .map(
                        (reg) => `
                    <tr>
                        <td class="user-info">
                            <strong>${reg.first_name} ${reg.last_name}</strong>
                            <small>ID: ${reg.id.substring(0, 8)}...</small>
                        </td>
                        <td>
                            <strong>${reg.school || "N/A"}</strong>
                        </td>
                        <td>
                            <a href="mailto:${reg.email}" class="email-link">${reg.email}</a>
                            ${reg.phone ? `<br><small>${reg.phone}</small>` : ""}
                        </td>
                        <td>
                            <strong>${reg.event_title}</strong><br>
                            <small>📍 ${reg.location}</small><br>
                            <small>📅 ${new Date(reg.event_date).toLocaleDateString("en-GB")}</small>
                        </td>
                        <td>
                            <strong>${new Date(reg.registered_at).toLocaleDateString("en-GB")}</strong><br>
                            <small>${new Date(reg.registered_at).toLocaleTimeString()}</small>
                        </td>
                    </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
            `
                : `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No Registrations Found</h3>
                <p>There are no event registrations matching your filters.</p>
            </div>
            `
            }
        </div>
    </div>
</body>
</html>
    `);
  } catch (error) {
    console.error("Event dashboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get event registrations (admin only) - API endpoint for specific event
router.get("/:eventId/registrations", async (req, res) => {
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
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Get registrations error:", error);
    res.status(500).json({
      message: "Failed to fetch registrations",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

export default router;
