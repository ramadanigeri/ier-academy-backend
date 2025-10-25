import express from "express";
import { v4 as uuidv4 } from "uuid";
import pool from "../database/connection.js";
import { enrollmentSchema } from "../utils/validation.js";
import { getCourseBySlug } from "../services/sanity.js";
// import { sendEnrollmentConfirmationEmail } from '../services/email.js'; // Disabled for now

const router = express.Router();

// Check if user is already enrolled in a session
router.get("/check/:sessionId/:email", async (req, res) => {
  try {
    const { sessionId, email } = req.params;

    const result = await pool.query(
      `SELECT id, status FROM enrollments 
       WHERE session_id = $1 AND email = $2`,
      [sessionId, email]
    );

    res.json({
      success: true,
      isEnrolled: result.rows.length > 0,
      enrollment: result.rows.length > 0 ? result.rows[0] : null,
    });
  } catch (error) {
    console.error("Error checking enrollment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check enrollment status",
    });
  }
});

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

    // Validate ID card (exactly 10 characters)
    if (studentIdCard && studentIdCard.length !== 10) {
      return res.status(400).json({
        error: "ID card number must be exactly 10 characters",
      });
    }

    // Validate phone number format (basic validation for Albanian format)
    if (studentPhone && !/^\+355\d{9}$/.test(studentPhone)) {
      return res.status(400).json({
        error: "Phone number must be in format +355xxxxxxxxx (Albanian format)",
      });
    }

    const parsedSessionId = parseInt(sessionId);

    // Check session availability and status
    const sessionCheck = await pool.query(
      `SELECT id, capacity, enrolled_count, status, is_published
       FROM sessions
       WHERE id = $1`,
      [parsedSessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    const session = sessionCheck.rows[0];

    // Check if session is published
    if (!session.is_published) {
      return res.status(400).json({
        error: "Session is not available for enrollment",
      });
    }

    // Check if session status is registration_open
    if (session.status !== "registration_open") {
      return res.status(400).json({
        error: `Session is ${session.status === "coming_soon" ? "not yet open" : "fully booked"}`,
      });
    }

    // Check if user is already enrolled in this session
    const existingEnrollment = await pool.query(
      `SELECT id FROM enrollments 
       WHERE session_id = $1 AND email = $2`,
      [parsedSessionId, studentEmail]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({
        error: "You are already enrolled in this session",
      });
    }

    // Check available spots (only count registered/payment_confirmed enrollments)
    const registeredCountQuery = await pool.query(
      `SELECT COUNT(*) as registered_count 
       FROM enrollments 
       WHERE session_id = $1 AND status IN ('registered', 'payment_confirmed')`,
      [parsedSessionId]
    );
    const registeredCount = parseInt(
      registeredCountQuery.rows[0].registered_count
    );
    const availableSpots = session.capacity - registeredCount;

    if (availableSpots <= 0) {
      // Update session status to fully_booked
      await pool.query(
        `UPDATE sessions SET status = 'fully_booked' WHERE id = $1`,
        [parsedSessionId]
      );

      return res.status(400).json({
        error: "Session is fully booked",
      });
    }

    // Create enrollment record
    const enrollmentId = uuidv4();

    const result = await pool.query(
      `INSERT INTO enrollments (
        id, course_slug, session_id, full_name, email, phone,
        id_card, address, gdpr_consent, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        enrollmentId,
        courseSlug,
        parsedSessionId,
        studentName,
        studentEmail,
        studentPhone,
        studentIdCard,
        studentAddress,
        gdprConsent,
        "enrolled",
      ]
    );

    const enrollment = result.rows[0];

    // Don't increment enrolled_count here - seats are only reduced when payment is confirmed
    // The session capacity remains available until the user is fully registered

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
      availableSpots: availableSpots,
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
        id_card, address, gdpr_consent, marketing_consent, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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

    // Handle seat counting based on status change
    if (enrollment.session_id) {
      // Get current registered count for this session
      const registeredCountQuery = await pool.query(
        `SELECT COUNT(*) as registered_count 
         FROM enrollments 
         WHERE session_id = $1 AND status IN ('registered', 'payment_confirmed')`,
        [enrollment.session_id]
      );
      const registeredCount = parseInt(
        registeredCountQuery.rows[0].registered_count
      );

      // Get session capacity
      const sessionQuery = await pool.query(
        `SELECT capacity FROM sessions WHERE id = $1`,
        [enrollment.session_id]
      );
      const sessionCapacity = sessionQuery.rows[0]?.capacity || 0;

      // Update session status based on registered count
      const isFull = registeredCount >= sessionCapacity;
      await pool.query(
        `UPDATE sessions 
         SET status = CASE WHEN $1 THEN 'fully_booked' ELSE 'registration_open' END,
             updated_at = NOW()
         WHERE id = $2`,
        [isFull, enrollment.session_id]
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
    const {
      status,
      courseSlug,
      sessionId,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    // Validate and sanitize pagination parameters
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(500, Math.max(1, parseInt(limit) || 50));

    let query = `
      SELECT 
        e.id, e.course_slug, e.session_id, e.full_name, e.email, e.phone,
        e.id_card, e.address, e.gdpr_consent, e.status,
        e.created_at, e.updated_at,
        c.title as course_title,
        s.title as session_title
      FROM enrollments e
      LEFT JOIN courses c ON e.course_slug = c.slug
      LEFT JOIN sessions s ON e.session_id = s.id::text
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (courseSlug) {
      // If courseSlug is actually a course ID, join with courses table to match by ID
      query += ` AND (e.course_slug = $${paramIndex} OR c.id::text = $${paramIndex})`;
      params.push(courseSlug);
      paramIndex++;
    }

    if (sessionId) {
      query += ` AND e.session_id = $${paramIndex}`;
      params.push(sessionId);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        e.full_name ILIKE $${paramIndex} OR 
        e.email ILIKE $${paramIndex + 1} OR 
        e.phone ILIKE $${paramIndex + 2} OR
        c.title ILIKE $${paramIndex + 3} OR
        s.title ILIKE $${paramIndex + 4}
      )`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      paramIndex += 5;
    }

    query += " ORDER BY e.created_at DESC";

    // Add pagination
    const offset = (safePage - 1) * safeLimit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(safeLimit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM enrollments e
      LEFT JOIN courses c ON e.course_slug = c.slug
      LEFT JOIN sessions s ON e.session_id = s.id::text
      WHERE 1=1
    `;

    const countParams = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND e.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (courseSlug) {
      countQuery += ` AND (e.course_slug = $${countParamIndex} OR c.id::text = $${countParamIndex})`;
      countParams.push(courseSlug);
      countParamIndex++;
    }

    if (sessionId) {
      countQuery += ` AND e.session_id = $${countParamIndex}`;
      countParams.push(sessionId);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (
        e.full_name ILIKE $${countParamIndex} OR 
        e.email ILIKE $${countParamIndex + 1} OR 
        e.phone ILIKE $${countParamIndex + 2} OR
        c.title ILIKE $${countParamIndex + 3} OR
        s.title ILIKE $${countParamIndex + 4}
      )`;
      countParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
      countParamIndex += 5;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      enrollments: result.rows,
      count: result.rows.length,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error("Get enrollments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update enrollment
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, id_card, address } = req.body;

    // Validate required fields
    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        error: "Full name and email are required",
      });
    }

    // Validate ID card (exactly 10 characters)
    if (id_card && id_card.length !== 10) {
      return res.status(400).json({
        success: false,
        error: "ID card number must be exactly 10 characters",
      });
    }

    // Validate phone number format (basic validation for Albanian format)
    if (phone && !/^\+355\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be in format +355xxxxxxxxx (Albanian format)",
      });
    }

    // Check if enrollment exists
    const checkQuery = "SELECT * FROM enrollments WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Enrollment not found",
      });
    }

    // Update enrollment
    const updateQuery = `
      UPDATE enrollments 
      SET 
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        id_card = COALESCE($4, id_card),
        address = COALESCE($5, address),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      full_name,
      email,
      phone || null,
      id_card || null,
      address || null,
      id,
    ]);

    res.json({
      success: true,
      message: "Enrollment updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating enrollment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update enrollment",
      message: error.message,
    });
  }
});

// Delete enrollment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get enrollment details before deletion
    const enrollmentQuery = `
      SELECT e.*, s.id as session_id, s.enrolled_count
      FROM enrollments e
      LEFT JOIN sessions s ON e.session_id = s.id::text
      WHERE e.id = $1
    `;
    const enrollmentResult = await pool.query(enrollmentQuery, [id]);

    if (enrollmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Enrollment not found",
      });
    }

    const enrollment = enrollmentResult.rows[0];

    // Delete enrollment
    await pool.query("DELETE FROM enrollments WHERE id = $1", [id]);

    // Update session status if the deleted enrollment was registered/payment_confirmed
    if (
      enrollment.session_id &&
      enrollment.status &&
      ["registered", "payment_confirmed"].includes(enrollment.status)
    ) {
      // Get current registered count for this session after deletion
      const registeredCountQuery = await pool.query(
        `SELECT COUNT(*) as registered_count 
         FROM enrollments 
         WHERE session_id = $1 AND status IN ('registered', 'payment_confirmed')`,
        [enrollment.session_id]
      );
      const registeredCount = parseInt(
        registeredCountQuery.rows[0].registered_count
      );

      // Get session capacity
      const sessionQuery = await pool.query(
        `SELECT capacity FROM sessions WHERE id = $1`,
        [enrollment.session_id]
      );
      const sessionCapacity = sessionQuery.rows[0]?.capacity || 0;

      // Update session status based on new registered count
      const isFull = registeredCount >= sessionCapacity;
      await pool.query(
        `UPDATE sessions 
         SET status = CASE WHEN $1 THEN 'fully_booked' ELSE 'registration_open' END,
             updated_at = NOW()
         WHERE id = $2`,
        [isFull, enrollment.session_id]
      );
    }

    res.json({
      success: true,
      message: "Enrollment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete enrollment",
      message: error.message,
    });
  }
});

export default router;
