import express from "express";
import pool from "../database/connection.js";

const router = express.Router();

// Get all venues
router.get("/", async (req, res) => {
  try {
    const { published_only = false } = req.query;

    let query = "SELECT * FROM venues WHERE 1=1";

    if (published_only === "true") {
      query += " AND is_published = true";
    }

    query += " ORDER BY sort_order ASC, name ASC";

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch venues",
    });
  }
});

// Get venue by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      "SELECT * FROM venues WHERE slug = $1 AND is_published = true",
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Venue not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching venue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch venue",
    });
  }
});

// Get venue by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM venues WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Venue not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching venue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch venue",
    });
  }
});

// Create venue
router.post("/", async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      capacity,
      location,
      amenities = [],
      image_url,
      gallery_urls = [],
      is_published = true,
      sort_order = 0,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: "Name and slug are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO venues 
       (name, slug, description, capacity, location, amenities, image_url, gallery_urls, is_published, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        slug,
        description,
        capacity,
        location,
        amenities,
        image_url,
        gallery_urls,
        is_published,
        sort_order,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Venue created successfully",
    });
  } catch (error) {
    console.error("Error creating venue:", error);
    if (error.code === "23505") {
      res.status(400).json({
        success: false,
        error: "Venue with this slug already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create venue",
      });
    }
  }
});

// Update venue
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      capacity,
      location,
      amenities,
      image_url,
      gallery_urls,
      is_published,
      sort_order,
    } = req.body;

    const result = await pool.query(
      `UPDATE venues 
       SET name = $1, slug = $2, description = $3, capacity = $4, location = $5,
           amenities = $6, image_url = $7, gallery_urls = $8, is_published = $9,
           sort_order = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name,
        slug,
        description,
        capacity,
        location,
        amenities,
        image_url,
        gallery_urls,
        is_published,
        sort_order,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Venue not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Venue updated successfully",
    });
  } catch (error) {
    console.error("Error updating venue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update venue",
    });
  }
});

// Delete venue
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM venues WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Venue not found",
      });
    }

    res.json({
      success: true,
      message: "Venue deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting venue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete venue",
    });
  }
});

export default router;
