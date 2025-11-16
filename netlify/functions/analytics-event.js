const { forwardToSheets, jsonResponse, parseBody, extractClientMetadata } = require('./utils');

const ALLOWED_EVENT_TYPES = new Set([
  'page_view',
  'article_view',
  'article_impression',
  'article_open',
  'article_read',
]);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, { success: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = parseBody(event);
    const { ipAddress, userAgent } = extractClientMetadata(event.headers);

    const eventType = (body.eventType || '').trim();
    if (!eventType) {
      return jsonResponse(400, { success: false, error: 'eventType is required.' });
    }

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return jsonResponse(400, {
        success: false,
        error: `Unsupported eventType: ${eventType}`,
      });
    }

    const timestamp = body.timestamp || new Date().toISOString();
    const sessionId = body.sessionId || `event_${Date.now()}`;

    const base = {
      dataType: 'event',
      timestamp,
      sessionId,
      eventType,
      pageUrl: body.pageUrl || '',
      pageCategory: body.pageCategory || '',
      referrer: body.referrer || '',
      deviceInfo: body.deviceInfo || {},
      ipAddress,
      userAgent,
    };

    let payload = { ...base };

    switch (eventType) {
      case 'page_view': {
        // nothing extra required
        break;
      }

      case 'article_view': {
        const articleSlug = body.articleSlug || body.articleId || '';
        if (!articleSlug) {
          return jsonResponse(400, {
            success: false,
            error: 'article_view events require articleSlug or articleId.',
          });
        }
        payload.articleSlug = articleSlug;
        break;
      }

      case 'article_impression':
      case 'article_open':
      case 'article_read': {
        const articleId = body.articleId || body.articleSlug || '';
        if (!articleId) {
          return jsonResponse(400, {
            success: false,
            error: `${eventType} events require articleId or articleSlug.`,
          });
        }
        payload.articleId = articleId;
        payload.listContext = body.listContext || '';
        if (eventType === 'article_read') {
          const depth = typeof body.depthPercent === 'number'
            ? body.depthPercent
            : parseFloat(body.depthPercent);
          if (!Number.isFinite(depth)) {
            return jsonResponse(400, {
              success: false,
              error: 'article_read events require a numeric depthPercent.',
            });
          }
          payload.depthPercent = Math.round(depth);
        }
        break;
      }

      default: {
        // Should be unreachable due to ALLOWED_EVENT_TYPES check
        break;
      }
    }

    let sheetsResponse = null;
    try {
      sheetsResponse = await forwardToSheets(payload);
    } catch (error) {
      console.error('Analytics Sheets submission failed:', error);
    }

    return jsonResponse(200, {
      success: true,
      message: 'Event recorded.',
      sheetsResponse,
    });
  } catch (error) {
    console.error('Analytics event error:', error);
    return jsonResponse(500, { success: false, error: 'Failed to record event.' });
  }
};


