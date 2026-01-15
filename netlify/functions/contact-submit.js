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

    // Write to database
    let dbError = null;
    try {
      await db.contactMessages.create({
        name: name,
        email: email,
        organization: body.organization || null,
        role: body.role || null,
        subject: body.subject || null,
        message: message,
        session_id: sessionId,
        page_url: body.pageUrl || null,
        referrer: body.referrer || null,
        device_info: {
          deviceData: body.deviceInfo || null,
          sessionInfo: body.sessionInfo || null,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'submitted'
      });
      console.log('Contact message saved to database');
    } catch (error) {
      console.error('Database write failed (contact):', error);
      dbError = {
        message: error.message || 'Failed to save to database',
        error: error.toString()
      };
      // Don't fail the request - user still sees success
    }

    // Write to Google Sheets (optional, for transition period)
    let sheetsResponse = null;
    try {
      sheetsResponse = await forwardToSheets(payload);
    } catch (error) {
      console.error('Contact Sheets submission failed:', error);
    }

    return jsonResponse(200, {
      success: true,
      message: 'Message received. Thank you for contacting us!',
      dbError: dbError || null,
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


