import express from "express";
import pool from "../database/connection.js";

const router = express.Router();

// =============================================
// STAFF API ROUTES
// =============================================

// Get all staff
router.get("/staff", async (req, res) => {
  try {
    const { published_only = false, department } = req.query;

    let query = "SELECT * FROM staff WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (published_only === "true") {
      query += ` AND is_published = true`;
    }

    if (department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(department);
    }

    query += " ORDER BY sort_order ASC, name ASC";

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch staff",
    });
  }
});

// Get staff by ID
router.get("/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM staff WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching staff member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch staff member",
    });
  }
});

// Create new staff member
router.post("/staff", async (req, res) => {
  try {
    const {
      name,
      position,
      bio,
      photo_url,
      email,
      phone,
      department,
      is_published = false,
      sort_order = 0,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO staff 
       (name, position, bio, photo_url, email, phone, department, is_published, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        position,
        bio,
        photo_url,
        email,
        phone,
        department,
        is_published,
        sort_order,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Staff member created successfully",
    });
  } catch (error) {
    console.error("Error creating staff member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create staff member",
    });
  }
});

// Update staff member
router.put("/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      position,
      bio,
      photo_url,
      email,
      phone,
      department,
      is_published,
      sort_order,
    } = req.body;

    const result = await pool.query(
      `UPDATE staff 
       SET name = $1, position = $2, bio = $3, photo_url = $4, email = $5, phone = $6,
           department = $7, is_published = $8, sort_order = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        name,
        position,
        bio,
        photo_url,
        email,
        phone,
        department,
        is_published,
        sort_order,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Staff member updated successfully",
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update staff member",
    });
  }
});

// Delete staff member
router.delete("/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM staff WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    res.json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete staff member",
    });
  }
});

// =============================================
// INSTRUCTORS API ROUTES
// =============================================

// Get all instructors
router.get("/instructors", async (req, res) => {
  try {
    const { published_only = false } = req.query;

    let query = "SELECT * FROM instructors WHERE 1=1";

    if (published_only === "true") {
      query += ` AND is_published = true`;
    }

    query += " ORDER BY sort_order ASC, name ASC";

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch instructors",
    });
  }
});

// Get instructor by ID
router.get("/instructors/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM instructors WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Instructor not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching instructor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch instructor",
    });
  }
});

// Create new instructor
router.post("/instructors", async (req, res) => {
  try {
    const {
      name,
      title,
      bio,
      photo_url,
      email,
      phone,
      linkedin_url,
      twitter_url,
      specialties = [],
      is_published = false,
      sort_order = 0,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO instructors 
       (name, title, bio, photo_url, email, phone, linkedin_url, twitter_url, specialties, is_published, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        name,
        title,
        bio,
        photo_url,
        email,
        phone,
        linkedin_url,
        twitter_url,
        specialties,
        is_published,
        sort_order,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Instructor created successfully",
    });
  } catch (error) {
    console.error("Error creating instructor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create instructor",
    });
  }
});

// Update instructor
router.put("/instructors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      title,
      bio,
      photo_url,
      email,
      phone,
      linkedin_url,
      twitter_url,
      specialties,
      is_published,
      sort_order,
    } = req.body;

    const result = await pool.query(
      `UPDATE instructors 
       SET name = $1, title = $2, bio = $3, photo_url = $4, email = $5, phone = $6,
           linkedin_url = $7, twitter_url = $8, specialties = $9, is_published = $10, sort_order = $11, updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        name,
        title,
        bio,
        photo_url,
        email,
        phone,
        linkedin_url,
        twitter_url,
        specialties,
        is_published,
        sort_order,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Instructor not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Instructor updated successfully",
    });
  } catch (error) {
    console.error("Error updating instructor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update instructor",
    });
  }
});

// Get courses assigned to an instructor
router.get("/instructors/:id/courses", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.id, c.title, c.slug, c.description 
       FROM courses c 
       WHERE c.instructor_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch instructor courses",
    });
  }
});

// Delete instructor with options
router.delete("/instructors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reassignTo, removeAssignments } = req.body;

    // First, get the instructor to verify it exists
    const instructorResult = await pool.query(
      "SELECT * FROM instructors WHERE id = $1",
      [id]
    );

    if (instructorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Instructor not found",
      });
    }

    // Check if instructor is assigned to any courses
    const coursesResult = await pool.query(
      "SELECT id, title FROM courses WHERE instructor_id = $1",
      [id]
    );

    if (coursesResult.rows.length > 0) {
      // If reassignTo is provided, reassign courses to another instructor
      if (reassignTo) {
        await pool.query(
          "UPDATE courses SET instructor_id = $1 WHERE instructor_id = $2",
          [reassignTo, id]
        );
      } 
      // If removeAssignments is true, set instructor_id to NULL
      else if (removeAssignments) {
        await pool.query(
          "UPDATE courses SET instructor_id = NULL WHERE instructor_id = $1",
          [id]
        );
      } 
      // Otherwise, return conflict with course information
      else {
        return res.status(409).json({
          success: false,
          error: "Cannot delete instructor. This instructor is assigned to one or more courses.",
          affectedCourses: coursesResult.rows,
        });
      }
    }

    // Now delete the instructor
    const deleteResult = await pool.query(
      "DELETE FROM instructors WHERE id = $1 RETURNING *",
      [id]
    );

    res.json({
      success: true,
      message: "Instructor deleted successfully",
      affectedCourses: coursesResult.rows,
      action: reassignTo ? 'reassigned' : removeAssignments ? 'removed_assignments' : 'none'
    });
  } catch (error) {
    console.error("Error deleting instructor:", error);

    // Check for foreign key constraint violation
    if (
      error.code === "23503" &&
      error.constraint === "courses_instructor_id_fkey"
    ) {
      return res.status(409).json({
        success: false,
        error:
          "Cannot delete instructor. This instructor is assigned to one or more courses. Please reassign or remove the courses first.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to delete instructor",
    });
  }
});

// =============================================
// VENUES API ROUTES
// =============================================

// Get all venues
router.get("/venues", async (req, res) => {
  try {
    const { published_only = false } = req.query;

    let query = "SELECT * FROM venues WHERE 1=1";

    if (published_only === "true") {
      query += ` AND is_published = true`;
    }

    query += " ORDER BY name ASC";

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

// Get venue by ID
router.get("/venues/:id", async (req, res) => {
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

// Create new venue
router.post("/venues", async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      country,
      capacity,
      facilities = [],
      photos_urls = [],
      is_published = false,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO venues 
       (name, address, city, country, capacity, facilities, photos_urls, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        address,
        city,
        country,
        capacity,
        facilities,
        photos_urls,
        is_published,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Venue created successfully",
    });
  } catch (error) {
    console.error("Error creating venue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create venue",
    });
  }
});

// Update venue
router.put("/venues/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      country,
      capacity,
      facilities,
      photos_urls,
      is_published,
    } = req.body;

    const result = await pool.query(
      `UPDATE venues 
       SET name = $1, address = $2, city = $3, country = $4, capacity = $5,
           facilities = $6, photos_urls = $7, is_published = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        name,
        address,
        city,
        country,
        capacity,
        facilities,
        photos_urls,
        is_published,
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
router.delete("/venues/:id", async (req, res) => {
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

// =============================================
// FAQS API ROUTES
// =============================================

// Get all FAQs
router.get("/faqs", async (req, res) => {
  try {
    const { published_only = false, category } = req.query;

    let query = "SELECT * FROM faqs WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (published_only === "true") {
      query += ` AND is_published = true`;
    }

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    query += " ORDER BY sort_order ASC, created_at ASC";

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch FAQs",
    });
  }
});

// Create new FAQ
router.post("/faqs", async (req, res) => {
  try {
    const {
      question,
      answer,
      category,
      is_published = false,
      sort_order = 0,
    } = req.body;

    // Validate required fields
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        error: "Question and answer are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO faqs 
       (question, answer, category, is_published, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [question, answer, category, is_published, sort_order]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "FAQ created successfully",
    });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create FAQ",
    });
  }
});

// Update FAQ
router.put("/faqs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, is_published, sort_order } = req.body;

    const result = await pool.query(
      `UPDATE faqs 
       SET question = $1, answer = $2, category = $3, is_published = $4, sort_order = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [question, answer, category, is_published, sort_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "FAQ not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "FAQ updated successfully",
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update FAQ",
    });
  }
});

// Delete FAQ
router.delete("/faqs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM faqs WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "FAQ not found",
      });
    }

    res.json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete FAQ",
    });
  }
});

// =============================================
// PARTNERS API ROUTES
// =============================================

// Get all partners
router.get("/partners", async (req, res) => {
  try {
    const { published_only = false } = req.query;

    let query = "SELECT * FROM partners WHERE 1=1";

    if (published_only === "true") {
      query += ` AND is_published = true`;
    }

    query += " ORDER BY sort_order ASC, name ASC";

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch partners",
    });
  }
});

// Create new partner
router.post("/partners", async (req, res) => {
  try {
    const {
      name,
      logo_url,
      website_url,
      description,
      is_published = false,
      sort_order = 0,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const result = await pool.query(
      `INSERT INTO partners 
       (name, logo_url, website_url, description, is_published, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, logo_url, website_url, description, is_published, sort_order]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Partner created successfully",
    });
  } catch (error) {
    console.error("Error creating partner:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create partner",
    });
  }
});

// Update partner
router.put("/partners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      logo_url,
      website_url,
      description,
      is_published,
      sort_order,
    } = req.body;

    const result = await pool.query(
      `UPDATE partners 
       SET name = $1, logo_url = $2, website_url = $3, description = $4, is_published = $5, sort_order = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, logo_url, website_url, description, is_published, sort_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Partner not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Partner updated successfully",
    });
  } catch (error) {
    console.error("Error updating partner:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update partner",
    });
  }
});

// Delete partner
router.delete("/partners/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM partners WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Partner not found",
      });
    }

    res.json({
      success: true,
      message: "Partner deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting partner:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete partner",
    });
  }
});

export default router;
