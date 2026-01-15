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

    const name = (body.name || '').trim();
    const message = (body.message || '').trim();

    if (!name || !message) {
      return jsonResponse(400, {
        success: false,
        error: 'Name, email, and project details are required.',
      });
    }

    const emailValidation = validateEmail(body.email);
    if (!emailValidation.isValid) {
      return jsonResponse(400, {
        success: false,
        error: 'Please provide a valid work email address.',
      });
    }

    const email = emailValidation.email;
    const sessionId = generateSessionId('project', body.sessionId);

    const metadata = buildDatabaseMetadata(body, ipAddress, userAgent, sessionId);

    // Write to database
    const dbError = await writeToDatabase(
      (data) => db.projectInquiries.create(data),
      {
        name,
        email,
        organization: body.organization || null,
        role: body.role || null,
        engagement_preference: body.engagementPreference || null,
        timeline: body.timeline || null,
        message,
        status: 'submitted',
        ...metadata,
      },
      'Project inquiry'
    );

    // Prepare payload for Google Sheets
    const payload = {
      dataType: 'projectInquiry',
      timestamp: body.timestamp || new Date().toISOString(),
      sessionId,
      pageUrl: body.pageUrl || '',
      name,
      email,
      organization: body.organization || '',
      role: body.role || '',
      engagementPreference: body.engagementPreference || '',
      timeline: body.timeline || '',
      message,
      referrer: body.referrer || '',
      deviceInfo: metadata.device_info,
      ipAddress,
      userAgent,
      status: 'submitted',
    };

    // Write to Google Sheets (optional, for transition period)
    const { response: sheetsResponse } = await writeToSheets(
      payload,
      'Project inquiry submission'
    );

    return jsonResponse(200, {
      success: true,
      message: 'Project inquiry received.',
      dbError: dbError || null,
      sheetsResponse,
    });
  } catch (error) {
    console.error('Project inquiry submission error:', error);
    return jsonResponse(500, {
      success: false,
      error: 'Failed to process project inquiry.',
    });
  }
};


