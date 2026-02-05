# Lessons Learned: OG Link Preview Implementation (Reverted)

This document explains what went wrong when implementing Open Graph link previews (thumbnail image + description) for kblog article URLs, so the same mistakes are not repeated.

---

## What Was Attempted

- Add per-article link previews so that when an article URL is shared (e.g. in chat, social), crawlers see:
  - **Thumbnail:** The article’s featured image, or a site default.
  - **Description:** `Title: Excerpt` (e.g. "The Diamond Rule...: A few years ago, I sat in a QBR...").
- Implementation followed a pattern from another app: rewrite article URLs to a serverless function that fetches article metadata, injects `og:image`, `og:title`, `og:description` (and Twitter Card meta) into the SPA shell HTML, and returns it so crawlers get the right meta while the same HTML still loads for real users.

---

## How Article Loads Were Broken

### Root cause: redirect + relative URLs

1. **Redirect**  
   All requests to `/articles/*` were rewritten to a Netlify function that returns the **same** `articles/index.html` shell (with meta injected when a slug was present).

2. **Relative asset URLs in that shell**  
   The shell used relative paths for assets, e.g.:
   - `../assets/js/nav.js`
   - `../assets/css/main.css`
   - `../assets/images/...`

3. **How the browser resolves them**  
   When the document URL is `https://site.com/articles/some-article-slug/`, the browser resolves:
   - `../assets/js/nav.js` → `https://site.com/articles/assets/js/nav.js`

4. **What actually got served**  
   A request to `/articles/assets/js/nav.js` still matched the redirect rule `/articles/*`, so it was sent to the **same function**. The function returned **HTML** (the shell), not the JavaScript file.

5. **Result**  
   The browser tried to parse that HTML as JavaScript → **"Uncaught SyntaxError: Unexpected token '<'"** in `nav.js`, `config.js`, `main.js`, `analytics.js`. Scripts failed, so the app could not load articles correctly. The same mechanism caused CSS and images to be replaced by HTML, so layout broke and images showed as blue placeholders or failed to load.

### Why “fix” redirects were fragile

- A redirect was added so `/articles/assets/*` → `/assets/:splat`. That only works when the document URL has **one** segment after `/articles/` (e.g. `/articles/slug/`), so `../assets` becomes `/articles/assets/`.
- When the user navigated in a way that produced **two** segments (e.g. `/articles/slug1/slug2/`), `../assets` became `/articles/slug1/assets/...`, which did **not** match `/articles/assets/*`. So JS/CSS again hit the function and broke.
- Fixing that required either more redirects for every path depth or changing the shell to **root-relative** URLs (`/assets/...`) from the start. The implementation did not use root-relative URLs initially, so the app stayed fragile and broke again when URL depth changed.

### Takeaway

- Rewriting **every** `/articles/*` request to a function is unsafe if the same HTML is used for the “page” and that HTML references **relative** assets. Any relative path that resolves under `/articles/...` will be sent back to the function and get HTML instead of the real asset.
- If you do use a function for the shell, the HTML it serves **must** use only **root-relative** (or absolute) URLs for assets and key navigations (e.g. `/assets/...`, `/articles/...`, `/`) so that asset and navigation requests never go through the function.

---

## Why the Preview Image Never Displayed

- **Preview text (title + description)** was correct: the function injected the right `og:title` and `og:description` (e.g. "Title: Excerpt"), and crawlers that received the injected HTML would have seen that.
- **Preview image** did not show in the user’s environment. Likely reasons:
  1. **Caching** – Platforms cache link previews. Old previews (without image or with wrong meta) may have been shown until a rescrape (e.g. Facebook Sharing Debugger, LinkedIn Post Inspector) was run and even then can take time to update.
  2. **Domain / absolute URL** – Static HTML and some meta used a fixed domain (e.g. `kervtalksdata.com`) while the live site was `kblog.kervinapps.com`. If `og:image` pointed at the wrong domain or path, or that URL was not reachable from the crawler, the image would not display.
  3. **Image URL not reachable** – Crawlers must be able to GET the `og:image` URL. If the image was behind redirects, wrong path, or returned HTML/404, the preview image would fail.
  4. **No end-to-end check** – The implementation was not validated by actually sharing a link and checking the preview on the target platform (or via their debugger) on the **deployed** URL, so image issues were not caught before release.

### Takeaway

- For link previews, confirm the **exact** `og:image` URL that will be in the final HTML (including scheme and host) and that that URL returns the image (200, correct `Content-Type`) when requested by a crawler.
- Use the platform’s preview debugger (e.g. Facebook, LinkedIn) on the **real** deployment URL and rescrape after changes; do not assume meta is correct without that check.
- If the site is served from multiple domains, either generate `og:image` (and other absolute URLs) from the request host or ensure a single canonical domain for meta.

---

## Summary

| Area | Mistake | Lesson |
|------|--------|--------|
| Article loads | Rewrote all `/articles/*` to a function while the shell used relative asset URLs, so JS/CSS/image requests under `/articles/...` received HTML and broke. | Do not send all `/articles/*` to a function unless the shell uses **root-relative** (or absolute) URLs for all assets and main links so those requests never hit the function. |
| “Fixes” | Added redirects for `/articles/assets/*` only; when URL had an extra segment, `../assets` no longer matched and the app broke again. | Fix the **source** (URLs in HTML/JS) so behavior does not depend on path depth; use root-relative from the start. |
| Preview image | Preview text worked; image did not show. No verification on deployed URL; possible wrong domain, caching, or unreachable image URL. | Validate preview (including image) on the live URL with the platform’s debugger; ensure `og:image` is an absolute, crawler-reachable URL. |

---

## If You Try Again

1. **Option A – Keep current routing**  
   Do **not** rewrite `/articles/*` to a function. Keep serving the existing SPA (e.g. `articles/index.html`) and ensure each **article** page’s meta is set correctly. That likely means either:
   - Pre-rendering or building static HTML per article (with correct meta) and serving that for article URLs, or
   - Another mechanism that does not send **asset** requests (e.g. `/articles/.../anything`) to a handler that returns HTML.

2. **Option B – Function returns the shell**  
   If you do use a function for article URLs:
   - In the **shell** HTML it returns, use **only** root-relative or absolute URLs: `/assets/...`, `/data/...`, `/`, `/articles/...`, etc.
   - In client-side JS, use root-relative or absolute paths for data and assets (e.g. `/data/articles.json`, `/assets/...`) so behavior does not depend on how many path segments the URL has.
   - Add redirects only as a safety net (e.g. `/articles/*/assets/*` → `/assets/:splat`), not as the main fix.

3. **Preview image**  
   - Set `og:image` (and `twitter:image`) to an **absolute** URL that returns the image with correct headers when fetched by a crawler.
   - Test by pasting the **deployed** article URL into Facebook Sharing Debugger (or equivalent) and confirming that the image appears after rescrape.

All changes from this attempt have been reverted; the app is back to its prior state.
