const { URL } = require('url');

let cachedFetch = typeof fetch !== 'undefined' ? fetch : null;

async function getFetch() {
  if (cachedFetch) {
    return cachedFetch;
  }
  const module = await import('node-fetch');
  cachedFetch = module.default;
  return cachedFetch;
}

function getSheetEndpoint() {
  const url =
    process.env.GS_DATA_PIPELINE_URL ||
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    '';

  if (!url) {
    throw new Error('Google Sheets endpoint URL is not configured.');
  }

  try {
    return new URL(url).toString();
  } catch (error) {
    throw new Error(`Invalid Google Sheets endpoint URL: ${url}`);
  }
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.join('; ');
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

function buildRequestBody(payload = {}) {
  const normalized = {};

  Object.entries(payload).forEach(([key, value]) => {
    normalized[key] = normalizeValue(value);
  });

  if (!normalized.timestamp) {
    normalized.timestamp = new Date().toISOString();
  }

  return normalized;
}

async function submitToGoogleSheets(payload, options = {}) {
  const fetchImpl = await getFetch();
  const endpoint = getSheetEndpoint();
  const requestBody = buildRequestBody({
    ...payload,
    dataSolution: 'kblog-google-sheets',
  });

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: options.timeout || 10000,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Sheets request failed with status ${response.status}: ${errorText}`
    );
  }

  let result;
  try {
    result = await response.json();
  } catch {
    result = { success: true };
  }

  return result;
}

module.exports = {
  submitToGoogleSheets,
};

