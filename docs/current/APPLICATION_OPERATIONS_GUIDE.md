# Application Operations Guide (Install, Start, Restart, Recovery)

This guide provides a single source for installing, starting, restarting, and recovering the Kerv Talks-Data Blog application in both development and production.

---

## 1) Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (for local static server)
- Git (optional)

### Clone and install
```bash
cd /Users/kervinleacock/Documents/Development
git clone https://github.com/<your-org>/kblog.git
cd kblog
npm install
```

### Environment variables
At minimum set the Google Apps Script endpoint used by the newsletter/contact telemetry bridge.
```bash
export GS_DATA_PIPELINE_URL="https://script.google.com/macros/s/.../exec"
export NODE_ENV=development
```
Notes:
- In production, set `NODE_ENV=production`.
- You can also set `GOOGLE_APPS_SCRIPT_URL` if your server expects that name (the code supports either).

---

## 2) Start

The application is composed of:
- Express API: `server.js` (default port 1977)
- Static server: `static_server.py` (default port 1978) for local; Netlify/HTTP server in production

### Development (recommended)
Run both servers from the project root:
```bash
cd /Users/kervinleacock/Documents/Development/kblog
npm run both
```
Expected:
- Static server logs: `Serving at http://localhost:1978`
- API server logs:
  - `🚀 Kerv Talks-Data Blog API Server running on port 1977`
  - `📝 Article creation endpoint: http://localhost:1977/api/create-article`

Open the app:
```bash
open http://localhost:1978/index.html
```

Health check:
```bash
curl http://localhost:1977/api/health
# {"status":"OK","message":"Kerv Talks-Data Blog API is running"}
```

### Production (single host example)
```bash
cd /Users/kervinleacock/Documents/Development/kblog
npm install --omit=dev
export NODE_ENV=production
export GS_DATA_PIPELINE_URL="https://script.google.com/macros/s/.../exec"
node server.js
```
Serve static files via your web server or CDN (e.g., Netlify). Ensure your reverse proxy routes `/api/*` to the API server.

---

## 3) Restart

### Restart API only
```bash
pkill -f "node server.js" || true
NODE_ENV=${NODE_ENV:-development} node /Users/kervinleacock/Documents/Development/kblog/server.js
```

### Restart static server (local dev)
```bash
pkill -f "http.server 1978" || true
python3 /Users/kervinleacock/Documents/Development/kblog/static_server.py
```

### Validate after restart
```bash
curl http://localhost:1977/api/health
open http://localhost:1978/index.html
```

---

## 4) Recovery (Runbook)

Use these steps when the UI shows stale data, article metadata drifts, or after an interrupted write.

1. Freeze writers:
```bash
pkill -f "node server.js"
```

2. Snapshot state for forensics:
```bash
cp data/articles.json data/articles.json.bak.$(date +%s)
tar czf snapshot-articles-$(date +%s).tgz articles/
```

3. Rebuild `data/articles.json` from authoritative per-article metadata:
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

4. Purge orphaned artifacts (optional): remove any `*-content.html` files referenced only by stale entries.

5. Restart API:
```bash
NODE_ENV=${NODE_ENV:-development} node server.js
```

6. Verify:
- Homepage cards match each `articles/<slug>/metadata.json`
- API logs show `📝 Updated existing article in articles.json` on edits

Prevention:
- Avoid manual edits to `data/articles.json`. Use the API exclusively, or read-latest-then-write if scripting.

---

## 5) Common Checks & Commands

### Check ports
```bash
lsof -i :1977
lsof -i :1978
```

### Tail logs (example)
```bash
NODE_ENV=${NODE_ENV:-development} node server.js 2>&1 | tee api.log
```

### Health endpoints
```bash
curl http://localhost:1977/api/health
```

---

## 6) References
- `docs/application_master_documentation.md` (architecture, dependencies, and runbook details)
- `docs/integrations/*` (GA4 and Google Apps Script data pipeline)
- `netlify/functions/*` (Netlify functions for analytics/contact/newsletter)



