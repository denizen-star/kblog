const { forwardToSheets, jsonResponse, parseBody, extractClientMetadata } = require('./utils');

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

    const payload = {
      dataType: 'event',
      timestamp: body.timestamp || new Date().toISOString(),
      sessionId: body.sessionId || `event_${Date.now()}`,
      eventType,
      pageUrl: body.pageUrl || '',
      articleSlug: body.articleSlug || '',
      referrer: body.referrer || '',
      deviceInfo: body.deviceInfo || {},
      ipAddress,
      userAgent,
    };

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


