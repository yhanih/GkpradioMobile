# User Registration Spam Protection Guide

## Overview

GKP Radio now includes comprehensive spam protection for user registration to prevent bot signups and ensure only real users join the community. The protection is applied from the very first interaction with new users.

## Protection Features

### 1. Registration Form Protection
- **Cloudflare Turnstile CAPTCHA**: Invisible verification for signup forms
- **Rate Limiting**: Prevents bulk registration attempts
- **Honeypot Fields**: Hidden form fields to catch bots
- **Timing Guards**: Prevents too-fast form submissions
- **Duplicate Detection**: Blocks repeated registration attempts

### 2. Multi-Layer Verification
- **Email Validation**: Proper email format checking
- **Password Security**: Secure password requirements
- **Location Verification**: City and country fields for authenticity
- **Form Completion Time**: Ensures human-like interaction timing

## How It Works

### For New Users
1. User clicks "Join Us" to register
2. Fills out registration form (username, email, city, country, password)
3. **Spam Protection Activates**:
   - Turnstile CAPTCHA appears (invisible for real users)
   - Timing validation ensures form wasn't submitted too quickly
   - Honeypot fields check for bot behavior
4. Form submission includes protection tokens
5. Server validates all protection measures
6. If legitimate: Account created and user logged in
7. If suspicious: Blocked with clear error message

### For Returning Users
- Login form has basic rate limiting
- No CAPTCHA needed for existing users
- Protection focuses on preventing brute force attacks

## User Experience

### Real Users
- Invisible protection - no disruption to signup flow
- Fast, seamless registration process
- Clear welcome message after successful signup
- Immediate access to community features

### Bot Users
- CAPTCHA challenge appears for suspicious behavior
- Rate limiting prevents rapid attempts
- Clear error messages guide legitimate users who trigger protection
- Automatic blocking of obvious bot patterns

## Technical Implementation

### Frontend Protection
```tsx
// TurnstileGate component in signup form
<TurnstileGate 
  onToken={setTurnstileToken}
  onExpire={() => setTurnstileToken("")}
  onError={() => setTurnstileToken("")}
  className="py-2"
/>

// Validation before submission
if (isSpamProtectionEnabled && hasSiteKey && !turnstileToken) {
  toast({
    title: "Security Verification Required",
    description: "Please complete the security verification below.",
    variant: "destructive",
  });
  return;
}
```

### Backend Protection
```typescript
// Signup route with full protection
app.post("/api/auth/signup", 
  strictLimiter,        // 10 requests per 10 minutes
  submissionGuards,     // Honeypot + timing + duplicates
  checkTurnstile,       // CAPTCHA verification
  authRoutes.signup
);
```

### Data Submission
```javascript
// Signup data includes protection fields
const signupData = {
  username: "user123",
  email: "user@example.com", 
  password: "securepass",
  city: "New York",
  country: "USA",
  renderAt: formRenderTime,  // Form timing
  hp: "",                    // Honeypot field
};

// Headers include Turnstile token
headers: {
  "Content-Type": "application/json",
  "cf-turnstile-token": turnstileToken,
}
```

## Error Handling

### User-Friendly Messages
- **Rate Limited**: "Too many signup attempts. Please wait before trying again."
- **CAPTCHA Failed**: "Security verification failed. Please complete the verification."
- **Too Fast**: "Please wait a moment before submitting."
- **Duplicate**: "This account information was already used recently."
- **Honeypot**: "Invalid submission detected." (generic message)

### Developer Logs
```
Spam blocked: honeypot triggered from IP 192.168.1.100
Spam blocked: too fast submission from IP 10.0.0.5  
Spam blocked: duplicate submission from IP 203.0.113.1
CAPTCHA verification failed for signup from IP 192.168.1.50
```

## Configuration Options

### Environment Variables
```bash
# Enable/disable protection
ANTI_SPAM_ENABLED=true

# Turnstile credentials
TURNSTILE_SECRET_KEY=your_secret_key
VITE_TURNSTILE_SITE_KEY=your_site_key
VITE_ANTI_SPAM_ENABLED=true
```

### Rate Limiting Customization
```typescript
// Adjust signup rate limits in server/security.ts
export const strictLimiter = rateLimit({ 
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,                  // 10 signups per window
});
```

### Timing Requirements
```typescript
// Minimum form completion time (3 seconds)
const minSubmissionTime = 3000;
const formTime = Date.now() - renderAt;
if (formTime < minSubmissionTime) {
  // Block as too fast
}
```

## Testing Registration Protection

### Manual Testing
1. Go to website and click "Join Us"
2. Fill out form quickly (< 3 seconds) → Should be blocked
3. Fill honeypot field → Should be blocked  
4. Complete form normally → Should succeed
5. Try to register same details again → Should be blocked

### Development Testing
```bash
# Test valid signup (wait 5+ seconds)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "cf-turnstile-token: test-token" \
  -d '{
    "username": "testuser", 
    "email": "test@example.com",
    "password": "password123",
    "city": "Test City",
    "country": "Test Country",
    "renderAt": '$(date -d "5 seconds ago" +%s)'000',
    "hp": ""
  }'

# Test honeypot detection
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "botuser",
    "email": "bot@example.com", 
    "hp": "filled_by_bot",
    "renderAt": '$(date -d "5 seconds ago" +%s)'000'
  }'

# Test too-fast submission
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "fastuser",
    "email": "fast@example.com",
    "renderAt": '$(date +%s)'000',
    "hp": ""
  }'
```

## Monitoring and Analytics

### Success Metrics
- Registration completion rate
- Time from form load to submission
- CAPTCHA solve rate
- Geographic distribution of signups

### Security Metrics  
- Blocked bot attempts per day
- Most common attack patterns
- Peak attack times
- False positive rate

### Dashboard Queries
```sql
-- Daily signup attempts vs blocked
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN blocked = true THEN 1 ELSE 0 END) as blocked_attempts
FROM signup_logs 
GROUP BY DATE(created_at);

-- Most blocked IPs
SELECT ip_address, COUNT(*) as block_count
FROM security_blocks 
WHERE reason = 'signup_blocked'
GROUP BY ip_address 
ORDER BY block_count DESC;
```

## Best Practices

### For Users
1. Complete registration forms at normal human speed
2. Fill all required fields accurately  
3. Use valid email addresses
4. Choose secure passwords
5. Complete any security verification prompts

### For Administrators
1. Monitor registration success/block rates
2. Adjust rate limits based on legitimate usage patterns
3. Review blocked attempts for new attack vectors
4. Keep Turnstile keys secure and rotated
5. Test registration flow regularly

### For Developers
1. Never disable protection in production
2. Test all registration paths thoroughly
3. Monitor error rates and user feedback
4. Keep protection libraries updated
5. Document any configuration changes

## Troubleshooting

### High False Positive Rate
- Lower timing requirements
- Increase rate limits  
- Check Turnstile configuration
- Review geographic restrictions

### Low Block Rate (Bots Getting Through)
- Enable additional protection layers
- Lower rate limits
- Strengthen timing requirements
- Add additional validation rules

### User Complaints
- Review error messages for clarity
- Check protection isn't too aggressive  
- Ensure CAPTCHA is working properly
- Verify forms load correctly on all devices

## Integration with Community Features

Once users successfully register with spam protection:
1. **Immediate Access**: Full community participation
2. **Trust Score**: Clean registration contributes to user reputation
3. **Reduced Friction**: Less protection needed for established users
4. **Behavioral Analysis**: Registration patterns inform ongoing protection

This creates a secure onboarding process that protects the community while welcoming legitimate new members.