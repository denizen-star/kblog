/**
 * OG Article Page: injects Open Graph and Twitter Card meta into the articles SPA shell
 * so link-preview crawlers see per-article thumbnail and description (title: excerpt).
 * Uses article featured image or site default (previmgkblog.jpg).
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_OG_IMAGE = 'assets/images/previmgkblog.jpg';

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getOrigin(headers) {
  const host = headers['x-forwarded-host'] || headers['host'] || '';
  const proto = headers['x-forwarded-proto'] === 'https' ? 'https' : 'https';
  return `${proto}://${host}`;
}

function getSlugFromPath(requestPath) {
  const match = requestPath.match(/^\/articles\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

function buildDescription(title, excerpt) {
  const t = (title || '').trim();
  const e = (excerpt || '').trim().replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t && !e) return 'Kerv Talks-Data Blog';
  if (!e) return t;
  return `${t}: ${e}`;
}

function injectMeta(html, meta) {
  const { title, description, imageUrl, pageUrl } = meta;
  let out = html;

  const replacements = [
    [/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}">`],
    [/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(description)}">`],
    [/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${escapeHtml(pageUrl)}">`],
    [/<meta\s+property="og:image"[^>]*>/, `<meta property="og:image" content="${escapeHtml(imageUrl)}" id="og-image">`],
    [/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(title)}">`],
    [/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(description)}">`],
    [/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`],
  ];

  for (const [regex, repl] of replacements) {
    out = out.replace(regex, repl);
  }

  return out;
}

function readStaticHtml() {
  const candidates = [
    path.join(process.cwd(), 'articles', 'index.html'),
    path.join(__dirname, '..', '..', 'articles', 'index.html'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf8');
      }
    } catch (_) {
      // continue
    }
  }
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Method Not Allowed',
    };
  }

  const requestPath = event.path || event.rawUrl?.split('?')[0] || '';
  const slug = getSlugFromPath(requestPath);
  const origin = getOrigin(event.headers || {});

  const staticHtml = readStaticHtml();
  if (!staticHtml) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Static HTML not found',
    };
  }

  if (!slug) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
      body: staticHtml,
    };
  }

  let metadata = null;
  try {
    const metaUrl = `${origin}/articles/${encodeURIComponent(slug)}/metadata.json`;
    const res = await fetch(metaUrl);
    if (res.ok) {
      metadata = await res.json();
    }
  } catch (_) {
    // Return shell so client can show "article not found"
  }

  if (!metadata) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
      body: staticHtml,
    };
  }

  const title = (metadata.title || 'Article').trim();
  const excerpt = (metadata.excerpt || '').trim();
  const description = buildDescription(title, excerpt);
  const pageUrl = `${origin}/articles/${slug}/`;
  const imagePath =
    metadata.image && metadata.image.featured
      ? `assets/images/articles/${metadata.image.featured}`
      : DEFAULT_OG_IMAGE;
  const imageUrl = imagePath.startsWith('http') ? imagePath : `${origin}/${imagePath.replace(/^\//, '')}`;

  const meta = { title, description, imageUrl, pageUrl };
  const body = injectMeta(staticHtml, meta);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
    },
    body,
  };
};
