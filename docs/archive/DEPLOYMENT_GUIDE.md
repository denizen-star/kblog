> Archived: This document has been superseded by `docs/current/DEPLOYMENT_GUIDE.md` and `docs/application_master_documentation.md`. Retained for historical reference only.

# Deployment Guide

## Overview

This guide covers deploying the Kerv Talks-Data Blog to both development and production environments with proper environment configuration.

## Environment Setup

### Development Environment

**Purpose**: Local development and testing with full feature access

**Configuration**:
- Hostname: `localhost` or `127.0.0.1`
- Port: `1978` (or any available port)
- Features: All features enabled
- Debug: Enabled

**Setup Steps**:

1. **Start the development server**:
   ```bash
   cd /path/to/kblog
   python3 -m http.server 1978
   ```

2. **Access the application**:
   - URL: `http://localhost:1978`
   - Features: Articles page visible, post creation enabled

3. **Verify environment detection**:
   - Open browser console
   - Look for: `🔧 Blog Configuration: { environment: 'development', ... }`

### Production Environment

**Purpose**: Public-facing blog with restricted features

**Configuration**:
- Hostname: `kblog.kervinapps.com`
- Features: Articles page hidden, post creation disabled
- Debug: Disabled

**Setup Steps**:

1. **Deploy files to production server**:
   ```bash
   # Upload all files to kblog.kervinapps.com
   rsync -avz --exclude node_modules --exclude .git ./ user@kblog.kervinapps.com:/var/www/html/
   ```

2. **Configure web server** (Apache/Nginx):
   ```apache
   # Apache .htaccess example
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.html [QSA,L]
   ```

3. **Verify environment detection**:
   - Visit `https://kblog.kervinapps.com`
   - Check that Articles page is hidden from navigation
   - Verify no debug info in console

## File Structure

```
kblog/
├── index.html                 # Homepage
├── articles/
│   ├── index.html            # Articles page (hidden in production)
│   └── create/
│       └── index.html        # Article creation (hidden in production)
├── assets/
│   ├── js/
│   │   ├── config.js         # Environment configuration
│   │   └── main.js           # Main application logic
│   └── css/
│       ├── main.css          # Main styles
│       └── responsive.css    # Responsive styles
├── data/
│   ├── articles.json         # Article data
│   ├── authors.json          # Author data
│   └── comments.json         # Comment data
└── docs/
    ├── ENVIRONMENT_CONFIGURATION.md
    └── DEPLOYMENT_GUIDE.md
```

## Environment-Specific Files

### Files Always Deployed

- `index.html` - Homepage (works in both environments)
- `assets/` - All CSS and JS files
- `data/` - All data files
- `about.html`, `contact.html` - Static pages

### Files Hidden in Production

- `articles/index.html` - Articles listing page
- `articles/create/index.html` - Article creation page
- Individual article pages in `articles/[slug]/`

**Note**: These files are deployed but hidden via JavaScript feature flags. For true security, implement server-side access controls.

## Configuration Management

### Automatic Environment Detection

The system automatically detects the environment based on hostname:

```javascript
// Development detection
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// Production detection  
const isProduction = hostname === 'kblog.kervinapps.com' || hostname.includes('kervinapps.com');
```

### Manual Override (Development Only)

For testing production behavior locally, you can temporarily override the environment:

```javascript
// In browser console (development only)
window.blogConfig.isDevelopment = false;
window.blogConfig.config.environment = 'production';
window.blogConfig.config.features.showArticlesPage = false;
```

## Deployment Checklist

### Pre-Deployment

- [ ] Test all features in development environment
- [ ] Verify environment detection works correctly
- [ ] Check that feature flags are properly configured
- [ ] Ensure all assets are properly linked
- [ ] Test responsive design on multiple devices

### Production Deployment

- [ ] Upload all files to production server
- [ ] Configure web server for SPA routing
- [ ] Set up SSL certificate (HTTPS)
- [ ] Configure proper MIME types
- [ ] Test production URL access
- [ ] Verify Articles page is hidden
- [ ] Check that post creation form is hidden
- [ ] Confirm no debug info in console

### Post-Deployment

- [ ] Test all public-facing functionality
- [ ] Verify search functionality works
- [ ] Check article links and navigation
- [ ] Test on multiple browsers
- [ ] Monitor for any console errors
- [ ] Set up monitoring/analytics

## Troubleshooting

### Common Deployment Issues

1. **Environment not detected correctly**:
   - Check hostname in browser address bar
   - Verify `config.js` detection logic
   - Clear browser cache

2. **Features not hiding/showing**:
   - Check feature flag configuration
   - Verify `data-feature` attributes in HTML
   - Check browser console for errors

3. **Assets not loading**:
   - Verify file paths are correct
   - Check web server configuration
   - Ensure proper MIME types

4. **Routing issues**:
   - Configure web server for SPA routing
   - Check `.htaccess` or nginx configuration
   - Verify all routes redirect to `index.html`

### Debug Mode

Enable debug mode in development to see detailed configuration:

```javascript
// In browser console
window.blogConfig.logConfig();
```

This will output the current environment configuration including all feature flags.

## Security Considerations

### Client-Side Limitations

- Feature flags are client-side only
- Hidden pages may still be accessible via direct URL
- JavaScript can be disabled to bypass restrictions

### Recommended Security Measures

1. **Server-side access control**:
   ```apache
   # Apache .htaccess
   <Files "articles/index.html">
       Require all denied
   </Files>
   ```
2. **Authentication system** for admin features
3. **API endpoint protection** for article creation
4. **Content Security Policy** headers

## Monitoring and Maintenance

### Regular Checks

- Monitor application performance
- Check for broken links or missing assets
- Verify environment detection still works
- Review and update feature flags as needed

### Updates

When updating the application:

1. Test changes in development first
2. Update feature flags if needed
3. Deploy to production
4. Verify environment-specific behavior
5. Monitor for any issues

## Support

For deployment issues or questions:

1. Check the browser console for errors
2. Verify environment detection is working
3. Review the configuration in `config.js`
4. Test in both development and production environments


