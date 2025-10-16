import express from "express";
import pool from "../database/connection.js";

const router = express.Router();

// =============================================
// PAGES API ROUTES
// =============================================

// Get all pages
router.get("/pages", async (req, res) => {
  try {
    const { published_only = false } = req.query;

    let query = "SELECT * FROM pages";
    const params = [];

    if (published_only === "true") {
      query += " WHERE is_published = true";
    }

    query += " ORDER BY sort_order ASC, created_at DESC";

    const result = await pool.query(query, params);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pages",
    });
  }
});

// Get page by slug
router.get("/pages/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query("SELECT * FROM pages WHERE slug = $1", [
      slug,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Page not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch page",
    });
  }
});

// Create new page
router.post("/pages", async (req, res) => {
  try {
    const {
      slug,
      title,
      meta_title,
      meta_description,
      is_published = false,
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
      `INSERT INTO pages (slug, title, meta_title, meta_description, is_published, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [slug, title, meta_title, meta_description, is_published, sort_order]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Page created successfully",
    });
  } catch (error) {
    console.error("Error creating page:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Page with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create page",
      });
    }
  }
});

// Update page
router.put("/pages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug,
      title,
      meta_title,
      meta_description,
      is_published,
      sort_order,
    } = req.body;

    const result = await pool.query(
      `UPDATE pages 
       SET slug = $1, title = $2, meta_title = $3, meta_description = $4, 
           is_published = $5, sort_order = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [slug, title, meta_title, meta_description, is_published, sort_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Page not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Page updated successfully",
    });
  } catch (error) {
    console.error("Error updating page:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Page with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to update page",
      });
    }
  }
});

// Delete page
router.delete("/pages/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM pages WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Page not found",
      });
    }

    res.json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting page:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete page",
    });
  }
});

// =============================================
// PAGE SECTIONS API ROUTES
// =============================================

// Get sections for a page
router.get("/pages/:pageId/sections", async (req, res) => {
  try {
    const { pageId } = req.params;
    const { published_only = false } = req.query;

    let query = `
      SELECT ps.*, p.slug as page_slug, p.title as page_title
      FROM page_sections ps
      JOIN pages p ON ps.page_id = p.id
      WHERE ps.page_id = $1
    `;
    const params = [pageId];

    if (published_only === "true") {
      query += " AND ps.is_published = true";
    }

    query += " ORDER BY ps.sort_order ASC, ps.created_at ASC";

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching page sections:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch page sections",
    });
  }
});

// Get section by ID
router.get("/sections/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT ps.*, p.slug as page_slug, p.title as page_title
       FROM page_sections ps
       JOIN pages p ON ps.page_id = p.id
       WHERE ps.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Section not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching section:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch section",
    });
  }
});

// Create new section
router.post("/sections", async (req, res) => {
  try {
    const {
      page_id,
      section_type,
      title,
      subtitle,
      content,
      data,
      background_color,
      text_color,
      sort_order = 0,
      is_published = true,
    } = req.body;

    // Validate required fields
    if (!page_id || !section_type) {
      return res.status(400).json({
        success: false,
        error: "Page ID and section type are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO page_sections 
       (page_id, section_type, title, subtitle, content, data, background_color, text_color, sort_order, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        page_id,
        section_type,
        title,
        subtitle,
        content,
        data,
        background_color,
        text_color,
        sort_order,
        is_published,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Section created successfully",
    });
  } catch (error) {
    console.error("Error creating section:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create section",
    });
  }
});

// Update section
router.put("/sections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      section_type,
      title,
      subtitle,
      content,
      data,
      background_color,
      text_color,
      sort_order,
      is_published,
    } = req.body;

    const result = await pool.query(
      `UPDATE page_sections 
       SET section_type = $1, title = $2, subtitle = $3, content = $4, data = $5,
           background_color = $6, text_color = $7, sort_order = $8, is_published = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        section_type,
        title,
        subtitle,
        content,
        data,
        background_color,
        text_color,
        sort_order,
        is_published,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Section not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Section updated successfully",
    });
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update section",
    });
  }
});

// Delete section
router.delete("/sections/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM page_sections WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Section not found",
      });
    }

    res.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete section",
    });
  }
});

// =============================================
// WEBSITE SETTINGS API ROUTES
// =============================================

// Get all settings
router.get("/settings", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM settings ORDER BY key ASC");

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch settings",
    });
  }
});

// Get setting by key
router.get("/settings/:key", async (req, res) => {
  try {
    const { key } = req.params;

    const result = await pool.query("SELECT * FROM settings WHERE key = $1", [
      key,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Setting not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch setting",
    });
  }
});

// Update setting
router.put("/settings/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type, description } = req.body;

    const result = await pool.query(
      `UPDATE settings 
       SET value = $1, type = $2, description = $3, updated_at = NOW()
       WHERE key = $4
       RETURNING *`,
      [value, type, description, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Setting not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Setting updated successfully",
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update setting",
    });
  }
});

export default router;
