-- Migration: Add ip_geolocation column to app_events
-- Run this in PlanetScale if app_events already exists without ip_geolocation
-- Date: 2025-02-02

ALTER TABLE app_events ADD COLUMN ip_geolocation JSON AFTER ip_address;
