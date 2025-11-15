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

    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const message = (body.message || '').trim();

    if (!name || !email || !message) {
      return jsonResponse(400, {
        success: false,
        error: 'Name, email, and message are required.',
      });
    }

    if (!emailRegex.test(email)) {
      return jsonResponse(400, {
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    const timestamp = body.timestamp || new Date().toISOString();
    const sessionId = body.sessionId || `contact_${Date.now()}`;

    const payload = {
      dataType: 'contact',
      timestamp,
      sessionId,
      pageUrl: body.pageUrl || '',
      name,
      email,
      organization: body.organization || '',
      role: body.role || '',
      subject: body.subject || '',
      message,
      referrer: body.referrer || '',
      deviceInfo: {
        deviceData: body.deviceInfo || null,
        sessionInfo: body.sessionInfo || null,
      },
      ipAddress,
      userAgent,
      status: 'submitted',
    };

    let sheetsResponse = null;
    try {
      sheetsResponse = await forwardToSheets(payload);
    } catch (error) {
      console.error('Contact Sheets submission failed:', error);
    }

    return jsonResponse(200, {
      success: true,
      message: 'Message received. Thank you for contacting us!',
      sheetsResponse,
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return jsonResponse(500, {
      success: false,
      error: 'Failed to process contact submission.',
    });
  }
};


