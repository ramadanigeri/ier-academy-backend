import express from "express";
import pool from "../database/connection.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Simple admin credentials - In production, use proper authentication
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
};

const JWT_SECRET = process.env.JWT_SECRET;

// Admin login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    // Check credentials
    if (
      username !== ADMIN_CREDENTIALS.username ||
      password !== ADMIN_CREDENTIALS.password
    ) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        username,
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return success response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        username,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Admin logout endpoint
router.post("/logout", async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Simple admin dashboard with working buttons
router.get("/dashboard", async (req, res) => {
  try {
    // Get query parameters for filtering
    const { status, course, search, dateFrom, dateTo } = req.query;

    // Build dynamic query with filters
    let query = `
      SELECT 
        e.*,
        p.status as payment_status,
        p.payment_date,
        p.verified_by
      FROM enrollments e 
      LEFT JOIN payments p ON e.id = p.enrollment_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Add filters
    if (status && status !== "all") {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (course && course !== "all") {
      query += ` AND e.course_slug = $${paramIndex}`;
      params.push(course);
      paramIndex++;
    }

    if (search && search.trim().length > 0) {
      query += ` AND (e.full_name ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex} OR e.id_card ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND e.created_at >= $${paramIndex}::date`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND e.created_at < ($${paramIndex}::date + INTERVAL '1 day')`;
      params.push(dateTo);
      paramIndex++;
    }

    query += " ORDER BY e.created_at DESC";

    const result = await pool.query(query, params);
    const enrollments = result.rows;

    // Get unique courses for filter dropdown
    const coursesResult = await pool.query(
      "SELECT DISTINCT course_slug FROM enrollments ORDER BY course_slug"
    );
    const courses = coursesResult.rows;

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IER Academy - Admin Dashboard</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: #f5f5f5;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            background: #2563eb; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            margin: -20px -20px 20px -20px;
            border-radius: 8px 8px 0 0;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
        }
        th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
        }
        th { 
            background: #f8f9fa; 
            font-weight: bold;
        }
        .status-badge { 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 12px; 
            font-weight: bold;
        }
        .status-enrolled { background: #fff3cd; color: #856404; }
        .status-paid { background: #ffeaa7; color: #6c5ce7; }
        .status-registered { background: #d4edda; color: #155724; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        .btn { 
            padding: 6px 12px; 
            margin: 2px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 12px;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: black; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-info { background: #17a2b8; color: white; }
        .btn:hover { opacity: 0.8; }
        .actions { white-space: nowrap; }
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 IER Academy Admin Dashboard</h1>
            <p>Student Enrollment Management</p>
        </div>
        
        <div class="controls" style="background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
            <form method="GET" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; align-items: end;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Status Filter:</label>
                    <select name="status" onchange="this.form.submit()" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="all" ${status === "all" || !status ? "selected" : ""}>All Statuses</option>
                        <option value="enrolled" ${status === "enrolled" ? "selected" : ""}>📝 Enrolled (Pending Payment)</option>
                        <option value="paid" ${status === "paid" ? "selected" : ""}>💰 Paid</option>
                        <option value="registered" ${status === "registered" ? "selected" : ""}>✅ Registered</option>
                        <option value="cancelled" ${status === "cancelled" ? "selected" : ""}>❌ Cancelled</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Course Filter:</label>
                    <select name="course" onchange="this.form.submit()" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="all" ${course === "all" || !course ? "selected" : ""}>All Courses</option>
                        ${courses
                          .map(
                            (c) => `
                            <option value="${c.course_slug}" ${course === c.course_slug ? "selected" : ""}>
                                ${c.course_slug.toUpperCase()}
                            </option>
                        `
                          )
                          .join("")}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Search Name/Email:</label>
                    <input type="text" name="search" placeholder="Student name or email..." value="${search || ""}" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Date From:</label>
                    <input type="date" name="dateFrom" value="${dateFrom || ""}" onchange="this.form.submit()" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Date To:</label>
                    <input type="date" name="dateTo" value="${dateTo || ""}" onchange="this.form.submit()" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button type="submit" class="btn btn-primary">🔍 Search</button>
                    <a href="/api/admin/dashboard" class="btn btn-secondary" style="text-decoration: none; display: inline-block;">🔄 Clear</a>
                </div>
            </form>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${enrollments.filter((e) => e.status === "enrolled").length}</div>
                <div>📝 Enrolled (Pending Payment)</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${enrollments.filter((e) => e.status === "paid").length}</div>
                <div>💰 Paid</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${enrollments.filter((e) => e.status === "registered").length}</div>
                <div>✅ Registered</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${enrollments.filter((e) => e.status === "cancelled").length}</div>
                <div>❌ Cancelled</div>
            </div>
        </div>

        ${
          enrollments.length > 0
            ? `
        <table>
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${enrollments
                  .map(
                    (enrollment) => `
                    <tr>
                        <td>
                            <span class="status-badge status-${enrollment.status}">
                                ${enrollment.status.replace("_", " ").toUpperCase()}
                            </span>
                        </td>
                        <td>
                            <strong>${enrollment.full_name}</strong><br>
                            <small>ID: ${enrollment.id_card || "N/A"}</small>
                        </td>
                        <td>
                            <strong>${enrollment.course_slug.toUpperCase()}</strong><br>
                            <small>${enrollment.session_id}</small>
                        </td>
                        <td>
                            <a href="mailto:${enrollment.email}">${enrollment.email}</a><br>
                            <small>${enrollment.phone}</small>
                        </td>
                        <td>
                            ${new Date(enrollment.created_at).toLocaleDateString("en-GB")}<br>
                            <small>${new Date(enrollment.created_at).toLocaleTimeString()}</small>
                        </td>
                        <td>
                            ${
                              enrollment.payment_status
                                ? `
                                <strong>${enrollment.payment_status}</strong><br>
                                <small>${enrollment.payment_date ? new Date(enrollment.payment_date).toLocaleDateString("en-GB") : ""}</small>
                            `
                                : '<span style="color: #999;">No payment</span>'
                            }
                        </td>
                        <td class="actions">
                             ${
                               enrollment.status === "enrolled"
                                 ? `
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=paid" class="btn btn-warning" onclick="return confirmAction('Mark as Paid')">💰 Mark as Paid</a>
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=cancelled" class="btn btn-danger" onclick="return confirmAction('Cancel Enrollment')">❌ Cancel</a>
                             `
                                 : enrollment.status === "paid"
                                   ? `
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=registered" class="btn btn-success" onclick="return confirmAction('Register to Course')">✅ Register to Course</a>
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=enrolled" class="btn btn-info" onclick="return confirmAction('Back to Enrolled')">⬅️ Back to Enrolled</a>
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=cancelled" class="btn btn-danger" onclick="return confirmAction('Cancel Enrollment')">❌ Cancel</a>
                             `
                                   : enrollment.status === "registered"
                                     ? `
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=paid" class="btn btn-warning" onclick="return confirmAction('Back to Paid')">⬅️ Back to Paid</a>
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=cancelled" class="btn btn-danger" onclick="return confirmAction('Cancel Enrollment')">❌ Cancel</a>
                             `
                                     : enrollment.status === "cancelled"
                                       ? `
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=enrolled" class="btn btn-info" onclick="return confirmAction('Restore to Enrolled')">🔄 Restore to Enrolled</a>
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=paid" class="btn btn-warning" onclick="return confirmAction('Mark as Paid')">💰 Mark as Paid</a>
                                 <a href="/api/admin/enrollment/${enrollment.id}/status?action=registered" class="btn btn-success" onclick="return confirmAction('Register to Course')">✅ Register to Course</a>
                             `
                                       : ""
                             }
                         </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
        `
            : `
        <div style="text-align: center; padding: 40px; color: #666;">
            <h3>📋 No enrollments found</h3>
            <p>No student enrollments to display</p>
        </div>
        `
        }
    </div>

    <script>
        function confirmAction(action) {
            return confirm('Are you sure you want to: ' + action + '?');
        }
        
        // Admin dashboard initialized
    </script>
</body>
</html>
    `);
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Handle status updates via PUT requests (from frontend API calls)
router.put("/enrollment/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, updatedBy } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Update enrollment status
    await pool.query("UPDATE enrollments SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);

    // Handle payment record updates based on new workflow
    if (status === "payment_confirmed") {
      // Check if payment record exists
      const existingPayment = await pool.query(
        "SELECT id FROM payments WHERE enrollment_id = $1",
        [id]
      );

      if (existingPayment.rows.length > 0) {
        // Update existing payment
        await pool.query(
          "UPDATE payments SET status = 'verified', verified_by = $1, payment_date = NOW() WHERE enrollment_id = $2",
          [updatedBy || "admin", id]
        );
      } else {
        // Insert new payment record
        await pool.query(
          "INSERT INTO payments (enrollment_id, status, verified_by, payment_date) VALUES ($1, 'verified', $2, NOW())",
          [id, updatedBy || "admin"]
        );
      }
    } else if (status === "enrolled") {
      // Update payment status to verified (final status) and reduce course spots
      await pool.query(
        "UPDATE payments SET status = 'verified' WHERE enrollment_id = $1",
        [id]
      );

      // Reduce available spots in course by 1 when student is registered
    }

    res.json({
      success: true,
      message: "Enrollment status updated successfully",
      enrollmentId: id,
      status: status,
      updatedBy: updatedBy || "admin",
    });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Handle status updates via GET requests (from the simple buttons)
router.get("/enrollment/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.query;

    if (!action) {
      return res.status(400).json({ error: "Action parameter is required" });
    }

    // Update enrollment status
    await pool.query("UPDATE enrollments SET status = $1 WHERE id = $2", [
      action,
      id,
    ]);

    // Handle payment record updates based on new workflow
    if (action === "paid") {
      // Check if payment record exists
      const existingPayment = await pool.query(
        "SELECT id FROM payments WHERE enrollment_id = $1",
        [id]
      );

      if (existingPayment.rows.length > 0) {
        // Update existing payment
        await pool.query(
          "UPDATE payments SET status = 'verified', verified_by = 'admin@ieracademy.com', payment_date = NOW() WHERE enrollment_id = $1",
          [id]
        );
      } else {
        // Insert new payment record
        await pool.query(
          "INSERT INTO payments (enrollment_id, status, verified_by, payment_date) VALUES ($1, 'verified', 'admin@ieracademy.com', NOW())",
          [id]
        );
      }
    } else if (action === "registered") {
      // Update payment status to verified (final status) and reduce course spots
      await pool.query(
        "UPDATE payments SET status = 'verified' WHERE enrollment_id = $1",
        [id]
      );

      // Reduce available spots in course by 1 when student is registered
    }

    // Redirect back to dashboard
    res.redirect("/api/admin/dashboard");
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;
