> Archived: This document has been merged into `docs/application_master_documentation.md` (Sections 1 and 3). Retained for historical reference only.

# Environment Configuration System

## Overview

The Kerv Talks-Data Blog implements an environment-aware configuration system that automatically detects whether the application is running in development (local) or production (kblog.kervinapps.com) and adjusts functionality accordingly.

## Architecture

### Environment Detection

The system automatically detects the environment based on the hostname:

- **Development**: `localhost`, `127.0.0.1`, or any hostname containing `kervinleacock`
- **Production**: `kblog.kervinapps.com` or any hostname containing `kervinapps.com`

### Feature Flags

The system uses feature flags to control which functionality is available in each environment:

| Feature | Development | Production | Description |
|---------|-------------|------------|-------------|
| `showArticlesPage` | ✅ True | ❌ False | Shows/hides the Articles page in navigation |
| `showCreateArticle` | ✅ True | ❌ False | Shows/hides the post creation form |
| `showDebugInfo` | ✅ True | ❌ False | Enables debug logging in console |
| `enableDevTools` | ✅ True | ❌ False | Enables development tools and features |

## Implementation

### Configuration File (`assets/js/config.js`)

The `BlogConfig` class handles environment detection and feature flag management:

```javascript
class BlogConfig {
    constructor() {
        this.isDevelopment = this.detectEnvironment();
        this.config = this.getConfig();
    }

    detectEnvironment() {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isProduction = hostname === 'kblog.kervinapps.com' || hostname.includes('kervinapps.com');
        
        return isLocalhost && !isProduction;
    }
}
```

### Feature Flag Usage

Access feature flags through the global `window.blogConfig` object:

```javascript
// Check if a feature is enabled
if (window.blogConfig.showArticlesPage) {
    // Show articles page functionality
}

// Generic feature check
if (window.blogConfig.isFeatureEnabled('showCreateArticle')) {
    // Show create article functionality
}
```

### Navigation Management

Navigation items are controlled using `data-feature` attributes:

```html
<li><a href="articles/" data-feature="showArticlesPage">Articles</a></li>
```

The system automatically hides navigation items when their associated feature is disabled.

## Environment-Specific Behavior

### Development Environment (Local)

- **URL**: `http://localhost:1978` or `http://127.0.0.1:1978`
- **Articles Page**: Visible in navigation and accessible
- **Post Creation**: Form is visible and functional
- **Debug Info**: Console logging enabled
- **API Base**: `http://localhost:1977`

### Production Environment (kblog.kervinapps.com)

- **URL**: `https://kblog.kervinapps.com`
- **Articles Page**: Hidden from navigation, not accessible
- **Post Creation**: Form is hidden
- **Debug Info**: Console logging disabled
- **API Base**: `https://kblog.kervinapps.com`

## Adding New Feature Flags

To add a new feature flag:

1. **Update the configuration** in `config.js`:

```javascript
features: {
    showArticlesPage: true,
    showCreateArticle: true,
    showDebugInfo: true,
    enableDevTools: true,
    newFeature: true  // Add your new feature
}
```

2. **Add a getter method**:

```javascript
get newFeature() {
    return this.isFeatureEnabled('newFeature');
}
```

3. **Use in your code**:

```javascript
if (window.blogConfig.newFeature) {
    // Your feature logic here
}
```

4. **Add to HTML elements** (if needed):

```html
<div data-feature="newFeature">Content to hide/show</div>
```

## Testing

### Local Testing

1. Start the development server:
   ```bash
   python3 -m http.server 1978
   ```
2. Visit `http://localhost:1978`
3. Verify that:
   - Articles page is visible in navigation
   - Post creation form is visible
   - Debug info appears in console

### Production Testing

1. Deploy to `kblog.kervinapps.com`
2. Visit the production URL
3. Verify that:
   - Articles page is hidden from navigation
   - Post creation form is hidden
   - No debug info in console

## Troubleshooting

### Common Issues

1. **Feature not hiding/showing**: Check that the `data-feature` attribute matches the feature flag name exactly.
2. **Environment not detected**: Verify the hostname matches the detection logic in `detectEnvironment()`.
3. **Debug info not showing**: Ensure `showDebugInfo` is set to `true` in the development configuration.

### Debug Mode

Enable debug mode by setting `showDebugInfo: true` in the configuration. This will log the current environment and feature flags to the console.

## Security Considerations

- Feature flags are client-side only and should not be used for security-sensitive features
- The Articles page is hidden from navigation but the URL may still be accessible if someone knows the path
- For true security, implement server-side access controls

## Future Enhancements

- Server-side feature flag validation
- A/B testing capabilities
- Dynamic feature flag updates without deployment
- User role-based feature access




