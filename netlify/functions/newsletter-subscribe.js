const { forwardToSheets, jsonResponse, parseBody, extractClientMetadata } = require('./utils');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const email = (body.email || '').trim().toLowerCase();
    if (!email) {
      return jsonResponse(400, { success: false, error: 'Email is required.' });
    }

    if (!emailRegex.test(email)) {
      return jsonResponse(400, { success: false, error: 'Please provide a valid email address.' });
    }

    const timestamp = body.timestamp || new Date().toISOString();
    const sessionId = body.sessionId || `newsletter_${Date.now()}`;

    const payload = {
      dataType: 'newsletter',
      timestamp,
      sessionId,
      pageUrl: body.pageUrl || '',
      componentId: body.componentId || '',
      name: body.name || '',
      email,
      source: body.source || body.campaignTag || 'newsletter_signup',
      referrer: body.referrer || '',
      deviceInfo: {
        deviceData: body.deviceInfo || body.deviceData || null,
        sessionInfo: body.sessionInfo || null,
      },
      ipAddress,
      userAgent,
      status: 'submitted',
    };

    let sheetsResponse = null;
    let sheetsError = null;
    try {
      sheetsResponse = await forwardToSheets(payload);
      console.log('Newsletter submission forwarded to Google Sheets:', sheetsResponse);
    } catch (error) {
      console.error('Newsletter Sheets submission failed:', error);
      sheetsError = {
        message: error.message || 'Failed to save to Google Sheets',
        error: error.toString()
      };
      // Log the error but don't fail the request - user still sees success
      // This allows the subscription to work even if Sheets is misconfigured
    }

    return jsonResponse(200, {
      success: true,
      message: 'Successfully subscribed to newsletter.',
      sheetsResponse,
      sheetsError: sheetsError || null,
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return jsonResponse(500, { success: false, error: 'Failed to process subscription.' });
  }
};


