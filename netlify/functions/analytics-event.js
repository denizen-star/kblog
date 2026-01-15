const {
  jsonResponse,
  parseBody,
  extractClientMetadata,
  validateHttpMethod,
  generateSessionId,
  getAppName,
  buildTelemetryPayload,
  writeTelemetryToDatabase,
} = require('./utils');

const ALLOWED_EVENT_TYPES = new Set([
  'page_view',
  'article_view',
  'article_impression',
  'article_open',
  'article_read',
]);

exports.handler = async (event) => {
  const methodCheck = validateHttpMethod(event);
  if (!methodCheck.isValid) {
    return methodCheck.response;
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

    const sessionId = generateSessionId('event', body.sessionId);
    const appName = getAppName();

    // Validate event-specific requirements
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
        }
        break;
      }

      default: {
        // Should be unreachable due to ALLOWED_EVENT_TYPES check
        break;
      }
    }

    // Prepare event data for database
    const eventData = buildTelemetryPayload(body, ipAddress, userAgent, sessionId, appName);
    
    // Handle article-specific fields
    if (eventType === 'article_view') {
      eventData.article_slug = body.articleSlug || body.articleId || null;
    } else if (['article_impression', 'article_open', 'article_read'].includes(eventType)) {
      eventData.article_id = body.articleId || body.articleSlug || null;
      eventData.article_context = body.listContext || null;
      if (eventType === 'article_read' && body.depthPercent !== undefined) {
        const depth = typeof body.depthPercent === 'number'
          ? body.depthPercent
          : parseFloat(body.depthPercent);
        eventData.depth_percent = Number.isFinite(depth) ? Math.round(depth) : null;
      }
    }

    // Write to database (DB-only strategy, no Google Sheets)
    const dbError = await writeTelemetryToDatabase(eventData, 'Analytics event');

    return jsonResponse(200, {
      success: true,
      message: 'Event recorded.',
      dbError: dbError || null,
    });
  } catch (error) {
    console.error('Analytics event error:', error);
    return jsonResponse(500, { success: false, error: 'Failed to record event.' });
  }
};


