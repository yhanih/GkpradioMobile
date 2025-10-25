import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import crypto from "node:crypto";
import type { Request, Response, NextFunction, Application } from "express";

export function baseSecurity(app: Application) {
  app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'",
          "https://js.stripe.com",
          "https://*.stripe.com",
          "https://replit.com",
          "https:"
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "https://*.supabase.co",
          "wss://*.supabase.co",
          "wss:",
          "ws:"
        ],
        frameSrc: [
          "'self'",
          "https://js.stripe.com",
          "https://hooks.stripe.com",
          "https:",
          "http:"
        ],
      },
    },
  }));

  // Global rate limiter: Very generous limit for normal usage
  const globalLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 1000, // Very generous for normal usage
    standardHeaders: true, 
    legacyHeaders: false,
    message: { 
      ok: false, 
      reason: "rate_limit_exceeded",
      message: "Too many requests, please try again later." 
    },
    // Skip rate limiting for static assets and development
    skip: (req) => {
      return req.path.startsWith('/static/') || 
             req.path.startsWith('/assets/') || 
             req.path.includes('.css') || 
             req.path.includes('.js') ||
             req.path.includes('.ico') ||
             (process.env.NODE_ENV === 'development' && req.path.startsWith('/dev/'));
    }
  });
  app.use(globalLimiter);

  // Slow down after 3 quick hits in 10 seconds
  const speedLimiter = slowDown({ 
    windowMs: 10 * 1000, 
    delayAfter: 3, 
    delayMs: () => 500,
    maxDelayMs: 5000,
    validate: { delayMs: false }
  });
  app.use(speedLimiter);
}

// Stricter rate limiter for auth and public post routes: 10 requests per 10 minutes per IP
export const strictLimiter = rateLimit({ 
  windowMs: 10 * 60 * 1000, 
  max: 10, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: { 
    ok: false, 
    reason: "strict_rate_limit_exceeded",
    message: "Too many attempts, please wait before trying again." 
  }
});

// Enhanced rate limiter for community posts: 5 submissions per 10 minutes per user/IP
export const enhancedRateLimiter = rateLimit({ 
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 submissions per window
  standardHeaders: true, 
  legacyHeaders: false,
  // Remove custom keyGenerator to use default IP-based one
  message: { 
    ok: false, 
    reason: "enhanced_rate_limit_exceeded",
    message: "You've reached the posting limit. Please wait 10 minutes before posting again." 
  }
});

// Cache for duplicate submission detection
const recentSubmissions = new Map<string, number>();

function createSubmissionKey(req: Request, bodyHash: string): string {
  const ip = req.ip ?? "unknown";
  return `${ip}:${bodyHash}`;
}

// Cleanup old submissions periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  recentSubmissions.forEach((timestamp, key) => {
    if (now - timestamp > 90 * 1000) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => recentSubmissions.delete(key));
}, 60 * 1000); // Clean up every minute

export function submissionGuards(req: Request, res: Response, next: NextFunction) {
  const isSpamProtectionEnabled = process.env.ANTI_SPAM_ENABLED === 'true';
  
  if (!isSpamProtectionEnabled) {
    return next();
  }

  const { hp, renderAt } = req.body ?? {};
  const isAuthenticated = (req as any).user?.userId; // Check if user is logged in
  
  // Honeypot check: reject if hidden field is filled
  if (typeof hp === "string" && hp.trim() !== "") {
    console.log(`Spam blocked: honeypot triggered from IP ${req.ip}`);
    return res.status(422).json({ 
      ok: false, 
      reason: "honeypot",
      message: "Invalid submission detected." 
    });
  }

  // Timing guard: more lenient for authenticated users
  const now = Date.now();
  const renderTimestamp = Number(renderAt);
  const minimumWait = isAuthenticated ? 200 : 1000; // 200ms for logged-in users, 1000ms for anonymous
  
  if (!Number.isFinite(renderTimestamp) || now - renderTimestamp < minimumWait) {
    console.log(`Spam blocked: too fast submission from IP ${req.ip} (authenticated: ${!!isAuthenticated})`);
    return res.status(400).json({ 
      ok: false, 
      reason: "too_fast",
      message: "Please wait a moment before submitting." 
    });
  }

  // Duplicate submission check
  const bodyHash = crypto.createHash("sha256")
    .update(JSON.stringify(req.body))
    .digest("hex");
  const submissionKey = createSubmissionKey(req, bodyHash);
  const lastSubmission = recentSubmissions.get(submissionKey);
  
  if (lastSubmission && now - lastSubmission < 60 * 1000) {
    console.log(`Spam blocked: duplicate submission from IP ${req.ip}`);
    return res.status(409).json({ 
      ok: false, 
      reason: "duplicate",
      message: "This content was already submitted recently." 
    });
  }

  // Record this submission
  recentSubmissions.set(submissionKey, now);
  
  // Schedule cleanup for this specific entry
  setTimeout(() => {
    recentSubmissions.delete(submissionKey);
  }, 90 * 1000);

  next();
}

// Cloudflare Turnstile CAPTCHA verification
export async function verifyCaptcha(token: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.log('Turnstile not configured, skipping CAPTCHA verification');
    return true; // Skip if not configured
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      console.log('Turnstile verification failed:', data['error-codes']);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false; // Fail closed on error
  }
}