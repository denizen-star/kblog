const { forwardToSheets, jsonResponse, parseBody, extractClientMetadata } = require('./utils');
const { db } = require('../../lib/databaseClient');

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

    // Write to database
    let dbError = null;
    try {
      await db.newsletterSignups.create({
        email: email,
        name: body.name || null,
        session_id: sessionId,
        source: body.source || body.campaignTag || 'newsletter_signup',
        page_url: body.pageUrl || null,
        component_id: body.componentId || null,
        referrer: body.referrer || null,
        device_info: {
          deviceData: body.deviceInfo || body.deviceData || null,
          sessionInfo: body.sessionInfo || null,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'active'
      });
      console.log('Newsletter signup saved to database');
    } catch (error) {
      console.error('Database write failed (newsletter):', error);
      dbError = {
        message: error.message || 'Failed to save to database',
        error: error.toString()
      };
      // Don't fail the request - user still sees success
    }

    // Write to Google Sheets (optional, for transition period)
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
      dbError: dbError || null,
      sheetsResponse,
      sheetsError: sheetsError || null,
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return jsonResponse(500, { success: false, error: 'Failed to process subscription.' });
  }
};


