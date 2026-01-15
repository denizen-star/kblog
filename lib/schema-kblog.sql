-- PlanetScale Database Schema for Kblog
-- Run this in PlanetScale development branch first, then promote to main
-- Tables are prefixed with kblog_ to avoid conflicts

-- Newsletter Signups table: Stores newsletter subscription data
CREATE TABLE kblog_newsletter_signups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  session_id VARCHAR(255),
  source VARCHAR(255) NOT NULL,
  page_url TEXT,
  component_id VARCHAR(255),
  referrer TEXT,
  device_info JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_source (source)
);

-- Contact Messages table: Stores contact form submissions
CREATE TABLE kblog_contact_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  role VARCHAR(255),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  session_id VARCHAR(255),
  page_url TEXT,
  referrer TEXT,
  device_info JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Project Inquiries table: Stores project inquiry form submissions
CREATE TABLE kblog_project_inquiries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  role VARCHAR(255),
  engagement_preference VARCHAR(255),
  timeline VARCHAR(255),
  message TEXT NOT NULL,
  session_id VARCHAR(255),
  page_url TEXT,
  referrer TEXT,
  device_info JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- App Events table: Stores telemetry/engagement events from all apps (shared table)
-- No kblog_ prefix as this is shared across multiple applications
CREATE TABLE app_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app_name VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  session_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  page_category VARCHAR(255),
  page_url TEXT,
  article_id VARCHAR(255),
  article_slug VARCHAR(255),
  article_context VARCHAR(255),
  depth_percent INT,
  referrer TEXT,
  device_info JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_app_name (app_name),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  INDEX idx_session_id (session_id),
  INDEX idx_timestamp (timestamp)
);
