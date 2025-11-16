# Data Model Reference

Canonical JSON schemas and field contracts for site data. Use these as source of truth for producers (API) and consumers (frontend).

---

## articles.json
Container of article summaries for listing views.

```json
{
  "articles": [
    {
      "id": "string",                    // stable unique id
      "title": "string",
      "excerpt": "string",
      "author": {
        "name": "string",
        "avatar": "string",              // path to image
        "role": "string"
      },
      "published": "YYYY-MM-DD",
      "readTime": "string",              // e.g. "6 min read"
      "category": "string",
      "tags": ["string"],
      "image": "string",                 // filename or path
      "content": "string",               // path to slug-content.html
      "likes": 0,
      "comments": 0,
      "views": 0
    }
  ]
}
```

Constraints:
- `published` is date-only string.
- `content` points to generated HTML for preview/full rendering.
- Counters are non-negative integers.

---

## Per-article metadata.json
Authoritative record for an article under `articles/<slug>/metadata.json`.

```json
{
  "id": "string",
  "slug": "string",
  "title": "string",
  "excerpt": "string",
  "author": {
    "name": "string",
    "avatar": "string",
    "role": "string"
  },
  "published": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "readTime": "string",
  "category": "string",
  "tags": ["string"],
  "image": {
    "featured": "string",               // filename
    "alt": "string"
  },
  "content": "string",                  // path to slug-content.html
  "stats": {
    "likes": 0,
    "comments": 0,
    "views": 0
  }
}
```

Constraints:
- `published` is ISO 8601 datetime; listing reduces to date portion.
- `image.featured` may be empty; consumers should fallback to `<slug>.jpg` if available.

---

## comments.json (site-wide)
```json
{
  "comments": [
    {
      "id": "string",
      "articleId": "string",
      "author": "string",
      "message": "string",
      "createdAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "status": "approved"              // or "pending", "rejected"
    }
  ]
}
```

---

## authors.json
```json
{
  "authors": [
    {
      "id": "string",
      "name": "string",
      "role": "string",
      "avatar": "string",
      "bio": "string"
    }
  ]
}
```

---

## newsletter.json
Optional local store if Apps Script is down; primarily for fallback.
```json
{
  "subscribers": [
    {
      "email": "string",
      "sessionId": "string",
      "sourcePage": "string",
      "consent": true,
      "createdAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "deviceInfo": {}
    }
  ]
}
```

---

## Contract Guarantees
- Backward compatible additions: new optional properties are allowed.
- Breaking changes must bump a top-level `version` or be gated via feature flags.
- Counters are derived server-side; clients must not mutate persisted counts directly.



