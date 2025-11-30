# API Contracts (server.js)

Authoritative request/response contracts for public endpoints. Status codes and error formats are standardized.

---

## Health
GET `/api/health`
Response:
```json
{ "status": "OK", "message": "Kerv Talks-Data Blog API is running" }
```

---

## Create Article
POST `/api/create-article`
Content-Type: `multipart/form-data`

Fields:
- `title` (string, required)
- `excerpt` (string, optional)
- `authorName` (string, required)
- `authorAvatar` (file or path, optional)
- `authorRole` (string, optional)
- `category` (string, required)
- `tags` (string; comma- or semicolon-separated)
- `readTime` (string, e.g. "6 min read")
- `contentHtml` (string; HTML body)
- `featuredImage` (file; optional)

Success 200:
```json
{ "ok": true, "slug": "my-article-slug", "id": "uuid" }
```
Error 400/500:
```json
{ "ok": false, "error": "ValidationError|InternalError", "message": "..." }
```

Notes:
- On success, server writes `articles/<slug>/*` and updates `data/articles.json`.

---

## Newsletter Subscribe
POST `/api/newsletter/subscribe`
Content-Type: `application/json`

Body:
```json
{
  "email": "user@example.com",
  "sessionId": "string",
  "sourcePage": "string",
  "consent": true,
  "deviceInfo": { }
}
```

Success 200:
```json
{ "ok": true }
```
Failure 502 (Apps Script) or 500:
```json
{ "ok": false, "error": "UpstreamError|InternalError", "message": "..." }
```

---

## Contact Submit
POST `/api/contact/submit`
Content-Type: `application/json`

Body:
```json
{
  "name": "string",
  "email": "string",
  "organization": "string",
  "role": "string",
  "subject": "string",
  "message": "string",
  "sessionId": "string",
  "deviceInfo": { },
  "pageUrl": "string"
}
```

Success 200:
```json
{ "ok": true }
```
Failure 400/502/500:
```json
{ "ok": false, "error": "ValidationError|UpstreamError|InternalError", "message": "..." }
```

---

## Article Stats (example)
POST `/api/articles/:slug/stats`
Content-Type: `application/json`

Body:
```json
{ "views": 1, "likes": 0, "comments": 0 }
```

Success 200:
```json
{ "ok": true, "slug": "slug" }
```
Failure:
```json
{ "ok": false, "error": "NotFound|InternalError", "message": "..." }
```

---

## Error format (standard)
All non-2xx responses include:
```json
{ "ok": false, "error": "ErrorCode", "message": "Human readable" }
```

---

## Versioning
- Non-breaking additions are permitted.
- Breaking changes require a new route or explicit versioning segment (e.g., `/api/v2/...`).




