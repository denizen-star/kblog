# Telemetry System - Quick Start Guide

## System Overview

Kblog uses a **shared database table** (`app_events`) to track telemetry across multiple applications. Each app identifies itself via the `app_name` column.

## Core Architecture

```
Client (analytics.js) → API Endpoint → Database (app_events table)
```

**Key Components:**
1. **Client-side**: `assets/js/analytics.js` - Tracks user interactions
2. **Server-side**: `netlify/functions/analytics-event.js` - Validates and stores events
3. **Database**: `app_events` table (shared across all apps)
4. **Helpers**: `netlify/functions/utils.js` - Utility functions

## Database Schema

```sql
CREATE TABLE app_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app_name VARCHAR(100) NOT NULL,        -- Your app identifier
  timestamp TIMESTAMP NOT NULL,
  session_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,      -- page_view, article_view, etc.
  page_category VARCHAR(255),            -- home, article, contact, etc.
  page_url TEXT,
  article_id VARCHAR(255),               -- Content ID (adapt to your content type)
  article_slug VARCHAR(255),
  article_context VARCHAR(255),
  depth_percent INT,
  referrer TEXT,
  device_info JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_app_name (app_name),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  INDEX idx_session_id (session_id)
);
```

## Required Environment Variable

```bash
APP_NAME=YourAppName  # e.g., "GayRunClub", "EventPlan", "TorontoGuide"
```

## Implementation Steps

### 1. Copy Core Files

From Kblog, copy these files to your application:

- `assets/js/analytics.js` → Adapt for your app
- `netlify/functions/analytics-event.js` → Keep as-is (or adapt for your server)
- `netlify/functions/utils.js` → Keep as-is
- `lib/databaseClient.js` → Adapt database connection if needed

### 2. Adapt Client-Side Code (`analytics.js`)

**Change these values:**

```javascript
// 1. Update session key prefix
const SESSION_KEY = 'your_app_session_id';  // Change from 'kblog_session_id'

// 2. Update API base URL
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:YOUR_PORT' : 'https://your-domain.com';
};

// 3. Update page categories to match your app
const getPageCategory = () => {
  const path = window.location.pathname || '';
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/events/')) return 'event_detail';
  if (path.startsWith('/events')) return 'events_list';
  // Add your page categories...
  return 'other';
};

// 4. Update content selectors (if tracking content impressions)
const tiles = Array.from(document.querySelectorAll('.your-content-card, .your-article-item'));
```

### 3. Set Up API Endpoint

**For Netlify Functions:**
- Copy `netlify/functions/analytics-event.js` as-is
- Ensure route is `/api/analytics/event`

**For Other Frameworks:**
- Create POST endpoint at `/api/analytics/event`
- Use same validation logic from `analytics-event.js`
- Call `writeTelemetryToDatabase()` from utils

### 4. Configure Database

Ensure your database client has:
```javascript
db.appEvents.create(eventData)  // Insert event
```

See `lib/databaseClient.js` lines 449-498 for reference implementation.

### 5. Include Script in HTML

```html
<script src="assets/js/analytics.js"></script>
```

### 6. Add Data Attributes to Content

For content tracking, add attributes:
```html
<div class="event-card" data-article-id="event-123" data-article-slug="summer-run">
  <!-- content -->
</div>
```

## Event Types

**Standard Events:**
- `page_view` - Page load
- `article_view` - Content page viewed (adapt name: `event_view`, `location_view`, etc.)
- `article_impression` - Content card becomes visible
- `article_open` - Content card clicked
- `article_read` - User scrolls to 75% depth

**To add custom event types:**
1. Add to `ALLOWED_EVENT_TYPES` in `analytics-event.js`
2. Add validation in switch statement
3. Update client-side tracking

## Event Payload Example

```javascript
{
  sessionId: "sess_1234567890_abc123",
  eventType: "page_view",
  pageUrl: "https://yourapp.com/events",
  referrer: "https://google.com",
  pageCategory: "events_list",
  deviceInfo: {
    userAgent: "...",
    language: "en-US",
    timezone: "America/Toronto",
    screenResolution: "1920x1080"
  }
}
```

## Testing Checklist

- [ ] `APP_NAME` environment variable set
- [ ] Database connection working
- [ ] API endpoint accessible
- [ ] Client script loaded in browser
- [ ] Events appearing in `app_events` table
- [ ] `app_name` column matches your `APP_NAME`
- [ ] No console errors

## Quick Test

1. Open browser console
2. Navigate your site
3. Check for `[analytics]` debug logs
4. Query database:
   ```sql
   SELECT * FROM app_events 
   WHERE app_name = 'YourAppName' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

## Application-Specific Notes

### GayRunClub
- Content type: Events, Routes, Profiles
- Event types: `event_view`, `route_view`, `profile_view`
- Page categories: `events_list`, `event_detail`, `routes_list`, `route_detail`, `profile`

### EventPlan
- Content type: Events, Venues, Organizers
- Event types: `event_view`, `venue_view`, `organizer_view`
- Page categories: `events_list`, `event_detail`, `venues_list`, `venue_detail`, `dashboard`

### Toronto Guide
- Content type: Locations, Recommendations
- Event types: `location_view`, `category_view`
- Page categories: `locations_list`, `location_detail`, `category_list`, `category_detail`, `search`

## Common Issues

**Events not saving:**
- Check `APP_NAME` matches database `app_name`
- Verify database connection
- Check function logs for errors

**Duplicate events:**
- Verify sessionStorage is working
- Check deduplication logic

**Performance:**
- Ensure database indexes exist
- Use Intersection Observer (already implemented)

## Full Documentation

See `/docs/TELEMETRY_IMPLEMENTATION_GUIDE.md` for complete details.
