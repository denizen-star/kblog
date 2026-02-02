const { connect } = require('@planetscale/database');

// Get PlanetScale connection configuration from environment variables
function getConnectionConfig() {
  // Support both connection string and individual components
  // Check DATABASE_URL first (PlanetScale default), then PLANETSCALE_DATABASE_URL
  const connectionUrl = process.env.DATABASE_URL || process.env.PLANETSCALE_DATABASE_URL;
  
  if (connectionUrl) {
    // Parse connection string: mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}
    try {
      // Use URL constructor if available (Node.js built-in)
      const url = new URL(connectionUrl);
      return {
        host: url.hostname,
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
      };
    } catch (error) {
      // Fallback: manual parsing if URL constructor fails
      const match = connectionUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):?(\d+)?\/([^?]+)/);
      if (match) {
        return {
          host: match[3],
          username: match[1],
          password: match[2],
          database: match[5],
        };
      }
      throw new Error('Invalid DATABASE_URL or PLANETSCALE_DATABASE_URL format');
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.PLANETSCALE_HOST,
    username: process.env.PLANETSCALE_USERNAME,
    password: process.env.PLANETSCALE_PASSWORD,
    database: process.env.PLANETSCALE_DATABASE || 'kervapps',
  };
}

// Create connection with connection pooling
let connection = null;

function getConnection() {
  if (!connection) {
    const config = getConnectionConfig();
    
    if (!config.host || !config.username || !config.password) {
      throw new Error('PlanetScale connection configuration is missing. Please set DATABASE_URL, PLANETSCALE_DATABASE_URL, or PLANETSCALE_HOST, PLANETSCALE_USERNAME, and PLANETSCALE_PASSWORD environment variables.');
    }

    connection = connect({
      host: config.host,
      username: config.username,
      password: config.password,
      database: config.database,
    });

    console.log('[DATABASE] PlanetScale connection initialized');
  }

  return connection;
}

// Helper function to execute queries with error handling
async function executeQuery(query, params = []) {
  const conn = getConnection();
  
  try {
    const result = await conn.execute(query, params);
    return result;
  } catch (error) {
    console.error('[DATABASE] Query error:', error.message);
    console.error('[DATABASE] Query:', query);
    console.error('[DATABASE] Params:', params);
    throw error;
  }
}

// CRUD Operations for Newsletter Signups
const newsletterSignups = {
  async create(signupData) {
    const query = `
      INSERT INTO kblog_newsletter_signups (
        email, name, session_id, source, page_url, component_id, referrer,
        device_info, ip_address, user_agent, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const deviceInfo = signupData.device_info ? JSON.stringify(signupData.device_info) : null;

    const result = await executeQuery(query, [
      signupData.email,
      signupData.name || null,
      signupData.session_id || null,
      signupData.source || 'newsletter_signup',
      signupData.page_url || null,
      signupData.component_id || null,
      signupData.referrer || null,
      deviceInfo,
      signupData.ip_address || null,
      signupData.user_agent || null,
      signupData.status || 'active',
    ]);

    return {
      id: result.insertId,
      ...signupData,
    };
  },

  async getByEmail(email) {
    const query = `
      SELECT 
        id,
        email,
        name,
        session_id as sessionId,
        source,
        page_url as pageUrl,
        component_id as componentId,
        referrer,
        device_info as deviceInfo,
        ip_address as ipAddress,
        user_agent as userAgent,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM kblog_newsletter_signups
      WHERE email = ?
      LIMIT 1
    `;

    const result = await executeQuery(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const signup = result.rows[0];
    
    // Parse device_info JSON if present
    if (signup.deviceInfo) {
      try {
        signup.deviceInfo = typeof signup.deviceInfo === 'string' 
          ? JSON.parse(signup.deviceInfo) 
          : signup.deviceInfo;
      } catch (e) {
        signup.deviceInfo = null;
      }
    }

    return signup;
  },

  async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT 
        id,
        email,
        name,
        session_id as sessionId,
        source,
        page_url as pageUrl,
        component_id as componentId,
        referrer,
        device_info as deviceInfo,
        ip_address as ipAddress,
        user_agent as userAgent,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM kblog_newsletter_signups
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await executeQuery(query, [limit, offset]);
    
    return result.rows.map(signup => {
      // Parse device_info JSON if present
      if (signup.deviceInfo) {
        try {
          signup.deviceInfo = typeof signup.deviceInfo === 'string' 
            ? JSON.parse(signup.deviceInfo) 
            : signup.deviceInfo;
        } catch (e) {
          signup.deviceInfo = null;
        }
      }
      return signup;
    });
  },
};

// CRUD Operations for Contact Messages
const contactMessages = {
  async create(messageData) {
    const query = `
      INSERT INTO kblog_contact_messages (
        name, email, organization, role, subject, message, session_id,
        page_url, referrer, device_info, ip_address, user_agent, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const deviceInfo = messageData.device_info ? JSON.stringify(messageData.device_info) : null;

    const result = await executeQuery(query, [
      messageData.name,
      messageData.email,
      messageData.organization || null,
      messageData.role || null,
      messageData.subject || null,
      messageData.message,
      messageData.session_id || null,
      messageData.page_url || null,
      messageData.referrer || null,
      deviceInfo,
      messageData.ip_address || null,
      messageData.user_agent || null,
      messageData.status || 'submitted',
    ]);

    return {
      id: result.insertId,
      ...messageData,
    };
  },

  async getById(id) {
    const query = `
      SELECT 
        id,
        name,
        email,
        organization,
        role,
        subject,
        message,
        session_id as sessionId,
        page_url as pageUrl,
        referrer,
        device_info as deviceInfo,
        ip_address as ipAddress,
        user_agent as userAgent,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM kblog_contact_messages
      WHERE id = ?
      LIMIT 1
    `;

    const result = await executeQuery(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const message = result.rows[0];
    
    // Parse device_info JSON if present
    if (message.deviceInfo) {
      try {
        message.deviceInfo = typeof message.deviceInfo === 'string' 
          ? JSON.parse(message.deviceInfo) 
          : message.deviceInfo;
      } catch (e) {
        message.deviceInfo = null;
      }
    }

    return message;
  },

  async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT 
        id,
        name,
        email,
        organization,
        role,
        subject,
        message,
        session_id as sessionId,
        page_url as pageUrl,
        referrer,
        device_info as deviceInfo,
        ip_address as ipAddress,
        user_agent as userAgent,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM kblog_contact_messages
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await executeQuery(query, [limit, offset]);
    
    return result.rows.map(message => {
      // Parse device_info JSON if present
      if (message.deviceInfo) {
        try {
          message.deviceInfo = typeof message.deviceInfo === 'string' 
            ? JSON.parse(message.deviceInfo) 
            : message.deviceInfo;
        } catch (e) {
          message.deviceInfo = null;
        }
      }
      return message;
    });
  },
};

// CRUD Operations for Project Inquiries
const projectInquiries = {
  async create(inquiryData) {
    const query = `
      INSERT INTO kblog_project_inquiries (
        name, email, organization, role, engagement_preference, timeline, message,
        session_id, page_url, referrer, device_info, ip_address, user_agent, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const deviceInfo = inquiryData.device_info ? JSON.stringify(inquiryData.device_info) : null;

    const result = await executeQuery(query, [
      inquiryData.name,
      inquiryData.email,
      inquiryData.organization || null,
      inquiryData.role || null,
      inquiryData.engagement_preference || null,
      inquiryData.timeline || null,
      inquiryData.message,
      inquiryData.session_id || null,
      inquiryData.page_url || null,
      inquiryData.referrer || null,
      deviceInfo,
      inquiryData.ip_address || null,
      inquiryData.user_agent || null,
      inquiryData.status || 'submitted',
    ]);

    return {
      id: result.insertId,
      ...inquiryData,
    };
  },

  async getById(id) {
    const query = `
      SELECT 
        id,
        name,
        email,
        organization,
        role,
        engagement_preference as engagementPreference,
        timeline,
        message,
        session_id as sessionId,
        page_url as pageUrl,
        referrer,
        device_info as deviceInfo,
        ip_address as ipAddress,
        user_agent as userAgent,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM kblog_project_inquiries
      WHERE id = ?
      LIMIT 1
    `;

    const result = await executeQuery(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const inquiry = result.rows[0];
    
    // Parse device_info JSON if present
    if (inquiry.deviceInfo) {
      try {
        inquiry.deviceInfo = typeof inquiry.deviceInfo === 'string' 
          ? JSON.parse(inquiry.deviceInfo) 
          : inquiry.deviceInfo;
      } catch (e) {
        inquiry.deviceInfo = null;
      }
    }

    return inquiry;
  },

  async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT 
        id,
        name,
        email,
        organization,
        role,
        engagement_preference as engagementPreference,
        timeline,
        message,
        session_id as sessionId,
        page_url as pageUrl,
        referrer,
        device_info as deviceInfo,
        ip_address as ipAddress,
        user_agent as userAgent,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM kblog_project_inquiries
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await executeQuery(query, [limit, offset]);
    
    return result.rows.map(inquiry => {
      // Parse device_info JSON if present
      if (inquiry.deviceInfo) {
        try {
          inquiry.deviceInfo = typeof inquiry.deviceInfo === 'string' 
            ? JSON.parse(inquiry.deviceInfo) 
            : inquiry.deviceInfo;
        } catch (e) {
          inquiry.deviceInfo = null;
        }
      }
      return inquiry;
    });
  },
};

// CRUD Operations for App Events (Telemetry)
const appEvents = {
  async create(eventData) {
    const deviceInfo = eventData.device_info ? JSON.stringify(eventData.device_info) : null;
    const ipGeolocation = eventData.ip_geolocation ? JSON.stringify(eventData.ip_geolocation) : null;

    // Convert ISO timestamp to MySQL datetime format if needed
    let timestamp = eventData.timestamp;
    if (timestamp && typeof timestamp === 'string' && timestamp.includes('T')) {
      const date = new Date(timestamp);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    let query = `
      INSERT INTO app_events (
        app_name, timestamp, session_id, event_type, page_category, page_url,
        article_id, article_slug, article_context, depth_percent, referrer,
        device_info, ip_address, ip_geolocation, user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let params = [
      eventData.app_name,
      timestamp || new Date(),
      eventData.session_id || null,
      eventData.event_type,
      eventData.page_category || null,
      eventData.page_url || null,
      eventData.article_id || null,
      eventData.article_slug || null,
      eventData.article_context || null,
      eventData.depth_percent || null,
      eventData.referrer || null,
      deviceInfo,
      eventData.ip_address || null,
      ipGeolocation,
      eventData.user_agent || null,
    ];

    try {
      const result = await executeQuery(query, params);
      return {
        id: result.insertId,
        ...eventData,
      };
    } catch (error) {
      // Fallback if ip_geolocation column does not exist yet
      if (
        error.message &&
        (error.message.includes('ip_geolocation') || error.message.includes('Unknown column'))
      ) {
        query = `
          INSERT INTO app_events (
            app_name, timestamp, session_id, event_type, page_category, page_url,
            article_id, article_slug, article_context, depth_percent, referrer,
            device_info, ip_address, user_agent
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
          eventData.app_name,
          timestamp || new Date(),
          eventData.session_id || null,
          eventData.event_type,
          eventData.page_category || null,
          eventData.page_url || null,
          eventData.article_id || null,
          eventData.article_slug || null,
          eventData.article_context || null,
          eventData.depth_percent || null,
          eventData.referrer || null,
          deviceInfo,
          eventData.ip_address || null,
          eventData.user_agent || null,
        ];
        const result = await executeQuery(query, params);
        return {
          id: result.insertId,
          ...eventData,
        };
      }
      throw error;
    }
  },

  async getByAppName(appName, limit = 100, offset = 0) {
    const query = `
      SELECT 
        id,
        app_name as appName,
        timestamp,
        session_id as sessionId,
        event_type as eventType,
        page_category as pageCategory,
        page_url as pageUrl,
        article_id as articleId,
        article_slug as articleSlug,
        article_context as articleContext,
        depth_percent as depthPercent,
        referrer,
        device_info as deviceInfo,
        ip_address as ipAddress,
        ip_geolocation as ipGeolocation,
        user_agent as userAgent,
        created_at as createdAt,
        updated_at as updatedAt
      FROM app_events
      WHERE app_name = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await executeQuery(query, [appName, limit, offset]);
    
    return result.rows.map(event => {
      // Parse device_info JSON if present
      if (event.deviceInfo) {
        try {
          event.deviceInfo = typeof event.deviceInfo === 'string'
            ? JSON.parse(event.deviceInfo)
            : event.deviceInfo;
        } catch (e) {
          event.deviceInfo = null;
        }
      }
      // Parse ip_geolocation JSON if present
      if (event.ipGeolocation) {
        try {
          event.ipGeolocation = typeof event.ipGeolocation === 'string'
            ? JSON.parse(event.ipGeolocation)
            : event.ipGeolocation;
        } catch (e) {
          event.ipGeolocation = null;
        }
      }
      return event;
    });
  },
};

// Export database client with table helpers
const db = {
  newsletterSignups,
  contactMessages,
  projectInquiries,
  appEvents,
};

module.exports = {
  getConnection,
  executeQuery,
  db,
  newsletterSignups,
  contactMessages,
  projectInquiries,
  appEvents,
};
