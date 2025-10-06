import express from "express";

const router = express.Router();

// Health check endpoint for webhooks
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Webhook service is running",
    timestamp: new Date().toISOString(),
  });
});

// Placeholder for future webhook integrations
router.post("/generic", (req, res) => {
  console.log("Generic webhook received:", req.body);
  res.json({ received: true });
});

export default router;
