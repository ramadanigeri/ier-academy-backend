import express from "express";
import pool from "../database/connection.js";

const router = express.Router();

// =============================================
// COURSES API ROUTES
// =============================================

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    const { published_only = false } = req.query;

    let query = "SELECT * FROM categories WHERE 1=1";

    if (published_only === "true") {
      query += " AND is_published = true";
    }

    query += " ORDER BY sort_order ASC";

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
});

// Create category
router.post("/categories", async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      sort_order = 0,
      is_published = true,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: "Name and slug are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, sort_order, is_published)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, slug, description, sort_order, is_published]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Error creating category:", error);
    if (error.code === "23505") {
      res.status(400).json({
        success: false,
        error: "Category with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create category",
      });
    }
  }
});

// Update category
router.put("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, sort_order, is_published } = req.body;

    const result = await pool.query(
      `UPDATE categories 
       SET name = $1, slug = $2, description = $3, sort_order = $4, is_published = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, slug, description, sort_order, is_published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating category:", error);
    if (error.code === "23505") {
      res.status(400).json({
        success: false,
        error: "Category with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to update category",
      });
    }
  }
});

// Delete category
router.delete("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete category",
    });
  }
});

// Get all courses
router.get("/courses", async (req, res) => {
  try {
    const {
      published_only = false,
      featured_only = false,
      category_id,
      instructor_id,
      search,
      page = 1,
      limit = 9,
    } = req.query;

    let query = `
      SELECT c.*, i.name as instructor_name, i.title as instructor_title, cat.name as category_name, cat.slug as category_slug
      FROM courses c
      LEFT JOIN instructors i ON c.instructor_id = i.id
      LEFT JOIN categories cat ON c.category_id = cat.id
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

    if (category_id) {
      paramCount++;
      query += ` AND c.category_id = $${paramCount}`;
      params.push(category_id);
    }

    if (instructor_id) {
      paramCount++;
      query += ` AND c.instructor_id = $${paramCount}`;
      params.push(instructor_id);
    }

    if (search) {
      paramCount++;
      query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount + 1} OR i.name ILIKE $${paramCount + 2})`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      paramCount += 2; // Update paramCount for the additional parameters
    }

    // Get total count - build query dynamically to match main query parameters
    let countQuery = `
      SELECT COUNT(*) 
      FROM courses c
      LEFT JOIN instructors i ON c.instructor_id = i.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE 1=1
    `;

    if (published_only === "true") {
      countQuery += ` AND c.is_published = true`;
    }

    if (featured_only === "true") {
      countQuery += ` AND c.is_featured = true`;
    }

    let countParamIndex = 1;
    if (category_id) {
      countQuery += ` AND c.category_id = $${countParamIndex}`;
      countParamIndex++;
    }

    if (instructor_id) {
      countQuery += ` AND c.instructor_id = $${countParamIndex}`;
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (c.title ILIKE $${countParamIndex} OR c.description ILIKE $${countParamIndex + 1} OR i.name ILIKE $${countParamIndex + 2})`;
    }

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
      category_id,
      thumbnail_url,
      gallery_urls = [],
      is_published = false,
      is_featured = false,
      is_eligible_for_installments = false,
      is_multi_module = true,
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
       (slug, title, description, short_description, price, currency, duration, level, instructor_id, category_id, thumbnail_url, gallery_urls, is_published, is_featured, is_eligible_for_installments, is_multi_module, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
        category_id,
        thumbnail_url,
        gallery_urls,
        is_published,
        is_featured,
        is_eligible_for_installments,
        is_multi_module,
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
      category_id,
      thumbnail_url,
      gallery_urls,
      is_published,
      is_featured,
      is_eligible_for_installments,
      is_multi_module,
      sort_order,
    } = req.body;

    const result = await pool.query(
      `UPDATE courses 
       SET slug = $1, title = $2, description = $3, short_description = $4, price = $5, currency = $6,
           duration = $7, level = $8, instructor_id = $9, category_id = $10, thumbnail_url = $11, gallery_urls = $12,
           is_published = $13, is_featured = $14, is_eligible_for_installments = $15, is_multi_module = $16, sort_order = $17, updated_at = NOW()
       WHERE id = $18
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
        category_id,
        thumbnail_url,
        gallery_urls,
        is_published,
        is_featured,
        is_eligible_for_installments,
        is_multi_module,
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
router.get("/:courseId/sessions", async (req, res) => {
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
      status = "coming_soon",
      is_published = false,
    } = req.body;

    // Validate required fields
    if (!course_id || !title) {
      return res.status(400).json({
        success: false,
        error: "Course ID and title are required",
      });
    }

    // Convert empty strings to null for date fields
    const startDate =
      start_date && start_date.trim() !== "" ? start_date : null;
    const endDate = end_date && end_date.trim() !== "" ? end_date : null;
    const venueId = venue_id || null;
    const priceValue = price || null;

    const result = await pool.query(
      `INSERT INTO sessions 
       (course_id, title, description, start_date, end_date, mode, venue_id, capacity, enrolled_count, price, status, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        course_id,
        title,
        description,
        startDate,
        endDate,
        mode,
        venueId,
        capacity,
        enrolled_count,
        priceValue,
        status,
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
      status,
      is_published,
    } = req.body;

    // Convert empty strings to null for date fields
    const startDate =
      start_date && start_date.trim() !== "" ? start_date : null;
    const endDate = end_date && end_date.trim() !== "" ? end_date : null;
    const venueId = venue_id || null;
    const priceValue = price || null;

    const result = await pool.query(
      `UPDATE sessions 
       SET title = $1, description = $2, start_date = $3, end_date = $4, mode = $5,
           venue_id = $6, capacity = $7, enrolled_count = $8, price = $9, status = $10, is_published = $11, updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        title,
        description,
        startDate,
        endDate,
        mode,
        venueId,
        capacity,
        enrolled_count,
        priceValue,
        status,
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
router.get("/:courseId/modules", async (req, res) => {
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
router.post("/:courseId/modules", async (req, res) => {
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
