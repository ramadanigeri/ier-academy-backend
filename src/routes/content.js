import express from "express";
import pool from "../database/connection.js";

const router = express.Router();

// =============================================
// EVENTS API ROUTES
// =============================================

// Get all events
router.get("/events", async (req, res) => {
  try {
    const {
      published_only = false,
      featured_only = false,
      upcoming_only = false,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate and sanitize pagination parameters
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    let query = `
      SELECT e.*, v.name as venue_name, v.address as venue_address
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (published_only === "true") {
      query += ` AND e.is_published = true`;
    }

    if (featured_only === "true") {
      query += ` AND e.is_featured = true`;
    }

    if (upcoming_only === "true") {
      query += ` AND e.event_date > NOW()`;
    }

    if (search) {
      paramCount++;
      query += ` AND (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, "SELECT COUNT(*) FROM");
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Add pagination and ordering
    query += ` ORDER BY e.sort_order ASC, e.event_date ASC`;

    const offset = (safePage - 1) * safeLimit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(safeLimit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: totalCount,
        pages: Math.ceil(totalCount / safeLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch events",
    });
  }
});

// Get event by slug
router.get("/events/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT e.*, v.name as venue_name, v.address as venue_address, v.city as venue_city
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE e.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch event",
    });
  }
});

// Create new event
router.post("/events", async (req, res) => {
  try {
    const {
      slug,
      title,
      description,
      short_description,
      event_date,
      event_end_date,
      location,
      venue_id,
      capacity = 0,
      registered_count = 0,
      price,
      currency = "EUR",
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
      `INSERT INTO events 
       (slug, title, description, short_description, event_date, event_end_date, location, venue_id, capacity, registered_count, price, currency, thumbnail_url, gallery_urls, is_published, is_featured, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        slug,
        title,
        description,
        short_description,
        event_date,
        event_end_date,
        location,
        venue_id,
        capacity,
        registered_count,
        price,
        currency,
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
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("Error creating event:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Event with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create event",
      });
    }
  }
});

// Update event
router.put("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug,
      title,
      description,
      short_description,
      event_date,
      event_end_date,
      location,
      venue_id,
      capacity,
      registered_count,
      price,
      currency,
      thumbnail_url,
      gallery_urls,
      is_published,
      is_featured,
      sort_order,
    } = req.body;

    const result = await pool.query(
      `UPDATE events 
       SET slug = $1, title = $2, description = $3, short_description = $4, event_date = $5, event_end_date = $6,
           location = $7, venue_id = $8, capacity = $9, registered_count = $10, price = $11, currency = $12,
           thumbnail_url = $13, gallery_urls = $14, is_published = $15, is_featured = $16, sort_order = $17, updated_at = NOW()
       WHERE id = $18
       RETURNING *`,
      [
        slug,
        title,
        description,
        short_description,
        event_date,
        event_end_date,
        location,
        venue_id,
        capacity,
        registered_count,
        price,
        currency,
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
        error: "Event not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error updating event:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Event with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to update event",
      });
    }
  }
});

// Delete event
router.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM events WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete event",
    });
  }
});

// =============================================
// BLOG POSTS API ROUTES
// =============================================

// Get all blog posts
router.get("/blog", async (req, res) => {
  try {
    const {
      published_only = false,
      featured_only = false,
      author_id,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let query = `
      SELECT bp.*, s.name as author_name, s.position as author_position
      FROM blog_posts bp
      LEFT JOIN staff s ON bp.author_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (published_only === "true") {
      query += ` AND bp.is_published = true`;
    }

    if (featured_only === "true") {
      query += ` AND bp.is_featured = true`;
    }

    if (author_id) {
      paramCount++;
      query += ` AND bp.author_id = $${paramCount}`;
      params.push(author_id);
    }

    if (search) {
      paramCount++;
      query += ` AND (bp.title ILIKE $${paramCount} OR bp.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, "SELECT COUNT(*) FROM");
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Add pagination and ordering
    query += ` ORDER BY bp.published_at DESC, bp.created_at DESC`;

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
    console.error("Error fetching blog posts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blog posts",
    });
  }
});

// Get blog post by slug
router.get("/blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT bp.*, s.name as author_name, s.position as author_position, s.photo_url as author_photo
       FROM blog_posts bp
       LEFT JOIN staff s ON bp.author_id = s.id
       WHERE bp.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blog post",
    });
  }
});

// Create new blog post
router.post("/blog", async (req, res) => {
  try {
    const {
      slug,
      title,
      excerpt,
      content,
      author_id,
      featured_image_url,
      tags = [],
      is_published = false,
      is_featured = false,
      published_at,
    } = req.body;

    // Validate required fields
    if (!slug || !title || !content) {
      return res.status(400).json({
        success: false,
        error: "Slug, title, and content are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO blog_posts 
       (slug, title, excerpt, content, author_id, featured_image_url, tags, is_published, is_featured, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        slug,
        title,
        excerpt,
        content,
        author_id,
        featured_image_url,
        tags,
        is_published,
        is_featured,
        published_at,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Blog post created successfully",
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Blog post with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create blog post",
      });
    }
  }
});

// Update blog post
router.put("/blog/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug,
      title,
      excerpt,
      content,
      author_id,
      featured_image_url,
      tags,
      is_published,
      is_featured,
      published_at,
    } = req.body;

    const result = await pool.query(
      `UPDATE blog_posts 
       SET slug = $1, title = $2, excerpt = $3, content = $4, author_id = $5, featured_image_url = $6,
           tags = $7, is_published = $8, is_featured = $9, published_at = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        slug,
        title,
        excerpt,
        content,
        author_id,
        featured_image_url,
        tags,
        is_published,
        is_featured,
        published_at,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Blog post updated successfully",
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Blog post with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to update blog post",
      });
    }
  }
});

// Delete blog post
router.delete("/blog/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM blog_posts WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    res.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete blog post",
    });
  }
});

export default router;
