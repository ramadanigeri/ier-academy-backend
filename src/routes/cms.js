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

// =============================================
// HOMEPAGE SETTINGS API ROUTES (must come before /pages/:slug)
// =============================================

// Get homepage settings
router.get("/pages/home", async (req, res) => {
  try {
    // Get homepage settings from settings table
    const settingsQuery = `
      SELECT key, value, type 
      FROM settings 
      WHERE key LIKE 'hero_%' OR key LIKE 'why_choose_%'
    `;
    const result = await pool.query(settingsQuery);

    // Transform settings into object format
    const settingsData = {
      hero_title: "Advance Your IT Career",
      hero_subtitle: "With Industry Leading Certifications",
      hero_description:
        "Earn globally recognized certifications from industry leaders like Cisco, Microsoft, and CompTIA.",
      hero_button_text: "View Courses",
      hero_button_link: "/courses",
      why_choose_title: "Why Choose IER Academy?",
      why_choose_subtitle:
        "We provide more than just training - we deliver a complete learning experience.",
      why_choose_features: [
        {
          id: "1",
          icon: "Award",
          title: "Industry Certifications",
          description:
            "Get globally recognized certifications from Cisco, Microsoft, Linux Foundation, and more.",
          color: "from-yellow-400 to-yellow-600",
        },
        {
          id: "2",
          icon: "Users",
          title: "Expert Instructors",
          description:
            "Learn from certified professionals with real-world industry experience.",
          color: "from-blue-400 to-blue-600",
        },
        {
          id: "3",
          icon: "Zap",
          title: "Hands-on Learning",
          description:
            "Practice with real equipment and scenarios in our state-of-the-art labs.",
          color: "from-purple-400 to-purple-600",
        },
        {
          id: "4",
          icon: "BookOpen",
          title: "Flexible Schedule",
          description:
            "Choose from weekday, weekend, and evening classes to fit your lifestyle.",
          color: "from-green-400 to-green-600",
        },
        {
          id: "5",
          icon: "Trophy",
          title: "Career Support",
          description:
            "Get job placement assistance and career guidance from our dedicated team.",
          color: "from-orange-400 to-orange-600",
        },
        {
          id: "6",
          icon: "Star",
          title: "High Success Rate",
          description:
            "95% of our students pass their certification exams on the first attempt.",
          color: "from-pink-400 to-pink-600",
        },
      ],
    };

    // Override with database values if they exist
    result.rows.forEach((row) => {
      if (row.type === "json" && row.value) {
        try {
          settingsData[row.key] = JSON.parse(row.value);
        } catch (e) {
          settingsData[row.key] = row.value;
        }
      } else {
        settingsData[row.key] = row.value;
      }
    });

    res.json({
      success: true,
      data: settingsData,
    });
  } catch (error) {
    console.error("Error fetching homepage settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch homepage settings",
    });
  }
});

// Update homepage settings
router.put("/pages/home", async (req, res) => {
  try {
    const settings = req.body;

    // Store each setting in the settings table
    for (const [key, value] of Object.entries(settings)) {
      const type = typeof value === "object" ? "json" : "text";
      const valueStr =
        typeof value === "object" ? JSON.stringify(value) : value;

      await pool.query(
        `INSERT INTO settings (key, value, type, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (key) DO UPDATE
         SET value = $2, type = $3, updated_at = NOW()`,
        [key, valueStr, type, `Homepage ${key}`]
      );
    }

    res.json({
      success: true,
      message: "Homepage settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating homepage settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update homepage settings",
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
