# Security Guidelines

Baseline security practices for the site, API, uploads, and integrations.

---

## Secrets & Environment
- Store secrets in environment variables (never commit).
- Required: `GS_DATA_PIPELINE_URL` (or `GOOGLE_APPS_SCRIPT_URL`).
- Use `NODE_ENV=production` in production; avoid verbose logs in prod.

---

## CORS & Origins
- Allow only the production origin and localhost for development.
- Example (Express):
```javascript
app.use(cors({
  origin: ['https://kblog.kervinapps.com', 'http://localhost:1978']
}));
```

---

## File Uploads
- Accept only whitelisted types: `jpeg|jpg|png|gif|webp`.
- Enforce max size (e.g., 5 MB).
- Generate safe filenames (slug + timestamp), strip paths.
- Store under `assets/images/articles/` (no execution permission).

---

## Rate Limiting & Abuse
- Consider lightweight rate limits on `create-article`, `contact`, `newsletter`.
- Log anomalies and block abusive IPs if necessary.

---

## Input Validation
- Validate required fields server-side; reject on missing/invalid.
- Normalize arrays to strings when forwarding to Apps Script.
- Always JSON.stringify nested objects (device info).

---

## Transport & Headers
- Enforce HTTPS in production.
- Add basic headers:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (at minimum restrict inline scripts if feasible)

---

## Data & Privacy
- Collect only what you need (newsletter/contact + minimal telemetry).
- Document collected fields in Integrations and Data Model.
- Provide a simple process to remove a subscriber/contact entry upon request.

---

## Backups
- Follow `BACKUP_AND_RESTORE.md`. Keep archives off-host if possible.
- Verify restore periodically in a non-production environment.

---

## Operational Hygiene
- Keep dependencies current (monthly).
- Rotate Apps Script URL if redeployed; update env and redeploy API.
- Monitor logs for repeated write failures to `data/articles.json`.


