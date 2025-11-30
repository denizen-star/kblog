## Add Google Analytics 4 (GA4) to Kblog

This guide explains how to enable Google Analytics 4 for free on your site and verify it’s working. It includes the exact snippet to paste, where to place it, and optional custom events.


### Overview
- **Goal**: Add GA4 to all public pages and verify that page views are collected.
- **Scope**: Inject the GA4 snippet into these files so all pages are covered:
  - `index.html`
  - `about.html`
  - `contact.html`
  - `project-inquiries.html`
  - `articles/index.html`
  - `templates/article-template.html` (ensures all article pages include GA)


### 1) Create a GA4 Property and Data Stream
1. Go to the Google Analytics Admin page and create a new property (GA4).
2. Create a Web data stream for your site domain.
3. Copy your GA4 Measurement ID. It looks like `G-XXXXXXXXXX`.


### 2) Add the GA4 Snippet to Every Page
Paste the snippet below into each target file listed above, right before the closing `</head>` tag. Replace `G-XXXXXXXXXX` with your Measurement ID.

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', { send_page_view: true });
</script>
```

Notes:
- Ensure the snippet appears **exactly once per page**.
- If you later introduce a shared layout or head include, place the snippet there to avoid duplication.


### 3) Optional Custom Events (example: newsletter_signup)
You can send custom events to track key actions. For example, when a user successfully subscribes to your newsletter, call:

```html
<script>
  // Call this after a successful subscription
  gtag('event', 'newsletter_signup', {
    method: 'form',
    location: 'footer' // or 'modal', etc.
  });
</script>
```

Recommendations:
- Use clear event names (e.g., `newsletter_signup`, `contact_submit`, `article_share`).
- Include useful parameters (e.g., `method`, `location`, `article_slug`) to enable richer analysis and comparisons.


### 4) Verify Data (Realtime + Debugger)
1. Open your site in a new browser tab/window (or incognito).
2. In Google Analytics, go to Reports → Realtime. You should see “1 active user” shortly after loading a page.
3. Install and enable the Chrome “Google Analytics Debugger” extension to confirm `page_view` hits are sent.
4. Navigate across multiple pages and confirm Realtime shows activity for each.
5. Open an article page generated from `templates/article-template.html` and confirm activity appears there too.


### 5) Privacy and Filters (consent, internal traffic)
- Consent:
  - If you need consent, integrate a consent banner and only initialize GA after consent is granted.
  - GA4 supports Consent Mode; consider enabling it if you have regional requirements.
- Internal Traffic:
  - In GA Admin → Data Settings → Data Filters, configure “Internal traffic” to exclude your own visits (e.g., by IP rules) from reports.


### Troubleshooting
- No data in Realtime:
  - Confirm the snippet is present right before `</head>`.
  - Verify the Measurement ID is correct, and the property/data stream are GA4 (not Universal Analytics).
  - Wait a few minutes; GA4 can be slightly delayed.
  - Disable ad blockers or test in a clean/incognito session.
- Double page views (inflated counts):
  - Ensure there is only one snippet per page.
  - Avoid calling `gtag('config', ...)` more than once per page load.
  - If you add client-side routing later, avoid firing additional `config` calls; instead use `gtag('event', 'page_view', {...})` on route changes.
- Article pages missing data:
  - Confirm the snippet exists in `templates/article-template.html` and that generated pages include it.


### Change Log
- v1.0 (2025-11-16): Initial GA4 setup guide and snippet instructions.





