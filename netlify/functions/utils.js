const { submitToGoogleSheets } = require('../../lib/googleSheetsClient');
const { db } = require('../../lib/databaseClient');

const SKIP_SHEETS = process.env.SKIP_SHEETS === '1';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function allowCors(headers = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...headers,
  };
}

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: allowCors({
      'Content-Type': 'application/json',
      ...extraHeaders,
    }),
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event || !event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch (error) {
    throw new Error('Invalid JSON payload');
  }
}

function extractClientMetadata(headers = {}) {
  const normalized = Object.keys(headers || {}).reduce((acc, key) => {
    acc[key.toLowerCase()] = headers[key];
    return acc;
  }, {});

  const ip =
    normalized['client-ip'] ||
    normalized['x-forwarded-for'] ||
    normalized['x-nf-client-connection-ip'] ||
    normalized['x-real-ip'] ||
    '';

  return {
    ipAddress: ip.split(',')[0].trim(),
    userAgent: normalized['user-agent'] || '',
  };
}

async function forwardToSheets(payload) {
  if (SKIP_SHEETS) {
    console.warn('[Sheets] Submission skipped (SKIP_SHEETS=1). Payload preview:', {
      dataType: payload?.dataType,
      sessionId: payload?.sessionId,
    });
    return { success: true, skipped: true };
  }

  return submitToGoogleSheets(payload);
}

// Validate HTTP method (handles OPTIONS and POST)
function validateHttpMethod(event, allowedMethod = 'POST') {
  if (event.httpMethod === 'OPTIONS') {
    return { isValid: false, response: jsonResponse(204, { success: true }) };
  }

  if (event.httpMethod !== allowedMethod) {
    return {
      isValid: false,
      response: jsonResponse(405, { success: false, error: 'Method Not Allowed' }),
    };
  }

  return { isValid: true };
}

// Validate email format
function validateEmail(email) {
  if (!email) {
    return { isValid: false, error: 'Email is required.' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please provide a valid email address.' };
  }

  return { isValid: true, email: trimmedEmail };
}

// Normalize device info from request body
function normalizeDeviceInfo(body) {
  return {
    deviceData: body.deviceInfo || body.deviceData || null,
    sessionInfo: body.sessionInfo || null,
  };
}

// Generate session ID with prefix
function generateSessionId(prefix, bodySessionId) {
  return bodySessionId || `${prefix}_${Date.now()}`;
}

// Create standardized error object
function createErrorObject(error, defaultMessage = 'Operation failed') {
  return {
    message: error?.message || defaultMessage,
    error: error?.toString() || String(error),
  };
}

// Write to database with consistent error handling
async function writeToDatabase(createFn, data, logPrefix) {
  let error = null;
  try {
    await createFn(data);
    console.log(`${logPrefix} saved to database`);
  } catch (dbError) {
    console.error(`Database write failed (${logPrefix}):`, dbError);
    error = createErrorObject(dbError, 'Failed to save to database');
  }
  return error;
}

// Write to Google Sheets with consistent error handling
async function writeToSheets(payload, logPrefix) {
  let response = null;
  let error = null;
  try {
    response = await forwardToSheets(payload);
    console.log(`${logPrefix} forwarded to Google Sheets`);
  } catch (sheetsError) {
    console.error(`${logPrefix} Sheets submission failed:`, sheetsError);
    error = createErrorObject(sheetsError, 'Failed to save to Google Sheets');
  }
  return { response, error };
}

// Build common metadata fields for database writes
function buildDatabaseMetadata(body, ipAddress, userAgent, sessionId) {
  return {
    session_id: sessionId,
    page_url: body.pageUrl || null,
    referrer: body.referrer || null,
    device_info: normalizeDeviceInfo(body),
    ip_address: ipAddress,
    user_agent: userAgent,
  };
}

module.exports = {
  jsonResponse,
  parseBody,
  extractClientMetadata,
  forwardToSheets,
  validateHttpMethod,
  validateEmail,
  normalizeDeviceInfo,
  generateSessionId,
  createErrorObject,
  writeToDatabase,
  writeToSheets,
  buildDatabaseMetadata,
  EMAIL_REGEX,
};


