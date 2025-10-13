import express from "express";
import { v4 as uuidv4 } from "uuid";
import pool from "../database/connection.js";
import { enrollmentSchema } from "../utils/validation.js";
import { getCourseBySlug } from "../services/sanity.js";
// import { sendEnrollmentConfirmationEmail } from '../services/email.js'; // Disabled for now

const router = express.Router();

// Create enrollment from frontend CMS (new endpoint)
router.post("/", async (req, res) => {
  try {
    const {
      courseSlug,
      sessionId,
      studentName,
      studentEmail,
      studentPhone,
      studentIdCard,
      studentAddress,
      fatherName,
      amount,
      currency,
      gdprConsent,
    } = req.body;

    // Validate required fields
    if (!courseSlug || !sessionId || !studentName || !studentEmail) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Create enrollment record
    const enrollmentId = uuidv4();

    const result = await pool.query(
      `INSERT INTO enrollments (
        id, course_slug, session_id, full_name, email, phone,
        id_card, address, father_name, gdpr_consent, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        enrollmentId,
        courseSlug,
        parseInt(sessionId), // Convert to integer
        studentName,
        studentEmail,
        studentPhone,
        studentIdCard,
        studentAddress,
        fatherName,
        gdprConsent,
        "enrolled",
      ]
    );

    const enrollment = result.rows[0];

    // Create initial payment record
    await pool.query(
      `INSERT INTO payments (
        enrollment_id, amount, currency, status
      ) VALUES ($1, $2, $3, $4)`,
      [enrollmentId, parseFloat(amount) || 0, currency || "EUR", "pending"]
    );

    res.status(201).json({
      success: true,
      enrollmentId: enrollment.id,
      status: "enrolled",
      message: "Enrollment created successfully",
    });
  } catch (error) {
    console.error("Enrollment creation error:", error);
    res.status(500).json({
      error: "Failed to create enrollment",
      details: error.message,
    });
  }
});

// Create enrollment (no payment processing)
router.post("/checkout", async (req, res) => {
  try {
    // Validate request data
    const validatedData = enrollmentSchema.parse(req.body);

    // Get course data from Sanity
    const course = await getCourseBySlug(validatedData.courseSlug);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Find the specific session
    const session = course.sessions?.find(
      (s) => s._id === validatedData.sessionId
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if session is open for enrollment
    if (session.status !== "open") {
      return res
        .status(400)
        .json({ error: "Session is not open for enrollment" });
    }

    // Check available spots
    const availableSpots = session.capacity - session.enrolledCount;
    if (availableSpots <= 0) {
      return res.status(400).json({ error: "Session is full" });
    }

    // Create enrollment record
    const enrollmentId = uuidv4();

    const result = await pool.query(
      `
      INSERT INTO enrollments (
        id, course_slug, session_id, full_name, email, phone, 
        id_card, address, father_name, gdpr_consent, marketing_consent, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `,
      [
        enrollmentId,
        validatedData.courseSlug,
        validatedData.sessionId,
        validatedData.fullName,
        validatedData.email,
        validatedData.phone,
        validatedData.idCard,
        validatedData.address,
        validatedData.fatherName,
        validatedData.gdprConsent,
        validatedData.marketingConsent || false,
        "enrolled",
      ]
    );

    const enrollment = result.rows[0];

    // Create initial payment record with pending status
    await pool.query(
      `
      INSERT INTO payments (
        enrollment_id, amount, currency, status, verified_by, payment_date
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        enrollmentId,
        course.price || 0,
        course.currency || "EUR",
        "pending",
        null,
        null,
      ]
    );

    // TODO: Implement email confirmation when email service is configured
    // await sendEnrollmentConfirmationEmail({
    //   enrollmentId: enrollment.id,
    //   fullName: validatedData.fullName,
    //   email: validatedData.email,
    //   courseName: course.title,
    //   sessionName: session.title,
    //   amount: course.price,
    //   currency: course.currency || 'EUR',
    // });

    res.json({
      success: true,
      enrollmentId: enrollment.id,
      status: "enrolled",
      message:
        "Enrollment created successfully. Please complete payment via bank transfer.",
    });
  } catch (error) {
    console.error("Enrollment error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// Get enrollment by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT * FROM enrollments WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get enrollment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update enrollment status (admin only)
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminEmail } = req.body;

    if (
      !status ||
      !["pending", "payment_confirmed", "registered", "cancelled"].includes(
        status
      )
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Update enrollment status
    const result = await pool.query(
      `
      UPDATE enrollments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const enrollment = result.rows[0];

    // If status changed to 'payment_confirmed', create or update payment record
    if (status === "payment_confirmed") {
      // First check if payment record exists
      const existingPayment = await pool.query(
        `SELECT id FROM payments WHERE enrollment_id = $1`,
        [id]
      );

      if (existingPayment.rows.length > 0) {
        // Update existing payment record
        await pool.query(
          `
          UPDATE payments 
          SET status = $1, payment_date = CURRENT_TIMESTAMP, verified_by = $2, updated_at = CURRENT_TIMESTAMP
          WHERE enrollment_id = $3
        `,
          ["verified", adminEmail || "admin", id]
        );
      } else {
        // Create new payment record
        await pool.query(
          `
          INSERT INTO payments (
            enrollment_id, amount, currency, status, payment_date, verified_by
          ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
        `,
          [id, 0, "EUR", "verified", adminEmail || "admin"]
        );
      }
    }

    // If status changed to 'registered', update payment to paid
    if (status === "registered") {
      await pool.query(
        `
        UPDATE payments 
        SET status = 'paid', updated_at = CURRENT_TIMESTAMP 
        WHERE enrollment_id = $1
      `,
        [id]
      );
    }

    res.json({
      success: true,
      enrollment: result.rows[0],
      message: `Enrollment status updated to ${status}`,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all enrollments (admin only - with filters)
router.get("/", async (req, res) => {
  try {
    const { status, courseSlug, sessionId } = req.query;

    let query = "SELECT * FROM enrollments WHERE 1=1";
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (courseSlug) {
      query += ` AND course_slug = $${paramIndex}`;
      params.push(courseSlug);
      paramIndex++;
    }

    if (sessionId) {
      query += ` AND session_id = $${paramIndex}`;
      params.push(sessionId);
      paramIndex++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);

    res.json({
      success: true,
      enrollments: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Get enrollments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
