import express from "express";
import pool from "../database/connection.js";

const router = express.Router();

// =============================================
// COURSES API ROUTES
// =============================================

// Get all courses
router.get("/courses", async (req, res) => {
  try {
    const {
      published_only = false,
      featured_only = false,
      instructor_id,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let query = `
      SELECT c.*, i.name as instructor_name, i.title as instructor_title
      FROM courses c
      LEFT JOIN instructors i ON c.instructor_id = i.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (published_only === "true") {
      query += ` AND c.is_published = true`;
    }

    if (featured_only === "true") {
      query += ` AND c.is_featured = true`;
    }

    if (instructor_id) {
      paramCount++;
      query += ` AND c.instructor_id = $${paramCount}`;
      params.push(instructor_id);
    }

    if (search) {
      paramCount++;
      query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, "SELECT COUNT(*) FROM");
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Add pagination and ordering
    query += ` ORDER BY c.sort_order ASC, c.created_at DESC`;

    const offset = (page - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses",
    });
  }
});

// Get course by ID (for admin/CMS)
router.get("/courses/id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, i.name as instructor_name, i.title as instructor_title, i.bio as instructor_bio, i.photo_url as instructor_photo
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch course",
    });
  }
});

// Get course by slug
router.get("/courses/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT c.*, i.name as instructor_name, i.title as instructor_title, i.bio as instructor_bio, i.photo_url as instructor_photo
       FROM courses c
       LEFT JOIN instructors i ON c.instructor_id = i.id
       WHERE c.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch course",
    });
  }
});

// Create new course
router.post("/courses", async (req, res) => {
  try {
    const {
      slug,
      title,
      description,
      short_description,
      price,
      currency = "EUR",
      duration,
      level,
      instructor_id,
      thumbnail_url,
      gallery_urls = [],
      is_published = false,
      is_featured = false,
      sort_order = 0,
    } = req.body;

    // Validate required fields
    if (!slug || !title) {
      return res.status(400).json({
        success: false,
        error: "Slug and title are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO courses 
       (slug, title, description, short_description, price, currency, duration, level, instructor_id, thumbnail_url, gallery_urls, is_published, is_featured, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        slug,
        title,
        description,
        short_description,
        price,
        currency,
        duration,
        level,
        instructor_id,
        thumbnail_url,
        gallery_urls,
        is_published,
        is_featured,
        sort_order,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Course created successfully",
    });
  } catch (error) {
    console.error("Error creating course:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Course with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create course",
      });
    }
  }
});

// Update course
router.put("/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug,
      title,
      description,
      short_description,
      price,
      currency,
      duration,
      level,
      instructor_id,
      thumbnail_url,
      gallery_urls,
      is_published,
      is_featured,
      sort_order,
    } = req.body;

    const result = await pool.query(
      `UPDATE courses 
       SET slug = $1, title = $2, description = $3, short_description = $4, price = $5, currency = $6,
           duration = $7, level = $8, instructor_id = $9, thumbnail_url = $10, gallery_urls = $11,
           is_published = $12, is_featured = $13, sort_order = $14, updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        slug,
        title,
        description,
        short_description,
        price,
        currency,
        duration,
        level,
        instructor_id,
        thumbnail_url,
        gallery_urls,
        is_published,
        is_featured,
        sort_order,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Error updating course:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Course with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to update course",
      });
    }
  }
});

// Delete course
router.delete("/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM courses WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete course",
    });
  }
});

// =============================================
// SESSIONS API ROUTES
// =============================================

// Get sessions for a course
router.get("/courses/:courseId/sessions", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { published_only = false } = req.query;

    let query = `
      SELECT s.*, c.title as course_title, v.name as venue_name, v.address as venue_address
      FROM sessions s
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN venues v ON s.venue_id = v.id
      WHERE s.course_id = $1
    `;
    const params = [courseId];

    if (published_only === "true") {
      query += " AND s.is_published = true";
    }

    query += " ORDER BY s.start_date ASC, s.created_at ASC";

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sessions",
    });
  }
});

// Get session by ID
router.get("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT s.*, c.title as course_title, c.slug as course_slug, v.name as venue_name, v.address as venue_address
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN venues v ON s.venue_id = v.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch session",
    });
  }
});

// Create new session
router.post("/sessions", async (req, res) => {
  try {
    const {
      course_id,
      title,
      description,
      start_date,
      end_date,
      mode,
      venue_id,
      capacity = 0,
      enrolled_count = 0,
      price,
      is_published = false,
    } = req.body;

    // Validate required fields
    if (!course_id || !title) {
      return res.status(400).json({
        success: false,
        error: "Course ID and title are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO sessions 
       (course_id, title, description, start_date, end_date, mode, venue_id, capacity, enrolled_count, price, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        course_id,
        title,
        description,
        start_date,
        end_date,
        mode,
        venue_id,
        capacity,
        enrolled_count,
        price,
        is_published,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Session created successfully",
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create session",
    });
  }
});

// Update session
router.put("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      start_date,
      end_date,
      mode,
      venue_id,
      capacity,
      enrolled_count,
      price,
      is_published,
    } = req.body;

    const result = await pool.query(
      `UPDATE sessions 
       SET title = $1, description = $2, start_date = $3, end_date = $4, mode = $5,
           venue_id = $6, capacity = $7, enrolled_count = $8, price = $9, is_published = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        title,
        description,
        start_date,
        end_date,
        mode,
        venue_id,
        capacity,
        enrolled_count,
        price,
        is_published,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Session updated successfully",
    });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update session",
    });
  }
});

// Delete session
router.delete("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM sessions WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    res.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete session",
    });
  }
});

// =============================================
// COURSE MODULES API ROUTES
// =============================================

// Get modules for a course
router.get("/courses/:courseId/modules", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { published_only = false } = req.query;

    let query = `
      SELECT * FROM course_modules 
      WHERE course_id = $1
    `;
    const params = [courseId];

    if (published_only === "true") {
      query += ` AND is_published = true`;
    }

    query += ` ORDER BY sort_order ASC, created_at ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch modules",
    });
  }
});

// Create new module
router.post("/courses/:courseId/modules", async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      objectives,
      outline,
      sort_order = 0,
      is_published = false,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO course_modules 
       (course_id, title, objectives, outline, sort_order, is_published)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [courseId, title, objectives, outline, sort_order, is_published]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Module created successfully",
    });
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create module",
    });
  }
});

// Update module
router.put("/modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, objectives, outline, sort_order, is_published } = req.body;

    const result = await pool.query(
      `UPDATE course_modules 
       SET title = $1, objectives = $2, outline = $3, sort_order = $4, is_published = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, objectives, outline, sort_order, is_published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Module updated successfully",
    });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update module",
    });
  }
});

// Delete module
router.delete("/modules/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM course_modules WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Module not found",
      });
    }

    res.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete module",
    });
  }
});

export default router;
