import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all sections for an event
router.get("/:eventId/sections", async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query(
      `SELECT * FROM event_sections 
       WHERE event_id = $1 
       ORDER BY sort_order ASC`,
      [eventId]
    );

    // Add cache headers - sections don't change frequently
    res.set({
      "Cache-Control": "public, max-age=60, s-maxage=300", // 1 min client, 5 min CDN
    });

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching event sections:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all blocks for a section
router.get("/sections/:sectionId/blocks", async (req, res) => {
  try {
    const { sectionId } = req.params;
    const result = await pool.query(
      `SELECT * FROM event_blocks 
       WHERE section_id = $1 
       ORDER BY sort_order ASC`,
      [sectionId]
    );

    // Add cache headers - blocks don't change frequently
    res.set({
      "Cache-Control": "public, max-age=60, s-maxage=300", // 1 min client, 5 min CDN
    });

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching event blocks:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get event with all sections and blocks
router.get("/:eventId/full", async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get sections
    const sectionsResult = await pool.query(
      `SELECT * FROM event_sections 
       WHERE event_id = $1 AND is_published = true
       ORDER BY sort_order ASC`,
      [eventId]
    );

    // Get all blocks for these sections
    const sections = await Promise.all(
      sectionsResult.rows.map(async (section) => {
        const blocksResult = await pool.query(
          `SELECT * FROM event_blocks 
           WHERE section_id = $1 AND is_published = true
           ORDER BY sort_order ASC`,
          [section.id]
        );
        return {
          ...section,
          blocks: blocksResult.rows,
        };
      })
    );

    // Add cache headers - full event data with sections and blocks
    // This is the optimized endpoint used by frontend
    res.set({
      "Cache-Control": "public, max-age=60, s-maxage=300", // 1 min client, 5 min CDN
      Vary: "Accept-Encoding", // Cache different versions for different encodings
    });

    res.json({ success: true, data: sections });
  } catch (error) {
    console.error("Error fetching event full data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new section
router.post("/:eventId/sections", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, sort_order = 0, is_published = true } = req.body;

    const result = await pool.query(
      `INSERT INTO event_sections (event_id, title, sort_order, is_published)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [eventId, title, sort_order, is_published]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error creating event section:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a section
router.put("/sections/:sectionId", async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title, sort_order, is_published } = req.body;

    const result = await pool.query(
      `UPDATE event_sections 
       SET title = COALESCE($1, title),
           sort_order = COALESCE($2, sort_order),
           is_published = COALESCE($3, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [title, sort_order, is_published, sectionId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error updating event section:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a section
router.delete("/sections/:sectionId", async (req, res) => {
  try {
    const { sectionId } = req.params;
    await pool.query("DELETE FROM event_sections WHERE id = $1", [sectionId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting event section:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new block
router.post("/sections/:sectionId/blocks", async (req, res) => {
  try {
    const { sectionId } = req.params;
    const {
      block_type,
      position = "middle",
      content,
      sort_order = 0,
      is_published = true,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO event_blocks (section_id, block_type, position, content, sort_order, is_published)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        sectionId,
        block_type,
        position,
        JSON.stringify(content),
        sort_order,
        is_published,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error creating event block:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a block
router.put("/blocks/:blockId", async (req, res) => {
  try {
    const { blockId } = req.params;
    const { block_type, position, content, sort_order, is_published } =
      req.body;

    const result = await pool.query(
      `UPDATE event_blocks 
       SET block_type = COALESCE($1, block_type),
           position = COALESCE($2, position),
           content = COALESCE($3, content),
           sort_order = COALESCE($4, sort_order),
           is_published = COALESCE($5, is_published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        block_type,
        position,
        content ? JSON.stringify(content) : null,
        sort_order,
        is_published,
        blockId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error updating event block:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a block
router.delete("/blocks/:blockId", async (req, res) => {
  try {
    const { blockId } = req.params;
    await pool.query("DELETE FROM event_blocks WHERE id = $1", [blockId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting event block:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
