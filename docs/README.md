# Kerv Talks-Data Blog Documentation

## Overview

This documentation covers the Kerv Talks-Data Blog application, including its environment-aware configuration system, deployment procedures, and feature management.

## Documentation Structure

### Core Documentation

- **[Environment Configuration](ENVIRONMENT_CONFIGURATION.md)** - Complete guide to the environment-aware configuration system
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions for both development and production

## Quick Start

### Development Setup

1. **Clone and navigate to the project**:
   ```bash
   cd /path/to/kblog
   ```

2. **Start the development server**:
   ```bash
   python3 -m http.server 1978
   ```

3. **Access the application**:
   - URL: `http://localhost:1978`
   - Features: Full access including Articles page and post creation

### Production Deployment

1. **Deploy to production server**:
   ```bash
   rsync -avz --exclude node_modules --exclude .git ./ user@kblog.kervinapps.com:/var/www/html/
   ```

2. **Access the application**:
   - URL: `https://kblog.kervinapps.com`
   - Features: Public blog without Articles page or post creation

## Key Features

### Environment-Aware Configuration

The application automatically detects whether it's running in development or production and adjusts functionality accordingly:

- **Development** (`localhost`): Full feature access
- **Production** (`kblog.kervinapps.com`): Restricted public access

### Feature Flags

Control functionality through feature flags:

- `showArticlesPage` - Controls Articles page visibility
- `showCreateArticle` - Controls post creation form
- `showDebugInfo` - Controls debug logging
- `enableDevTools` - Controls development tools

### Responsive Design

- Mobile-first approach
- Responsive navigation
- Optimized for all device sizes

## Architecture

### File Structure

```
kblog/
├── index.html                 # Homepage
├── articles/                  # Articles section (hidden in production)
├── assets/                    # Static assets
│   ├── js/                   # JavaScript files
│   ├── css/                  # Stylesheets
│   └── images/               # Images and media
├── data/                     # JSON data files
├── docs/                     # Documentation
└── templates/                # HTML templates
```

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Data**: JSON files for articles, authors, comments
- **Server**: Python HTTP server (development) / Apache/Nginx (production)

## Environment Differences

| Feature | Development | Production |
|---------|-------------|------------|
| Articles Page | ✅ Visible | ❌ Hidden |
| Post Creation | ✅ Enabled | ❌ Disabled |
| Debug Info | ✅ Enabled | ❌ Disabled |
| API Base URL | `localhost:1977` | `kblog.kervinapps.com` |

## Getting Help

### Common Issues

1. **Environment not detected**: Check hostname and `config.js` detection logic
2. **Features not working**: Verify feature flags in configuration
3. **Assets not loading**: Check file paths and web server configuration

### Debug Mode

Enable debug mode in development:

```javascript
// In browser console
window.blogConfig.logConfig();
```

### Support

For issues or questions:

1. Check browser console for errors
2. Verify environment detection
3. Review configuration files
4. Test in both environments

## Contributing

When making changes:

1. Test in development environment first
2. Update documentation if needed
3. Verify environment-specific behavior
4. Test deployment to production

## License

This project is proprietary to Kerv Talks-Data.
