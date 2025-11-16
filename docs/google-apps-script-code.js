function doPost(e) {
  try {
    const payload = parsePayload(e);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const map = {
      contact: {
        sheet: 'Contact Messages',
        headers: [
          'Timestamp',
          'Session ID',
          'Page URL',
          'Name',
          'Email',
          'Organization',
          'Role',
          'Subject',
          'Message',
          'Referrer',
          'Device Info (JSON)',
          'IP Address',
          'User Agent',
          'Status'
        ],
        row: formatContact(payload)
      },
      projectinquiry: {
        sheet: 'Project Inquiries',
        headers: [
          'Timestamp',
          'Session ID',
          'Page URL',
          'Name',
          'Work Email',
          'Organization',
          'Role / Focus Area',
          'Engagement Preference',
          'Ideal Timeline',
          'Request Details',
          'Referrer',
          'Device Info (JSON)',
          'IP Address',
          'User Agent',
          'Status'
        ],
        row: formatProjectInquiry(payload)
      },
      newsletter: {
        sheet: 'Newsletter Signups',
        headers: [
          'Timestamp',
          'Session ID',
          'Page URL',
          'Component ID',
          'Name',
          'Email',
          'Campaign Tag / Source',
          'Referrer',
          'Device Info (JSON)',
          'IP Address',
          'User Agent',
          'Status'
        ],
        row: formatNewsletter(payload)
      },
      event: {
        sheet: 'Site Engagement Events',
        headers: [
          'Timestamp',
          'Session ID',
          'Event Type',
          'Page Category',
          'Page URL',
          'Article ID',
          'Article Slug',
          'Article Context',
          'Depth %',
          'Referrer',
          'Device Info (JSON)',
          'IP Address',
          'User Agent'
        ],
        row: formatEvent(payload)
      }
    };

    const dataType = (payload.dataType || '').toLowerCase();
    const target = map[dataType];

    if (!target) {
      return buildResponse(400, {
        success: false,
        error: 'Unsupported dataType: ' + dataType
      });
    }

    const sheet = ensureSheet(spreadsheet, target.sheet, target.headers);
    sheet.appendRow(target.row);

    return buildResponse(200, {
      success: true,
      sheetName: target.sheet,
      dataType,
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    Logger.log('Error in doPost: ' + error);
    return buildResponse(500, { success: false, error: error.toString() });
  }
}

function formatContact(data) {
  return [
    data.timestamp || new Date().toISOString(),
    data.sessionId || '',
    data.pageUrl || '',
    data.name || '',
    data.email || '',
    data.organization || '',
    data.role || '',
    data.subject || '',
    data.message || '',
    data.referrer || '',
    stringify(data.deviceInfo),
    data.ipAddress || '',
    data.userAgent || '',
    data.status || ''
  ];
}

function formatProjectInquiry(data) {
  return [
    data.timestamp || new Date().toISOString(),
    data.sessionId || '',
    data.pageUrl || '',
    data.name || '',
    data.email || '',
    data.organization || '',
    data.role || '',
    data.engagementPreference || '',
    data.timeline || '',
    data.message || '',
    data.referrer || '',
    stringify(data.deviceInfo),
    data.ipAddress || '',
    data.userAgent || '',
    data.status || ''
  ];
}

function formatNewsletter(data) {
  return [
    data.timestamp || new Date().toISOString(),
    data.sessionId || '',
    data.pageUrl || '',
    data.componentId || '',
    data.name || '',
    data.email || '',
    data.source || '',
    data.referrer || '',
    stringify(data.deviceInfo),
    data.ipAddress || '',
    data.userAgent || '',
    data.status || ''
  ];
}

function formatEvent(data) {
  return [
    data.timestamp || new Date().toISOString(),
    data.sessionId || '',
    data.eventType || '',
    data.pageCategory || '',
    data.pageUrl || '',
    data.articleId || '',
    data.articleSlug || '',
    data.listContext || '',
    typeof data.depthPercent === 'number' ? data.depthPercent : '',
    data.referrer || '',
    stringify(data.deviceInfo),
    data.ipAddress || '',
    data.userAgent || ''
  ];
}

function doGet() {
  return buildResponse(200, {
    status: 'ok',
    message: 'Kblog Google Sheets collector running',
    timestamp: new Date().toISOString()
  });
}

function parsePayload(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      Logger.log('JSON parse failed, falling back to form parameters');
    }
  }
  return (e && e.parameter) || {};
}

function ensureSheet(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  if (sheet.getLastColumn() < headers.length) {
    sheet.insertColumnsAfter(sheet.getLastColumn(), headers.length - sheet.getLastColumn());
  }
  return sheet;
}

function stringify(value) {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function buildResponse(status, payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(status);
}

