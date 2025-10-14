import express from "express";
import pool from "../database/connection.js";

const router = express.Router();

// =============================================
// CONTACT FORM API ROUTES
// =============================================

// Submit contact form
router.post("/submit", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields. Please fill in all required fields.",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    // Insert contact inquiry into database
    const result = await pool.query(
      `INSERT INTO contact_inquiries 
       (name, email, phone, subject, message, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, email, phone || null, subject, message, "new", "medium"]
    );

    const inquiry = result.rows[0];

    // TODO: In the future, add mail provider integration here
    // Example:
    // await sendContactEmail({
    //   to: 'info@ieracademy.com',
    //   from: email,
    //   subject: `Contact Form: ${subject}`,
    //   template: 'contact-form',
    //   data: { name, email, phone, subject, message }
    // });

    res.status(201).json({
      success: true,
      message:
        "Thank you for your inquiry! We'll get back to you within 24 hours.",
      inquiryId: inquiry.id,
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit your inquiry. Please try again later.",
    });
  }
});

// Get all contact inquiries (Admin only - for future CMS)
router.get("/inquiries", async (req, res) => {
  try {
    // TODO: Add authentication check here
    // const token = req.headers.authorization?.replace('Bearer ', '');
    // if (!token || !verifyAdminToken(token)) {
    //   return res.status(401).json({ success: false, error: 'Unauthorized' });
    // }

    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ci.*, s.name as assigned_staff_name
      FROM contact_inquiries ci
      LEFT JOIN staff s ON ci.assigned_to = s.id
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` WHERE ci.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY ci.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) FROM contact_inquiries";
    const countParams = [];
    if (status) {
      countQuery += " WHERE status = $1";
      countParams.push(status);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contact inquiries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch contact inquiries",
    });
  }
});

// Update contact inquiry status (Admin only - for future CMS)
router.put("/inquiries/:id", async (req, res) => {
  try {
    // TODO: Add authentication check here
    const { id } = req.params;
    const { status, priority, assigned_to, admin_notes } = req.body;

    const result = await pool.query(
      `UPDATE contact_inquiries 
       SET status = $1, priority = $2, assigned_to = $3, admin_notes = $4, 
           responded_at = CASE WHEN $1 = 'responded' AND responded_at IS NULL THEN NOW() ELSE responded_at END,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, priority, assigned_to, admin_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Contact inquiry not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Contact inquiry updated successfully",
    });
  } catch (error) {
    console.error("Error updating contact inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update contact inquiry",
    });
  }
});

// Get contact inquiry by ID (Admin only - for future CMS)
router.get("/inquiries/:id", async (req, res) => {
  try {
    // TODO: Add authentication check here
    const { id } = req.params;

    const result = await pool.query(
      `SELECT ci.*, s.name as assigned_staff_name
       FROM contact_inquiries ci
       LEFT JOIN staff s ON ci.assigned_to = s.id
       WHERE ci.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Contact inquiry not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching contact inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch contact inquiry",
    });
  }
});

export default router;
