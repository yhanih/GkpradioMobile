import { Express } from "express";
import { strictLimiter, submissionGuards } from "./security";

export function setupSpamTestRoutes(app: Express) {
  // Development route for testing spam protection (CAPTCHA removed)
  app.post("/dev/spam-check", strictLimiter, submissionGuards, (req, res) => {
    res.json({
      ok: true,
      message: "All spam protection checks passed!",
      timestamp: new Date().toISOString(),
      ip: req.ip,
      body: req.body
    });
  });

  // Test route without protection for comparison
  app.post("/dev/no-protection", (req, res) => {
    res.json({
      ok: true,
      message: "No protection - request accepted",
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
  });

  console.log("📋 Spam protection test routes available:");
  console.log("  POST /dev/spam-check - Full protection");
  console.log("  POST /dev/no-protection - No protection");
}