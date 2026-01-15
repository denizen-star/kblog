const {
  jsonResponse,
  parseBody,
  extractClientMetadata,
  validateHttpMethod,
  validateEmail,
  generateSessionId,
  writeToDatabase,
  writeToSheets,
  buildDatabaseMetadata,
} = require('./utils');
const { db } = require('../../lib/databaseClient');

exports.handler = async (event) => {
  const methodCheck = validateHttpMethod(event);
  if (!methodCheck.isValid) {
    return methodCheck.response;
  }

  try {
    const body = parseBody(event);
    const { ipAddress, userAgent } = extractClientMetadata(event.headers);

    const emailValidation = validateEmail(body.email);
    if (!emailValidation.isValid) {
      return jsonResponse(400, { success: false, error: emailValidation.error });
    }

    const email = emailValidation.email;
    const sessionId = generateSessionId('newsletter', body.sessionId);

    const source = body.source || body.campaignTag || 'newsletter_signup';
    const metadata = buildDatabaseMetadata(body, ipAddress, userAgent, sessionId);

    // Write to database
    const dbError = await writeToDatabase(
      (data) => db.newsletterSignups.create(data),
      {
        email,
        name: body.name || null,
        source,
        component_id: body.componentId || null,
        status: 'active',
        ...metadata,
      },
      'Newsletter signup'
    );

    // Prepare payload for Google Sheets
    const payload = {
      dataType: 'newsletter',
      timestamp: body.timestamp || new Date().toISOString(),
      sessionId,
      pageUrl: body.pageUrl || '',
      componentId: body.componentId || '',
      name: body.name || '',
      email,
      source,
      referrer: body.referrer || '',
      deviceInfo: metadata.device_info,
      ipAddress,
      userAgent,
      status: 'submitted',
    };

    // Write to Google Sheets (optional, for transition period)
    const { response: sheetsResponse, error: sheetsError } = await writeToSheets(
      payload,
      'Newsletter submission'
    );

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


