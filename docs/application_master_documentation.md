# Application Master Documentation

Welcome to the authoritative reference for AI agents supporting the Kerv Talks-Data Blog platform. This guide covers system architecture, operations, dependencies, incident response, and documentation governance so each topic can be answered without additional context.

# Table of Contents (Automatically generated based on the document structure below)
- [1. Core Application Architecture and Module Inventory](#1-core-application-architecture-and-module-inventory)
- [2. Operational Control: Starting and Restarting](#2-operational-control-starting-and-restarting)
  - [2.1. Full Application Startup Procedure](#21-full-application-startup-procedure)
  - [2.2. Module-Specific Restart Procedures](#22-module-specific-restart-procedures)
- [3. Dependency Mapping and Reusability](#3-dependency-mapping-and-reusability)
  - [3.1. Inter-Module Dependencies](#31-inter-module-dependencies)
  - [3.2. Code Classification: Custom vs. Reusable](#32-code-classification-custom-vs-reusable)
- [4. Anomaly and Troubleshooting Runbook (Agent Escalation Prevention)](#4-anomaly-and-troubleshooting-runbook-agent-escalation-prevention)
- [5. Documentation Maintenance and Obsolescence](#5-documentation-maintenance-and-obsolescence)

# 1. Core Application Architecture and Module Inventory

**High-level topology.** The platform is a static-first publishing stack augmented by a JSON-backed API. Static assets are served from Netlify or a local Python HTTP server, while article creation, newsletter capture, and contact workflows flow through a Node.js Express API (`@server.js`). Supporting scripts enrich the browser runtime with search, article rendering, and rich editor behavior.

| Module | Primary Function | Core Dependencies |
| --- | --- | --- |
| **ExpressApiServer** (`@server.js`) | Serves REST endpoints for article creation, article/stat retrieval, newsletter subscriptions, and contact submissions; persists artifacts to disk in `articles/` and `data/`. | Internal: `@lib/googleSheetsClient.js`, filesystem (`articles/`, `assets/images/articles/`, `data/`). External: `express`, `multer`, `cors`, `node-fetch` (via dynamic import). |
| **GoogleSheetsDataBridge** (`@lib/googleSheetsClient.js`) | Submits structured payloads (newsletter/contact) to an Apps Script endpoint to mirror data in Google Sheets. | External: `node-fetch` (lazy import). Environment variables `GOOGLE_APPS_SCRIPT_URL` or `GS_DATA_PIPELINE_URL`. |
| **StaticDeliveryService** (`@static_server.py`, `netlify.toml`) | Hosts compiled HTML/CSS/JS and JSON datasets. In local dev uses Python `http.server`; in production uses Netlify with SPA-friendly redirects and caching headers. | External: Python ≥3.10 (local), Netlify CDN (production). |
| **PythonApiServer (Utility)** (`@api_server.py`) | Drop-in alternative API server with equivalent endpoints, used for experiments or non-Node environments. Mirrors Express server behaviors, including file persistence and logging. | External: Python standard library (`http.server`, `cgi`). Internal: same filesystem layout as Express API. |
| **BlogConfig** (`@assets/js/config.js`) | Detects runtime environment (localhost vs. production) and exposes API/static base URLs plus feature flags to all front-end modules. | Internal: global `window.blogConfig`. External: browser `window.location`. |
| **BlogManager Runtime** (`@assets/js/main.js`) | Core front-end controller that loads `data/articles.json`, `data/comments.json`, `data/authors.json`, renders homepage cards, wires search, comments, and post composer widgets. | Internal: `SearchManager`, `CommentsManager`, `ImageUploadManager`, `PostManager` classes in same file; relies on `BlogConfig` for URLs. External: DOM APIs `fetch`, `localStorage`-free. |
| **ArticlesPageManager** (`@assets/js/articles.js`) | Manages `/articles/index.html` listing with pagination, category and sort filters, and shared search integration. | Internal: `BlogConfig` for data URLs. External: DOM APIs. |
| **ArticlePageManager** (`@assets/js/article.js`) | Powers individual article pages, syncing metadata, meta tags, view counters, and newsletter form submissions. | Internal: fetches `../../data/articles.json`, interacts with `BlogManager` UI conventions. |
| **ArticleEditor** (`@assets/js/article-editor.js`) | Provides rich-text editing, media upload logic, and calls `window.blogConfig.createArticleUrl` to push articles via the API. | Internal: `BlogConfig`; optional `featuredImage` upload uses `FormData`. External: browser `document.execCommand`, `fetch`. |
| **NewsletterSubscription System** (`@assets/js/newsletter.js`) | Captures newsletter signups across the site, augmenting submissions with session and device telemetry before forwarding to `/api/newsletter/subscribe`. | Internal: `SessionManager`, `DeviceMetadataCollector`. External: browser APIs (`navigator`, `performance`). |
| **ContactSubmissionGateway** (`@assets/js/contact.js`) | Enhances `contact.html` form by enriching payloads with telemetry and posting to `/api/contact/submit`. Falls back to local telemetry stubs if session device collectors are absent. | Internal: optional reuse of `SessionManager` and `DeviceMetadataCollector`. External: `fetch`. |
| **Data Store** (`/data/*.json`, article directories under `articles/`) | Canonical JSON metadata for articles, authors, comments, newsletter subscribers; individual article folders contain `index.html`, `metadata.json`, and `comments.json`. | Internal: mutated by API servers and read by front-end. External: manual edits via agents/scripts. |

# 2. Operational Control: Starting and Restarting

Operational control is centered on orchestrating the static server (for HTML/JS/CSS), the Express API, and environment variables required for telemetry forwarding.

## 2.1. Full Application Startup Procedure

1. **Prepare environment variables.** At minimum export the Google Sheets endpoint (replace with real URL) and optional production flag:
   ```bash
   export GOOGLE_APPS_SCRIPT_URL="https://script.google.com/.../exec"
   export NODE_ENV=development
   ```
2. **Install dependencies once per checkout.**
   ```bash
   cd /Users/kervinleacock/Documents/Development/kblog
   npm install
   ```
3. **Launch both servers in tandem (preferred).** Runs the Express API on port 1977 and the Python static server on port 1978.
   ```bash
   npm run both
   ```
   Expected startup sequence:
   - `python3 -m http.server 1978` (via `npm run static`) logs `Serving at http://localhost:1978`.
   - `node server.js` logs:
     - `🚀 Kerv Talks-Data Blog API Server running on port 1977`
     - `📝 Article creation endpoint: http://localhost:1977/api/create-article`
     - Subsequent requests emit `📝 Added new article to articles.json`, `📧 Newsletter subscription saved: ...`, etc.
4. **Access the application.** Visit `http://localhost:1978/index.html`; `@assets/js/config.js` detects development mode and enables admin UI elements.
5. **Verify readiness.**
   ```bash
   curl http://localhost:1977/api/health
   ```
   Expect `{"status":"OK","message":"Kerv Talks-Data Blog API is running"}` confirming API health.

For production, deploy static assets via Netlify (honoring `netlify.toml`) and run `NODE_ENV=production node server.js` behind an HTTPS reverse proxy, ensuring `GOOGLE_APPS_SCRIPT_URL` or `GS_DATA_PIPELINE_URL` is set.

## 2.2. Module-Specific Restart Procedures

- **ExpressApiServer (`@server.js`).**
  1. Stop existing process (`Ctrl+C` in the API terminal or `pkill -f "node server.js"`).
  2. Restart with environment flags:
     ```bash
     NODE_ENV=${NODE_ENV:-development} node /Users/kervinleacock/Documents/Development/kblog/server.js
     ```
  3. Watch logs for startup banners and the first request traces.

- **StaticDeliveryService (local Python).**
  1. Terminate the running server (`Ctrl+C` or `pkill -f "http.server 1978"`).
  2. Relaunch:
     ```bash
     python3 /Users/kervinleacock/Documents/Development/kblog/static_server.py
     ```
  3. Confirm `Serving at http://localhost:1978` reappears before refreshing the browser.

- **Newsletter/Contact telemetry (config update only).** If `GOOGLE_APPS_SCRIPT_URL` changes, restart only the Express API to pick up the new environment variable; front-end modules consume the updated endpoint automatically via `@assets/js/config.js`.

- **Frontend runtime hot-refresh.** Because assets are static, rebuilding is unnecessary; modifying any file under `assets/js/` or HTML only requires browser reload once the static server is running.

# 3. Dependency Mapping and Reusability

## 3.1. Inter-Module Dependencies

| Source Module | Depends On | Interaction | Dependency Type |
| --- | --- | --- | --- |
| `ArticleEditor` (`@assets/js/article-editor.js`) | `ExpressApiServer` (`@server.js`) | Posts multipart payloads to `/api/create-article`; expects JSON success to redirect to new article. | **Hard** – failure blocks article publishing. |
| `ExpressApiServer` (`@server.js`) | Filesystem (`articles/`, `data/`), `GoogleSheetsDataBridge` | Writes article HTML/JSON and newsletter/contact entries; forwards telemetry to Google Sheets. | Filesystem **Hard** (write failure aborts request); Google Sheets **Soft** (errors are logged but do not abort success responses). |
| `BlogManager` (`@assets/js/main.js`) | `data/articles.json`, `data/comments.json`, `data/authors.json` | Fetches datasets to render homepage and comments. | **Soft** – failures log errors and display empty-state messaging; UI remains functional. |
| `ArticlesPageManager` (`@assets/js/articles.js`) | `data/articles.json` | Populates paginated article grid. | **Soft** – empty grids render with “No articles found.” |
| `ArticlePageManager` (`@assets/js/article.js`) | `data/articles.json`, DOM `#featured-image` | Enhances article page metadata and view counters. | **Soft** – gracefully handles missing assets by hiding images. |
| `NewsletterSubscription` (`@assets/js/newsletter.js`) | `/api/newsletter/subscribe`, `SessionManager`, `DeviceMetadataCollector` | Sends JSON telemetry to API; optional GA tracking. | API **Hard** for success; telemetry builders **Soft** (falls back if unavailable). |
| `ContactSubmissionGateway` (`@assets/js/contact.js`) | `/api/contact/submit`, telemetry helpers | Sends enriched contact payloads; reuses session/device collectors when present. | API **Hard**; telemetry helpers **Soft**. |
| `StaticDeliveryService` | Built assets (`index.html`, `assets/`, `data/`) | Serves the front-end bundle referenced by all clients. | **Hard** – without static hosting the app is inaccessible. |

Execution order for article creation: `ArticleEditor` → `ExpressApiServer` → filesystem writes to `articles/<slug>/` & `data/articles.json` → front-end `BlogManager` refetch or manual refresh to pick up changes.

## 3.2. Code Classification: Custom vs. Reusable

**Principle.** Custom page code is responsible solely for unique viewport behavior (layout scaffolding, page-specific event wiring). Reusable code encapsulates shared business logic, API integrations, and utilities consumed across pages. Prefer augmenting reusable modules before duplicating logic in page scripts.

- **Reusable code patterns.**
  - `@assets/js/config.js` – global environment + feature flags.
  - Shared runtime classes in `@assets/js/main.js` (e.g., `SearchManager`, `CommentsManager`, `ImageUploadManager`, `PostManager`).
  - Telemetry helpers in `@assets/js/newsletter.js` (`SessionManager`, `DeviceMetadataCollector`).
  - Server-side utilities `@lib/googleSheetsClient.js`, helper functions inside `@server.js` (`generateSlug`, `updateArticlesJSON`, etc.).
  - Data schemas in `@data/*.json` that front-end modules consume uniformly.

- **Custom page code patterns.**
  - `@index.html`, `@articles/index.html`, `@articles/create/index.html`, `@contact.html`, `@about.html` inline scripts and structural markup specific to each page.
  - Page-enhancement scripts: `@assets/js/articles.js`, `@assets/js/article.js`, `@assets/js/article-editor.js`, `@assets/js/contact.js` tailor UI flows to dedicated views.

When authoring new functionality, place cross-cutting logic under `assets/js/` shared classes or `lib/` server utilities, and limit page-specific code to DOM orchestration to maintain maintainability.

# 4. Anomaly and Troubleshooting Runbook (Agent Escalation Prevention)

**Scenario: “Marching Hallucinations” (data drift / scoring corruption).** Article cards display outdated excerpts or mismatched stats despite correct `articles/<slug>/metadata.json`, typically after rapid successive edits of the same slug.

- **Symptom / Indicator.**
  - Homepage cards show stale excerpts or duplicated avatars cycling in order, giving the appearance that article data is “marching” through incorrect states.
  - `@server.js` log stream shows repeated `📝 Added new article to articles.json` entries for the same slug without the corresponding `📝 Updated existing article in articles.json` message.
  - `data/articles.json` contains entries whose `content` fields reference `slug-content.html` artifacts that no longer exist, while `articles/<slug>/metadata.json` is accurate.
  - Newsletter/contact logs remain normal (issue isolated to article content).

- **Root Cause Analysis.**
  - Concurrent writes: The Express API writes fresh metadata while a manual edit or external script simultaneously modifies `data/articles.json`. Because `updateArticlesJSON` rewrites the entire list, a stale in-memory copy can reintroduce previous excerpts, producing deterministic but incorrect swings—hence the “marching” appearance.
  - The stat updater (`POST /api/articles/:slug/stats`) can exacerbate drift by rehydrating an outdated article snapshot if invoked between conflicting writes.

- **Mitigation / Resolution Plan.**
  1. **Freeze writers.** Stop the Express API to prevent further file mutations:
     ```bash
     pkill -f "node server.js"
     ```
  2. **Snapshot current state.** Copy `data/articles.json` and the affected `articles/<slug>/metadata.json` files to a safe location for forensics.
  3. **Rebuild authoritative dataset.** For each affected slug:
     - Trust `articles/<slug>/metadata.json` as source of truth.
     - Reconstruct the list by concatenating metadata files (Python one-liner example):
       ```bash
       python3 - <<'PY'
       import json, pathlib
       root = pathlib.Path('articles')
       articles = []
       for metadata in root.glob('*/metadata.json'):
           with metadata.open() as fh:
               data = json.load(fh)
               articles.append({
                   "id": data["id"],
                   "title": data["title"],
                   "excerpt": data.get("excerpt", ""),
                   "author": {
                       "name": data["author"]["name"],
                       "avatar": data["author"]["avatar"],
                       "role": data["author"]["role"]
                   },
                   "published": data["published"].split('T')[0],
                   "readTime": data["readTime"],
                   "category": data["category"],
                   "tags": data["tags"],
                   "image": data["image"]["featured"] or f"{data['slug']}.jpg",
                   "content": data["content"],
                   "likes": data["stats"]["likes"],
                   "comments": data["stats"]["comments"],
                   "views": data["stats"]["views"]
               })
       json.dump({"articles": sorted(articles, key=lambda a: a["published"], reverse=True)}, open('data/articles.json', 'w'), indent=2)
       PY
       ```
  4. **Purge stale caches.** Delete any orphaned `*-content.html` artifacts referenced only in drifted `data/articles.json` entries.
  5. **Restart API.**
     ```bash
     NODE_ENV=${NODE_ENV:-development} node server.js
     ```
  6. **Verify recovery.** Refresh homepage and ensure card data matches `metadata.json`; tail logs for expected `📝 Updated existing article in articles.json` messages on subsequent edits.
  7. **Prevent recurrence.** Coordinate article edits through the API only; avoid manual `data/articles.json` touches or ensure scripts read the latest file from disk immediately before writing.

# 5. Documentation Maintenance and Obsolescence

- **Deprecated references to ignore.**
  - `@docs/DEPLOYMENT_GUIDE.md` – superseded by `@docs/current/DEPLOYMENT_GUIDE.md` and this master document.
  - `@docs/ENVIRONMENT_CONFIGURATION.md` – content merged into Sections 1 and 3; retain only for historical context.
  - Entire `@docs/archive/` directory – legacy research and prior architecture notes; do not rely on them for current operations.
  - `@docs/DEPLOYMENT_INSTRUCTIONS.md` (root-level) – Netlify workflow now governed by `@docs/current/DEPLOYMENT_GUIDE.md`.

- **Updating this master document.**
  1. Branch or create a workspace checkpoint.
  2. Edit `@docs/application_master_documentation.md`, keeping the mandated heading structure intact.
  3. Run applicable tests or manual verifications (e.g., re-run affected commands) if procedural steps change.
  4. Submit changes via pull request or approved deployment workflow, noting impacted modules and validation evidence.
