# Backup & Restore

Procedures to back up content and data, and to restore the site safely.

---

## What to back up
- `data/` (JSON datasets: `articles.json`, `authors.json`, `comments.json`, `newsletter.json`)
- `articles/` (per-article directories with `metadata.json`, `index.html`, `comments.json`, content html)
- `assets/images/articles/` (uploaded images)
- Netlify function configs (if customized) under `netlify/functions/`

Optional:
- `uploads/` if used as a temporary ingest directory

---

## Backup (local or server)
```bash
cd /Users/kervinleacock/Documents/Development/kblog
timestamp=$(date +%Y%m%d-%H%M%S)
tar czf backup-kblog-$timestamp.tgz \
  data/ \
  articles/ \
  assets/images/articles/ \
  netlify/functions/ 2>/dev/null || true
```

Consider storing the archive off-host (cloud bucket or drive).

---

## Restore
1) Stop API to prevent concurrent writes:
```bash
pkill -f "node server.js" || true
```

2) Extract the archive in project root:
```bash
tar xzf backup-kblog-<timestamp>.tgz
```

3) Verify integrity:
```bash
jq . data/articles.json >/dev/null
test -d articles && test -f articles/*/metadata.json
```

4) Restart:
```bash
NODE_ENV=${NODE_ENV:-development} node server.js
```

---

## Post-restore validation
- Homepage loads and lists expected articles
- Random article pages render, images present
- `GET /api/health` returns OK
- Optionally run the rebuild procedure from the Operations Guide if listing looks inconsistent

---

## Schedule & retention
- Suggested cadence: weekly full backup, plus ad-hoc before major changes
- Retention: 4–8 recent archives depending on storage




