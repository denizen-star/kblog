# Kblog Database Migration Instructions

This document provides step-by-step instructions for migrating kblog from Google Sheets to a PlanetScale MySQL-compatible database. This migration covers Newsletter Signups, Contact Messages, and Project Inquiries.

**Reference:** Based on the pattern from `gayrunclub/docs/DATABASE_AND_NETLIFY_INSTRUCTIONS.md`

## What's Being Migrated

- ✅ **Newsletter Signups** → `kblog_newsletter_signups` table
- ✅ **Contact Messages** → `kblog_contact_messages` table
- ✅ **Project Inquiries** → `kblog_project_inquiries` table

**Excluded from migration:**
- ❌ Articles (remain as HTML files + metadata.json)
- ❌ Comments (remain as JSON files, will migrate later)
- ❌ Site Engagement Events (remain in Google Sheets)

## Architecture Overview

```
Frontend (Static HTML/JS)
    ↓
Netlify Functions / Express Server
    ↓
Database Client (lib/databaseClient.js)
    ↓
PlanetScale Database (MySQL-compatible)
```

## Step 1: Create PlanetScale Database

1. **Sign up/Login to PlanetScale**
   - Go to https://planetscale.com
   - Create account or sign in

2. **Create New Database**
   - Click "Create database"
   - Database name: `kervapps` (or your preferred name)
   - Region: Choose closest to your users
   - Plan: Free tier is sufficient for development

3. **Create Development Branch**
   - After database creation, you'll be in the `main` branch
   - Click "Create branch" → Name it `dev` or `development`
   - Work in this branch for schema changes

## Step 2: Create Database Schema

1. **Open PlanetScale Console**
   - Navigate to your database → `dev` branch
   - Click "Console" tab

2. **Run Schema SQL**
   - Copy the SQL from `lib/schema-kblog.sql`
   - Paste into the console
   - Execute the SQL

3. **Verify Tables Created**
   - You should see three tables:
     - `kblog_newsletter_signups`
     - `kblog_contact_messages`
     - `kblog_project_inquiries`

4. **Promote to Production**
   - Once schema is verified, create a deploy request
   - Review changes
   - Merge to `main` branch (this becomes production)

## Step 3: Install Dependencies

Add the PlanetScale database client to your project:

```bash
npm install @planetscale/database
```

This will add the dependency to your `package.json`.

## Step 4: Create Database Client

Create `lib/databaseClient.js` following the gayrunclub pattern:

**Key features:**
- Reads from `DATABASE_URL` or `PLANETSCALE_DATABASE_URL` first
- Falls back to individual `PLANETSCALE_HOST`, `PLANETSCALE_USERNAME`, `PLANETSCALE_PASSWORD`, `PLANETSCALE_DATABASE` variables
- Uses `@planetscale/database` for serverless-safe connections
- Provides helper methods for each table

## Step 5: Get Database Credentials

1. **In PlanetScale Dashboard**
   - Go to your database → Settings → Passwords
   - Click "New password"
   - Name it (e.g., "Netlify Production")
   - Copy the connection string (starts with `mysql://`)

2. **Connection String Format**
   ```
   mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}
   ```

## Step 6: Configure Netlify Environment Variables

1. **Go to Netlify Dashboard**
   - Your site → Site settings → Environment variables

2. **Add Database Variables**

   **Option A: Single Connection String (Recommended)**
   ```
   DATABASE_URL = mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}
   ```

   **Option B: Individual Components**
   ```
   PLANETSCALE_HOST = your-host.planetscale.com
   PLANETSCALE_USERNAME = your-username
   PLANETSCALE_PASSWORD = your-password
   PLANETSCALE_DATABASE = kervapps
   ```

3. **Optional: Keep Google Sheets During Transition**
   ```
   GS_DATA_PIPELINE_URL = https://script.google.com/macros/s/.../exec
   SKIP_SHEETS = 0  # Set to "1" to disable Google Sheets writes
   ```

4. **Apply Changes**
   - Click "Save"
   - Redeploy your site to pick up new environment variables

## Step 7: Update netlify.toml

Add the database client to included files so Netlify Functions can access it:

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  included_files = ["server.js", "lib/**", "package.json"]
```

The `lib/**` pattern will include `lib/databaseClient.js` in your functions.

## Step 8: Update Netlify Functions

### Update `netlify/functions/newsletter-subscribe.js`

Add database write after validation, before or alongside Google Sheets:

```javascript
const { db } = require('../../lib/databaseClient');

// After validation, before response
try {
  await db.newsletterSignups.create({
    email: email,
    name: body.name || null,
    session_id: sessionId,
    source: body.source || body.campaignTag || 'newsletter_signup',
    page_url: body.pageUrl || null,
    component_id: body.componentId || null,
    referrer: body.referrer || null,
    device_info: JSON.stringify({
      deviceData: body.deviceInfo || body.deviceData || null,
      sessionInfo: body.sessionInfo || null,
    }),
    ip_address: ipAddress,
    user_agent: userAgent,
    status: 'active'
  });
  console.log('Newsletter signup saved to database');
} catch (dbError) {
  console.error('Database write failed (newsletter):', dbError);
  // Don't fail the request - user still sees success
}
```

### Update `netlify/functions/contact-submit.js`

Similar pattern for contact messages:

```javascript
const { db } = require('../../lib/databaseClient');

// After validation
try {
  await db.contactMessages.create({
    name: name,
    email: email,
    organization: body.organization || null,
    role: body.role || null,
    subject: body.subject || null,
    message: message,
    session_id: sessionId,
    page_url: body.pageUrl || null,
    referrer: body.referrer || null,
    device_info: JSON.stringify({
      deviceData: body.deviceInfo || null,
      sessionInfo: body.sessionInfo || null,
    }),
    ip_address: ipAddress,
    user_agent: userAgent,
    status: 'submitted'
  });
  console.log('Contact message saved to database');
} catch (dbError) {
  console.error('Database write failed (contact):', dbError);
}
```

### Update `netlify/functions/project-inquiry-submit.js`

Similar pattern for project inquiries:

```javascript
const { db } = require('../../lib/databaseClient');

// After validation
try {
  await db.projectInquiries.create({
    name: name,
    email: email,
    organization: body.organization || null,
    role: body.role || null,
    engagement_preference: body.engagementPreference || null,
    timeline: body.timeline || null,
    message: message,
    session_id: sessionId,
    page_url: body.pageUrl || null,
    referrer: body.referrer || null,
    device_info: JSON.stringify({
      deviceData: body.deviceInfo || null,
      sessionInfo: body.sessionInfo || null,
    }),
    ip_address: ipAddress,
    user_agent: userAgent,
    status: 'submitted'
  });
  console.log('Project inquiry saved to database');
} catch (dbError) {
  console.error('Database write failed (project inquiry):', dbError);
}
```

## Step 9: Update Express Server (server.js)

Update the local development server endpoints:

### Update `/api/newsletter/subscribe`

Add database write similar to Netlify function pattern.

### Update `/api/contact/submit`

Add database write similar to Netlify function pattern.

**Note:** The Express server runs locally, so you'll need to set environment variables in your local `.env` file or export them in your shell.

## Step 10: Test the Migration

### Local Testing

1. **Set Local Environment Variables**
   ```bash
   export DATABASE_URL="mysql://username:password@host:port/database?ssl={\"rejectUnauthorized\":true}"
   ```

2. **Start Local Server**
   ```bash
   npm start
   ```

3. **Test Endpoints**
   - Submit newsletter signup
   - Submit contact form
   - Submit project inquiry

4. **Verify in Database**
   - Check PlanetScale console
   - Query tables to see new records

### Production Testing

1. **Deploy to Netlify**
   - Push changes to your repository
   - Netlify will auto-deploy

2. **Test Live Forms**
   - Visit your site
   - Submit test entries through each form

3. **Check Function Logs**
   - Netlify Dashboard → Functions → View logs
   - Look for "saved to database" messages
   - Check for any errors

4. **Verify Database**
   - Check PlanetScale console
   - Confirm records appear in tables

## Step 11: Data Migration (Optional)

If you have existing data in Google Sheets that needs to be migrated:

1. **Export from Google Sheets**
   - Download as CSV for each tab:
     - Newsletter Signups
     - Contact Messages
     - Project Inquiries

2. **Create Migration Script**
   - Script should read CSV files
   - Parse and format data
   - Insert into database using `databaseClient`

3. **Run Migration**
   - Execute script once
   - Verify data integrity
   - Check record counts match

## Step 12: Monitor and Validate

### Week 1: Parallel Writes
- Both database and Google Sheets receive writes
- Compare data between both sources
- Monitor for any discrepancies

### Week 2: Database Primary
- Database becomes primary source
- Google Sheets can remain as backup (optional)
- Monitor error rates

### Week 3+: Full Migration
- Once confident, disable Google Sheets writes
- Set `SKIP_SHEETS=1` in environment variables
- Remove Google Sheets integration code (optional)

## Troubleshooting

### Connection Issues

**Error: "Connection refused"**
- Check database credentials
- Verify database is not paused (PlanetScale free tier pauses after inactivity)
- Ensure SSL is enabled in connection string

**Error: "Access denied"**
- Verify username and password
- Check database name matches
- Ensure password hasn't expired (PlanetScale passwords can expire)

### Data Issues

**Records not appearing**
- Check function logs for errors
- Verify table names match (should have `kblog_` prefix)
- Check JSON serialization for `device_info` field

**Duplicate entries**
- Newsletter signups should have unique constraint on email
- Check if parallel writes are creating duplicates
- Review error handling logic

### Function Issues

**Function timeout**
- Database writes should be fast (< 1 second)
- If slow, check database connection
- Consider adding timeout handling

**Module not found**
- Verify `lib/databaseClient.js` is in `included_files`
- Check `package.json` has `@planetscale/database`
- Redeploy after adding dependencies

## Rollback Procedure

If you need to rollback:

1. **Disable Database Writes**
   - Comment out database write code in functions
   - Redeploy

2. **Re-enable Google Sheets**
   - Set `SKIP_SHEETS=0` or remove the variable
   - Ensure `GS_DATA_PIPELINE_URL` is set
   - Redeploy

3. **Database Remains**
   - Database can stay for future use
   - No need to delete it
   - Can resume migration later

## API Endpoints (After Migration)

All existing endpoints remain the same:

- `POST /api/newsletter/subscribe` → Writes to `kblog_newsletter_signups`
- `POST /api/contact/submit` → Writes to `kblog_contact_messages`
- `POST /api/project-inquiries/submit` → Writes to `kblog_project_inquiries`

No frontend changes required - the migration is transparent to users.

## Telemetry Migration (Site Engagement Events)

The telemetry/analytics events have been migrated to a shared `app_events` table that can be used across multiple applications.

### What Was Migrated

- ✅ **Site Engagement Events** → `app_events` table (shared, no kblog_ prefix)
- Table includes `app_name` column for multi-app tracking
- Events from kblog use `APP_NAME` environment variable (defaults to "Kblog")

### Database Schema

The `app_events` table includes:
- `app_name` (VARCHAR) - Required, identifies which app the event came from
- `timestamp` (TIMESTAMP) - Event timestamp
- `session_id` (VARCHAR) - Session identifier
- `event_type` (VARCHAR) - Type of event (page_view, article_view, etc.)
- `page_category` (VARCHAR) - Page category
- `page_url` (TEXT) - Full page URL
- `article_id` (VARCHAR) - Article ID (for article events)
- `article_slug` (VARCHAR) - Article slug (for article events)
- `article_context` (VARCHAR) - Article context/list position
- `depth_percent` (INT) - Reading depth percentage (for article_read events)
- `referrer` (TEXT) - Referrer URL
- `device_info` (JSON) - Device and session information
- `ip_address` (VARCHAR) - Client IP address
- `user_agent` (TEXT) - User agent string
- Standard timestamps: `created_at`, `updated_at`

### Environment Variables

Add the `APP_NAME` environment variable:

**In Netlify:**
```
APP_NAME = Kblog
```

**Locally (for development):**
```bash
export APP_NAME="Kblog"
```

The `APP_NAME` variable allows the same codebase to be used across multiple apps, with each app identifying itself in the database.

### Implementation Details

- **Database-only writes**: Telemetry events write directly to the database (no Google Sheets)
- **DRY utilities**: Uses shared helper functions in `netlify/functions/utils.js`:
  - `getAppName()` - Reads APP_NAME env var, defaults to "Kblog"
  - `buildTelemetryPayload()` - Maps request body to database schema
  - `writeTelemetryToDatabase()` - Handles database writes with error handling
- **Event validation**: Same validation rules as before (event types, required fields)
- **Error handling**: Database write errors don't fail the user request

### API Endpoint

- `POST /api/analytics/event` → Writes to `app_events` table

The endpoint behavior remains the same from the frontend perspective - no changes required.

### Multi-App Usage

To use this telemetry system in other apps:

1. Set `APP_NAME` environment variable to your app name
2. Use the same `app_events` table (shared database)
3. Events will be automatically tagged with the correct `app_name`
4. Query events by `app_name` to filter by application

Example query:
```sql
SELECT * FROM app_events WHERE app_name = 'Kblog' ORDER BY created_at DESC;
```

## Next Steps

After successful migration:

1. **Monitor Performance**
   - Track query performance
   - Monitor database usage
   - Set up alerts if needed

2. **Add Admin Endpoints (Optional)**
   - Create read-only endpoints to view submissions
   - Add filtering and pagination
   - Consider authentication for admin access

3. **Future Migrations**
   - Comments migration (when ready)
   - Articles metadata migration (if needed)

## Support

For issues or questions:
- Check PlanetScale documentation: https://docs.planetscale.com
- Review Netlify Functions logs
- Check database connection status in PlanetScale dashboard
