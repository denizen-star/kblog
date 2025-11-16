# What’s Next (Roadmap Recommendations)

Actionable, high‑impact next steps to strengthen Kblog across reliability, UX, and operations. Each item lists impact and effort to help you prioritize.

---

## 1) Quality & Testing
- Add smoke tests (scripted curl checks) for `/api/health`, homepage load, and a sample article.
  - Impact: High (prevents broken deployments); Effort: Low
- Document a manual release validation checklist (devices/browsers, article create flow, image upload).
  - Impact: Medium; Effort: Low

## 2) CI Enhancements
- Automate Netlify deploy previews for PRs; require preview check before merge.
  - Impact: Medium; Effort: Low
- Add a lightweight CI job to validate JSON (`jq`) and run link checks on docs.
  - Impact: Medium; Effort: Low

## 3) Monitoring & Analytics
- Instrument basic uptime checks for API and static site (e.g., UptimeRobot).
  - Impact: High; Effort: Low
- Expand GA4 with custom events: `article_view`, `newsletter_signup`, `contact_submit` with useful parameters.
  - Impact: Medium; Effort: Low

## 4) Search & Content UX
- Implement improved search with filters on `articles/index.html` (category, tags, date).
  - Impact: High (discoverability); Effort: Medium
- Add related articles widget on article pages (by tag/category).
  - Impact: Medium; Effort: Medium

## 5) Performance & Accessibility
- Optimize core images (WebP generation, widths, lazy loading review).
  - Impact: Medium‑High; Effort: Medium
- Add an accessibility pass (headings order, link names, contrast, focus states).
  - Impact: High; Effort: Low‑Medium

## 6) Security & Hardening
- Enforce uploads whitelist/size and safe filenames (verify in `server.js`).
  - Impact: High; Effort: Low
- Add rate limiting to `contact` and `newsletter` endpoints.
  - Impact: Medium; Effort: Low‑Medium
- Set security headers for static hosting (via Netlify or proxy).
  - Impact: Medium; Effort: Low

## 7) Backups & Data Integrity
- Automate weekly backups of `data/`, `articles/`, and images with timestamped archives.
  - Impact: High; Effort: Low
- Quarterly restore test in a dev environment to verify procedures.
  - Impact: Medium; Effort: Low

## 8) Editorial Workflow
- Add image style guidance (dimensions, aspect ratios, compression targets) to `ARTICLE_MANAGEMENT.md`.
  - Impact: Medium; Effort: Low
- Provide a “content checklist” (title length, excerpt, tags, alt text, OG tags).
  - Impact: Medium; Effort: Low

## 9) Road to Authentication (Optional)
- Gate authoring routes with simple password or token while planning full auth.
  - Impact: Medium; Effort: Low
- Draft future auth plan (roles for editor/admin; server‑side checks).
  - Impact: Medium; Effort: Low

## 10) Documentation Hygiene
- Add `.github/PULL_REQUEST_TEMPLATE.md` prompting tests, docs links, and release notes.
  - Impact: Medium; Effort: Low
- Start `CHANGELOG.md` and update per release/tag.
  - Impact: Medium; Effort: Low

---

## Suggested Next 2‑Week Plan
1. CI: JSON/link validation + Netlify previews; add PR template (Sections 2, 10)
2. Reliability: Uptime checks + backup automation (Sections 3, 7)
3. Security: Uploads whitelist/size + minimal rate limiting (Section 6)
4. UX: Improved search filters + related posts (Sections 4, 5 improvements as time permits)

References:
- `current/APPLICATION_OPERATIONS_GUIDE.md`
- `current/SECURITY_GUIDELINES.md`
- `current/BACKUP_AND_RESTORE.md`
- `current/VERSION_CONTROL_AND_CICD.md`


