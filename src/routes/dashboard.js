import express from "express";
import pool from "../database/connection.js";

const router = express.Router();

// Get all events with registration counts
router.get("/events", async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id,
        e.title,
        e.slug,
        e.event_date,
        e.event_end_date,
        e.location,
        e.capacity,
        e.current_registrations,
        e.price,
        e.currency,
        e.event_type,
        e.is_published,
        e.created_at,
        COUNT(er.id) as total_registrations
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      WHERE e.is_published = true
      GROUP BY e.id, e.title, e.slug, e.event_date, e.event_end_date, 
               e.location, e.capacity, e.current_registrations, e.price, 
               e.currency, e.event_type, e.is_published, e.created_at
      ORDER BY e.event_date ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch events",
      message: error.message,
    });
  }
});

// Get registrations for a specific event
router.get("/events/:eventId/registrations", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { search, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT 
        er.id,
        er.first_name,
        er.last_name,
        er.email,
        er.phone,
        er.school,
        er.event_title,
        er.registered_at,
        e.title as event_name,
        e.event_date,
        e.location
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.event_id = $1
    `;

    const queryParams = [eventId];

    // Add search functionality
    if (search) {
      query += ` AND (
        er.first_name ILIKE $2 OR 
        er.last_name ILIKE $2 OR 
        er.email ILIKE $2 OR 
        er.school ILIKE $2
      )`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY er.registered_at DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM event_registrations er
      WHERE er.event_id = $1
    `;

    const countParams = [eventId];

    if (search) {
      countQuery += ` AND (
        er.first_name ILIKE $2 OR 
        er.last_name ILIKE $2 OR 
        er.email ILIKE $2 OR 
        er.school ILIKE $2
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch registrations",
      message: error.message,
    });
  }
});

// Get all registrations across all events (admin view)
router.get("/registrations", async (req, res) => {
  try {
    const { search, eventId, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT 
        er.id,
        er.first_name,
        er.last_name,
        er.email,
        er.phone,
        er.school,
        er.event_title,
        er.registered_at,
        e.title as event_name,
        e.event_date,
        e.location,
        e.slug as event_slug
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE 1=1
    `;

    const queryParams = [];

    // Filter by event
    if (eventId) {
      query += ` AND er.event_id = $${queryParams.length + 1}`;
      queryParams.push(eventId);
    }

    // Add search functionality
    if (search) {
      query += ` AND (
        er.first_name ILIKE $${queryParams.length + 1} OR 
        er.last_name ILIKE $${queryParams.length + 1} OR 
        er.email ILIKE $${queryParams.length + 1} OR 
        er.school ILIKE $${queryParams.length + 1} OR
        e.title ILIKE $${queryParams.length + 1}
      )`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY er.registered_at DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE 1=1
    `;

    const countParams = [];

    if (eventId) {
      countQuery += ` AND er.event_id = $${countParams.length + 1}`;
      countParams.push(eventId);
    }

    if (search) {
      countQuery += ` AND (
        er.first_name ILIKE $${countParams.length + 1} OR 
        er.last_name ILIKE $${countParams.length + 1} OR 
        er.email ILIKE $${countParams.length + 1} OR 
        er.school ILIKE $${countParams.length + 1} OR
        e.title ILIKE $${countParams.length + 1}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all registrations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch registrations",
      message: error.message,
    });
  }
});

// Get dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM events WHERE is_published = true) as total_events,
        (SELECT COUNT(*) FROM event_registrations) as total_registrations,
        (SELECT COUNT(DISTINCT event_id) FROM event_registrations) as events_with_registrations,
        (SELECT AVG(current_registrations) FROM events WHERE is_published = true) as avg_registrations_per_event
    `;

    const result = await pool.query(statsQuery);

    // Get recent registrations (last 7 days)
    const recentQuery = `
      SELECT COUNT(*) as recent_registrations
      FROM event_registrations 
      WHERE registered_at >= NOW() - INTERVAL '7 days'
    `;

    const recentResult = await pool.query(recentQuery);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        recent_registrations: recentResult.rows[0].recent_registrations,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics",
      message: error.message,
    });
  }
});

export default router;
