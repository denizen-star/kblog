# Version Control & CI/CD Practices

Standards for Git workflow, commit hygiene, branching, releases, and CI/CD for Kblog.

---

## Git Repository Standards
- Default branch: `main`
- Protected branches: `main` (require PR, reviews optional for solo dev)
- Commit early, commit small; one logical change per commit

### Commit messages
Conventional format (recommended):
```
<type>(scope): short summary

body (optional) explaining what/why, not how
```
Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `chore`, `test`

Examples:
- `feat(api): add newsletter subscribe endpoint`
- `fix(articles): prevent duplicate slug creation`
- `docs(ops): add recovery steps to operations guide`

### Branching
- Feature: `feature/<short-topic>`
- Fix: `fix/<ticket-or-bug>`
- Docs: `docs/<topic>`
- Release prep (optional): `release/<version>`

Flow:
1. Branch from `main`
2. Commit changes with conventional messages
3. Open PR to `main` (self-review acceptable for solo development)
4. Squash-merge with a descriptive title

### Tags & releases
- Tag releases as `vMAJOR.MINOR.PATCH` (e.g., `v1.2.0`)
- Keep `CHANGELOG.md` or use GitHub Releases notes

---

## CI/CD Overview
Kblog is a static-first site with a Node/Express API. Recommended delivery:
- Static site: Netlify (auto-deploy on push to `main`)
- API server: manual or scripted deploy (until automated), environment-aware via `NODE_ENV` and Apps Script URL

### Static site (Netlify)
- Connect repository and set build: none (static), publish directory: repo root (or specific if using build pipeline)
- Configure domain and redirects via `netlify.toml`
- Preview deploys from PRs (optional)

### API deployment
Options:
- Same host as static via reverse proxy (as in docs)
- Separate Node host (VPS or PaaS)

Minimal deploy script:
```bash
#!/usr/bin/env bash
set -euo pipefail
DIR=/Users/kervinleacock/Documents/Development/kblog
cd "$DIR"
npm install --omit=dev
export NODE_ENV=production
export GS_DATA_PIPELINE_URL="https://script.google.com/macros/s/.../exec"
pm2 delete kblog-api || true
pm2 start server.js --name kblog-api
pm2 save
```

Notes:
- Use a process manager (e.g., `pm2`) for uptime and log rotation
- Keep the static site on Netlify for CDN performance and simplicity

---

## PR & Review Checklist
- Tests or manual validation steps included (when applicable)
- Docs updated if behavior changes (`current/` or `integrations/`)
- No secrets committed; `.env` and sensitive files excluded
- Lint warnings addressed

---

## Environments & Config
- Development: localhost (ports 1977/1978), debug enabled
- Production: `kblog.kervinapps.com`, debug disabled
- Secrets: `GS_DATA_PIPELINE_URL` (or `GOOGLE_APPS_SCRIPT_URL`), set in environment on the API host

See:
- `current/APPLICATION_OPERATIONS_GUIDE.md`
- `current/SECURITY_GUIDELINES.md`
- `docs/integrations/*`


