# Telemetry Implementation Guide

## Overview

Kblog uses a shared telemetry system that tracks user engagement events across multiple applications using a single database table (`app_events`). This guide explains how the system works and how to implement it in other applications.

## Architecture

### Shared Database Table

All telemetry events are stored in a single `app_events` table that is shared across multiple applications. Each application identifies itself using the `app_name` column.

**Database Schema:**
```sql
CREATE TABLE app_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app_name VARCHAR(100) NOT NULL,           -- Identifies which app (e.g., "Kblog", "GayRunClub", "EventPlan", "TorontoGuide")
  timestamp TIMESTAMP NOT NULL,              -- Event timestamp
  session_id VARCHAR(255),                   -- Session identifier
  event_type VARCHAR(100) NOT NULL,          -- Type of event (page_view, article_view, etc.)
  page_category VARCHAR(255),                -- Page category (home, article, contact, etc.)
  page_url TEXT,                             -- Full page URL
  article_id VARCHAR(255),                   -- Article/content ID (for content-specific events)
  article_slug VARCHAR(255),                -- Article/content slug (for content-specific events)
  article_context VARCHAR(255),             -- Context where content was viewed (e.g., "home_sidebar", "articles_list")
  depth_percent INT,                         -- Reading depth percentage (for read events)
  referrer TEXT,                             -- Referrer URL
  device_info JSON,                          -- Device and session information
  ip_address VARCHAR(45),                    -- Client IP address
  user_agent TEXT,                           -- User agent string
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_app_name (app_name),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  INDEX idx_session_id (session_id),
  INDEX idx_timestamp (timestamp)
);
```

### Key Design Principles

1. **Multi-App Support**: The `app_name` column allows multiple applications to use the same table
2. **Database-Only**: Events are written directly to the database (no Google Sheets or external services)
3. **Non-Blocking**: Database write failures don't affect user experience
4. **Session Tracking**: Uses sessionStorage to maintain session IDs across page loads
5. **Event Deduplication**: Client-side logic prevents duplicate events (impressions, reads)

## Implementation Components

### 1. Client-Side Tracking (`analytics.js`)

The client-side script tracks user interactions and sends events to the backend API.

**Key Features:**
- Session management using sessionStorage
- Automatic page view tracking
- Article/content impression tracking (Intersection Observer)
- Article/content click tracking
- Reading depth tracking (scroll-based)
- Deduplication to prevent duplicate events

**Event Types Tracked:**
- `page_view`: When a page is loaded
- `article_view`: When an article/content page is viewed
- `article_impression`: When an article/content card becomes visible
- `article_open`: When an article/content card is clicked
- `article_read`: When user scrolls to 75% depth of an article

**Session Management:**
```javascript
const SESSION_KEY = 'kblog_session_id';  // Change prefix per app
const getSessionId = () => {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const newId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  sessionStorage.setItem(SESSION_KEY, newId);
  return newId;
};
```

**API Endpoint:**
```javascript
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:1977' : 'https://kblog.kervinapps.com';
};

// Send event to: ${getApiBaseUrl()}/api/analytics/event
```

**Event Payload Structure:**
```javascript
{
  sessionId: string,           // Generated session ID
  eventType: string,           // One of: page_view, article_view, article_impression, article_open, article_read
  pageUrl: string,             // window.location.href
  referrer: string,            // document.referrer
  pageCategory: string,        // 'home', 'article', 'articles_list', 'contact', etc.
  deviceInfo: object,          // Device metadata (userAgent, language, timezone, screenResolution)
  articleId: string,          // (Optional) For article-specific events
  articleSlug: string,        // (Optional) For article-specific events
  listContext: string,        // (Optional) Context where content was viewed
  depthPercent: number,       // (Optional) For article_read events
  timestamp: string           // (Optional) ISO timestamp, defaults to server time
}
```

### 2. Server-Side API Endpoint (`netlify/functions/analytics-event.js`)

The server-side function validates and stores events in the database.

**Key Functions:**
- Validates HTTP method (POST only)
- Validates event type against allowed types
- Validates event-specific requirements
- Extracts client metadata (IP, user agent)
- Builds telemetry payload
- Writes to database
- Returns success/error response

**Validation Rules:**
- `page_view`: No additional requirements
- `article_view`: Requires `articleSlug` or `articleId`
- `article_impression`: Requires `articleId` or `articleSlug`
- `article_open`: Requires `articleId` or `articleSlug`
- `article_read`: Requires `articleId` or `articleSlug` AND numeric `depthPercent`

**Helper Functions (from `netlify/functions/utils.js`):**
- `getAppName()`: Reads `APP_NAME` environment variable, defaults to "Kblog"
- `buildTelemetryPayload()`: Maps request body to database schema
- `writeTelemetryToDatabase()`: Handles database writes with error handling

### 3. Database Client (`lib/databaseClient.js`)

The database client provides CRUD operations for the `app_events` table.

**Key Methods:**
- `db.appEvents.create(eventData)`: Insert a new event
- `db.appEvents.getByAppName(appName, limit, offset)`: Query events by app name

**Database Connection:**
- Uses PlanetScale (MySQL-compatible)
- Connection details from environment variables
- Handles JSON serialization for `device_info` field
- Converts ISO timestamps to MySQL datetime format

## Environment Configuration

### Required Environment Variables

```bash
# Application identifier (used in app_events.app_name)
APP_NAME=Kblog  # Change per application: "GayRunClub", "EventPlan", "TorontoGuide"

# Database connection (PlanetScale)
DATABASE_URL=mysql://user:password@host:port/database
# Or separate variables:
DB_HOST=host
DB_USER=user
DB_PASSWORD=password
DB_NAME=database
DB_PORT=3306
```

### Netlify Configuration

Add to `netlify.toml` or Netlify dashboard:
```toml
[build.environment]
  APP_NAME = "Kblog"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Implementation Steps for New Applications

### Step 1: Database Setup

1. Ensure the `app_events` table exists in your database
2. If using a shared database, the table should already exist
3. If using a separate database, run the schema creation SQL (see schema above)

### Step 2: Environment Configuration

1. Set `APP_NAME` environment variable to your application name
2. Configure database connection variables
3. Update API base URL in client-side code

### Step 3: Client-Side Implementation

1. **Copy and adapt `assets/js/analytics.js`:**
   - Update `SESSION_KEY` prefix (e.g., `gayrunclub_session_id`)
   - Update `getApiBaseUrl()` to point to your API endpoint
   - Update `getPageCategory()` to match your page structure
   - Adapt article/content selectors to match your HTML structure
   - Update event tracking logic for your content types

2. **Include the script in your HTML:**
   ```html
   <script src="assets/js/analytics.js"></script>
   ```

3. **Add data attributes to content elements:**
   ```html
   <article data-article-id="article-123" data-article-slug="my-article">
     <!-- content -->
   </article>
   ```

### Step 4: Server-Side Implementation

1. **Copy `netlify/functions/analytics-event.js`** (or equivalent serverless function)

2. **Copy `netlify/functions/utils.js`** helper functions:
   - `getAppName()`
   - `buildTelemetryPayload()`
   - `writeTelemetryToDatabase()`
   - Other utility functions as needed

3. **Set up API route:**
   - Netlify Functions: `/netlify/functions/analytics-event.js`
   - Express/Node: `/api/analytics/event`
   - Other frameworks: Adapt as needed

4. **Copy database client:**
   - Copy `lib/databaseClient.js` or adapt your existing database client
   - Ensure `db.appEvents.create()` method is available

### Step 5: Customize Event Types (Optional)

If your application needs different event types:

1. Update `ALLOWED_EVENT_TYPES` in `analytics-event.js`:
   ```javascript
   const ALLOWED_EVENT_TYPES = new Set([
     'page_view',
     'event_view',      // Custom event type
     'event_impression',
     'event_open',
     'event_read',
   ]);
   ```

2. Add validation logic in the switch statement
3. Update client-side tracking to send new event types

### Step 6: Testing

1. **Local Testing:**
   - Set `APP_NAME` environment variable
   - Run local server
   - Verify events are sent to API
   - Check database for inserted records

2. **Production Testing:**
   - Deploy with correct `APP_NAME`
   - Monitor function logs
   - Verify events in database
   - Check for errors in browser console

## Application-Specific Adaptations

### For GayRunClub (`/Users/kervinleacock/Documents/Development/gayrunclub/`)

**Content Types:**
- Events (runs, meetups)
- User profiles
- Routes/locations

**Suggested Event Types:**
- `page_view`
- `event_view` (when viewing an event page)
- `event_impression` (when event card becomes visible)
- `event_open` (when event card is clicked)
- `route_view` (when viewing a route)
- `profile_view` (when viewing a user profile)

**Page Categories:**
- `home`
- `events_list`
- `event_detail`
- `routes_list`
- `route_detail`
- `profile`
- `about`
- `contact`

### For EventPlan (`/Users/kervinleacock/Documents/Development/eventplan/`)

**Content Types:**
- Events
- Venues
- Organizers

**Suggested Event Types:**
- `page_view`
- `event_view`
- `event_impression`
- `event_open`
- `venue_view`
- `organizer_view`

**Page Categories:**
- `home`
- `events_list`
- `event_detail`
- `venues_list`
- `venue_detail`
- `organizer_detail`
- `create_event`
- `dashboard`

### For Toronto Guide (`https://to-guide.kervinapps.com/`)

**Content Types:**
- Locations/places
- Recommendations
- Categories

**Suggested Event Types:**
- `page_view`
- `location_view`
- `location_impression`
- `location_open`
- `category_view`

**Page Categories:**
- `home`
- `locations_list`
- `location_detail`
- `category_list`
- `category_detail`
- `search`
- `about`

## Data Querying Examples

### Query events for a specific app:
```sql
SELECT * FROM app_events 
WHERE app_name = 'GayRunClub' 
ORDER BY created_at DESC 
LIMIT 100;
```

### Query by event type:
```sql
SELECT * FROM app_events 
WHERE app_name = 'EventPlan' 
  AND event_type = 'event_view'
ORDER BY timestamp DESC;
```

### Query by session:
```sql
SELECT * FROM app_events 
WHERE app_name = 'TorontoGuide' 
  AND session_id = 'sess_1234567890_abc123'
ORDER BY timestamp ASC;
```

### Aggregate statistics:
```sql
SELECT 
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM app_events
WHERE app_name = 'Kblog'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY event_type
ORDER BY count DESC;
```

## Best Practices

1. **Session Management:**
   - Use sessionStorage (not localStorage) for session IDs
   - Generate unique session IDs per browser session
   - Handle cases where sessionStorage is unavailable

2. **Error Handling:**
   - Never block user experience due to telemetry failures
   - Log errors but don't show them to users
   - Use try-catch around all telemetry calls

3. **Performance:**
   - Use `navigator.sendBeacon()` for critical events (like clicks before navigation)
   - Debounce scroll events
   - Use Intersection Observer for impression tracking (more efficient than scroll listeners)

4. **Privacy:**
   - Don't track personally identifiable information (PII)
   - IP addresses are stored but can be anonymized
   - Consider GDPR/privacy compliance requirements

5. **Deduplication:**
   - Track sent impressions/reads in sessionStorage
   - Prevent duplicate events within the same session
   - Server-side validation provides additional protection

## Troubleshooting

### Events not appearing in database:
1. Check `APP_NAME` environment variable is set correctly
2. Verify database connection is working
3. Check function logs for errors
4. Verify API endpoint is accessible
5. Check browser console for client-side errors

### Duplicate events:
1. Verify sessionStorage is working
2. Check deduplication logic in client code
3. Ensure session IDs are consistent

### Performance issues:
1. Check database indexes are created
2. Monitor query performance
3. Consider batching events if volume is high
4. Review Intersection Observer thresholds

## Migration Checklist

For each new application:

- [ ] Database table `app_events` exists (or create it)
- [ ] `APP_NAME` environment variable configured
- [ ] Database connection configured
- [ ] Client-side `analytics.js` adapted and included
- [ ] Server-side API endpoint implemented
- [ ] Helper functions (`utils.js`) copied/adapted
- [ ] Database client configured
- [ ] Event types customized (if needed)
- [ ] Page categories defined
- [ ] Data attributes added to content elements
- [ ] Local testing completed
- [ ] Production deployment verified
- [ ] Events appearing in database
- [ ] Error handling verified

## Support Files Reference

**Kblog Implementation Files:**
- Client: `/assets/js/analytics.js`
- Server: `/netlify/functions/analytics-event.js`
- Utils: `/netlify/functions/utils.js`
- Database: `/lib/databaseClient.js`
- Schema: `/lib/schema-kblog.sql` (lines 75-100)

**Documentation:**
- Database Migration: `/docs/DATABASE_MIGRATION_INSTRUCTIONS.md` (lines 407-458)
- This guide: `/docs/TELEMETRY_IMPLEMENTATION_GUIDE.md`
