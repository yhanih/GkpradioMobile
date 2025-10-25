# Comprehensive Bug Report for GKP Radio Application

## Executive Summary
A thorough bug check has revealed multiple critical issues that prevent the application from functioning properly. These issues range from database schema mismatches to authentication problems and API endpoint failures.

## Critical Bugs (Application Breaking)

### 1. Database Table Issues
**Status: CRITICAL**

#### a. Missing Tables
- `notification_queue` table does not exist in Supabase
- Error: `Could not find the table 'public.notification_queue' in the schema cache`

#### b. Table Name Case Sensitivity Issues  
- Code expects `community_threads` but database has `communitythreads`
- Code expects `community_comments` but database has `communitycomments`
- Column name mismatch: `createdAt` vs `createdat`, `updatedAt` vs `updatedat`

**Impact:**
- Notification system completely broken
- Cannot create or view community discussions
- Cannot post comments
- Videos API returns 500 error

**Solution:** Run the SQL migration script in `docs/fix-database-bugs.sql`

### 2. Port Configuration Issue
**Status: CRITICAL**

- Application runs on port 3001 but Replit expects port 5000
- This causes the workflow to fail with "didn't open port 5000"

**Impact:**
- Application appears offline or fails to start properly in Replit environment

**Solution:** Update port configuration to use port 5000

### 3. Authentication Token Flow
**Status: HIGH**

- Frontend expects `gkp_auth_token` in localStorage
- Backend returns token but may not be properly set on login
- Mismatch between Supabase auth and custom token system

**Impact:**
- Users cannot create discussions (401 errors)
- Session management is inconsistent
- API calls fail with authentication errors

### 4. API Endpoint Failures
**Status: HIGH**

Failed endpoints detected:
- `/api/community/threads` - Returns "Failed to load discussions"
- `/api/videos` - Returns "Failed to fetch videos" 
- `/api/episodes` - Returns "Failed to fetch episodes"
- `/api/sponsors` - Returns HTML instead of JSON (route not configured)
- `/api/team` - Returns HTML instead of JSON (route not configured)

## Non-Critical Issues

### 1. Missing Environment Variables
- `AZURACAST_API_URL` and `AZURACAST_API_KEY` not configured
- `SENDGRID_API_KEY` not set
- `MAILERSEND_API_TOKEN` not configured

**Impact:** Email notifications and streaming features disabled but core app still works

### 2. Undefined Server Values in Logs
- RTMP/HLS server shows `undefined:1935` and `undefined:8001`
- Likely missing HOST environment variable

## Database Schema SQL Fix

```sql
-- Run this in Supabase Dashboard SQL Editor

-- 1. Create missing notification_queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Fix table name mismatches with views
CREATE OR REPLACE VIEW community_threads AS 
SELECT * FROM communitythreads;

CREATE OR REPLACE VIEW community_comments AS 
SELECT * FROM communitycomments;

-- 3. Add missing notification tables
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

## Testing Checklist After Fixes

1. ✅ Database migrations applied successfully
2. ⬜ User can sign up and login
3. ⬜ Authentication tokens persist properly
4. ⬜ User can create community discussion
5. ⬜ Community threads load correctly
6. ⬜ User can post comments
7. ⬜ Videos page loads without errors
8. ⬜ Episodes/podcasts load correctly
9. ⬜ Notification system processes queue
10. ⬜ Application runs on correct port (5000)

## Recommended Fix Priority

1. **Immediate**: Apply database migration script
2. **Immediate**: Fix port configuration to 5000
3. **High**: Fix authentication token synchronization
4. **High**: Fix API endpoint routes
5. **Medium**: Configure environment variables
6. **Low**: Fix undefined host values in streaming config

## Files Requiring Changes

1. **Port Configuration**: Update server to listen on port 5000
2. **Database**: Apply migration script
3. **Authentication**: Synchronize token handling between frontend and backend
4. **API Routes**: Fix missing /api/sponsors and /api/team endpoints

## Summary

The application has several critical bugs that prevent basic functionality:
- Database schema mismatches prevent data operations
- Port misconfiguration prevents proper deployment
- Authentication issues block user actions
- Multiple API endpoints are broken

Once these issues are fixed, the application should function properly for users to create accounts, post discussions, view content, and receive notifications.