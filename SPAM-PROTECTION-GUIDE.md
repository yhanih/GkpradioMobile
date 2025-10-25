# Spam and Bot Protection Guide

## Overview

GKP Radio now includes comprehensive spam and bot protection for community features, authentication, and public forms. The protection includes rate limiting, honeypot fields, timing guards, duplicate detection, and Cloudflare Turnstile CAPTCHA.

## Environment Variables

### Required for Full Protection

```bash
# Server Environment (.env)
ANTI_SPAM_ENABLED=true
TURNSTILE_SECRET_KEY=your_cloudflare_turnstile_secret_key

# Frontend Environment (.env.local)
VITE_ANTI_SPAM_ENABLED=true
VITE_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
```

### Optional (Graceful Degradation)

If `ANTI_SPAM_ENABLED=false` or keys are missing, the system will:
- Skip CAPTCHA verification
- Still apply rate limits
- Log warnings about missing configuration

## Protection Layers

### 1. Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Strict Routes**: 10 requests per 10 minutes per IP
  - Authentication routes (`/api/auth/signup`, `/api/auth/login`)
  - Community content creation (`/api/community/threads`, `/api/community/threads/:id/comments`)

### 2. Speed Limiting
- Adds 500ms delay after 3 quick requests in 10 seconds
- Maximum delay: 5 seconds

### 3. Submission Guards
- **Honeypot**: Hidden field `hp` must be empty
- **Timing**: Minimum 3 seconds between form render and submission
- **Duplicate Detection**: Same content from same IP blocked for 60 seconds

### 4. Cloudflare Turnstile CAPTCHA
- Invisible verification for legitimate users
- Fallback for suspicious behavior
- Auto-retry on network issues

## Protected Routes

### Authentication
- `POST /api/auth/signup` - Account creation
- `POST /api/auth/login` - User login

### Community Features
- `POST /api/community/threads` - New discussions
- `POST /api/community/threads/:id/comments` - Comments

## Frontend Implementation

### Adding Protection to Forms

```tsx
import TurnstileGate from "@/components/TurnstileGate";

function MyForm() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [formRenderTime] = useState(Date.now());

  const submitData = () => {
    fetch('/api/protected-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-turnstile-token': turnstileToken,
      },
      body: JSON.stringify({
        // your form data
        renderAt: formRenderTime,
        hp: "", // honeypot field
      }),
    });
  };

  return (
    <form>
      {/* Your form fields */}
      
      <TurnstileGate 
        onToken={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
        size="compact"
      />
      
      <button onClick={submitData}>Submit</button>
    </form>
  );
}
```

### Compact vs Normal CAPTCHA

```tsx
// Compact size for forms with limited space
<TurnstileGate size="compact" onToken={setToken} />

// Normal size (default)
<TurnstileGate onToken={setToken} />
```

## Testing

### Development Routes

When `NODE_ENV=development`, test routes are available:

```bash
# Full protection test
curl -X POST http://localhost:5000/dev/spam-check \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "renderAt": '$(date +%s000)', "hp": ""}'

# No protection test
curl -X POST http://localhost:5000/dev/no-protection \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Expected Responses

**Honeypot Triggered (422)**
```bash
curl -X POST http://localhost:5000/dev/spam-check \
  -H "Content-Type: application/json" \
  -d '{"hp": "bot_filled_this", "renderAt": '$(date +%s000)'}'
```

**Too Fast Submission (400)**
```bash
curl -X POST http://localhost:5000/dev/spam-check \
  -H "Content-Type: application/json" \
  -d '{"renderAt": '$(date +%s000)', "hp": ""}'
```

**Rate Limit Exceeded (429)**
```bash
# Send 15+ requests quickly
for i in {1..16}; do
  curl -X POST http://localhost:5000/dev/spam-check \
    -H "Content-Type: application/json" \
    -d '{"renderAt": '$(($(date +%s) - 10))'000, "hp": ""}'
done
```

## Getting Cloudflare Turnstile Keys

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to "Turnstile" section
3. Create a new site widget:
   - **Domain**: Your domain (e.g., `godkingdomprinciplesradio.com`)
   - **Widget Mode**: Managed (recommended)
   - **Pre-clearance**: Enabled (optional)
4. Copy the **Site Key** and **Secret Key**
5. Add to your environment variables

## Error Handling

### Server Responses

```json
// Rate limit exceeded
{
  "ok": false,
  "reason": "rate_limit_exceeded",
  "message": "Too many requests, please try again later."
}

// Honeypot triggered
{
  "ok": false,
  "reason": "honeypot",
  "message": "Invalid submission detected."
}

// Submission too fast
{
  "ok": false,
  "reason": "too_fast",
  "message": "Please wait a moment before submitting."
}

// Duplicate submission
{
  "ok": false,
  "reason": "duplicate",
  "message": "This content was already submitted recently."
}

// CAPTCHA failed
{
  "ok": false,
  "reason": "captcha_failed",
  "message": "CAPTCHA verification failed. Please try again."
}
```

### Frontend Error Handling

```tsx
const handleSubmit = async () => {
  try {
    await submitForm();
  } catch (error) {
    if (error.message?.includes("rate_limit")) {
      showMessage("Too many requests. Please wait before trying again.");
    } else if (error.message?.includes("captcha")) {
      showMessage("Security verification failed. Please complete the verification.");
      setTurnstileToken(""); // Reset to show CAPTCHA again
    } else if (error.message?.includes("too_fast")) {
      showMessage("Please wait a moment before submitting.");
    }
  }
};
```

## Monitoring

### Server Logs

All blocked attempts are logged with:
- IP address
- Reason for blocking
- Timestamp
- Request details

```
Spam blocked: honeypot triggered from IP 192.168.1.100
Spam blocked: too fast submission from IP 10.0.0.5
Spam blocked: duplicate submission from IP 203.0.113.1
```

### Success Metrics

Monitor successful submissions vs blocked attempts to tune protection levels.

## Production Deployment

1. **Enable Protection**:
   ```bash
   ANTI_SPAM_ENABLED=true
   ```

2. **Add Turnstile Keys**:
   - Set `TURNSTILE_SECRET_KEY` on server
   - Set `VITE_TURNSTILE_SITE_KEY` for frontend build

3. **Monitor Logs**:
   - Watch for unusual blocking patterns
   - Adjust rate limits if needed

4. **Test Before Deploy**:
   - Verify CAPTCHA works with your domain
   - Test rate limits don't affect legitimate users
   - Confirm error messages are user-friendly

## Customization

### Adjusting Rate Limits

Edit `server/security.ts`:

```typescript
// Global rate limiter
const globalLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // requests per window
});

// Strict rate limiter
export const strictLimiter = rateLimit({ 
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,                  // requests per window
});
```

### Custom Protection Middleware

```typescript
import { strictLimiter, submissionGuards, checkTurnstile } from "./security";

app.post("/my-endpoint", 
  strictLimiter,        // Rate limiting
  submissionGuards,     // Honeypot + timing + duplicates
  checkTurnstile,       // CAPTCHA verification
  async (req, res) => {
    // Your protected endpoint logic
  }
);
```

## Troubleshooting

### CAPTCHA Not Showing
- Check `VITE_TURNSTILE_SITE_KEY` is set
- Verify `VITE_ANTI_SPAM_ENABLED=true`
- Ensure domain matches Turnstile configuration

### Rate Limits Too Strict
- Increase `max` values in rate limiters
- Adjust `windowMs` for longer time windows
- Consider IP whitelisting for trusted sources

### False Positives
- Check honeypot field isn't visible to users
- Verify timing requirements (3 seconds minimum)
- Monitor duplicate detection cache timing

## Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Use HTTPS** in production for Turnstile
3. **Monitor logs** for attack patterns
4. **Keep libraries updated** for security patches
5. **Test protection** doesn't block legitimate users
6. **Have fallback plans** if external services fail