// Environment-aware configuration for Kerv Talks-Data Blog
// Automatically detects development vs production environment

class BlogConfig {
    constructor() {
        this.isDevelopment = this.detectEnvironment();
        this.config = this.getConfig();
    }

    detectEnvironment() {
        // Simple fix: if hostname contains kervinapps.com, it's production
        const hostname = window.location.hostname;
        return !hostname.includes('kervinapps.com');
    }

    getConfig() {
        if (this.isDevelopment) {
            return {
                apiBaseUrl: 'http://localhost:1977',
                staticBaseUrl: 'http://localhost:1978',
                environment: 'development',
                corsEnabled: true,
                // Feature flags for development
                features: {
                    showArticlesPage: true,
                    showCreateArticle: true,
                    showDebugInfo: true,
                    enableDevTools: true
                }
            };
        } else {
            return {
                apiBaseUrl: 'https://kblog.kervinapps.com',
                staticBaseUrl: 'https://kblog.kervinapps.com',
                environment: 'production',
                corsEnabled: false,
                // Feature flags for production
                features: {
                    showArticlesPage: false,  // Hide articles page in production
                    showCreateArticle: false, // Hide create article in production
                    showDebugInfo: false,
                    enableDevTools: false
                }
            };
        }
    }

    getApiUrl(endpoint) {
        // Remove leading slash if present
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${this.config.apiBaseUrl}/${cleanEndpoint}`;
    }

    getStaticUrl(path) {
        // Remove leading slash if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${this.config.staticBaseUrl}/${cleanPath}`;
    }

    // Convenience methods for common endpoints
    get createArticleUrl() {
        return this.getApiUrl('api/create-article');
    }

    get articlesUrl() {
        return this.getApiUrl('api/articles');
    }

    get healthUrl() {
        return this.getApiUrl('api/health');
    }

    getArticleUrl(slug) {
        return this.getStaticUrl(`articles/${slug}/`);
    }

    getArticleApiUrl(slug) {
        return this.getApiUrl(`api/articles/${slug}`);
    }

    getArticleStatsUrl(slug) {
        return this.getApiUrl(`api/articles/${slug}/stats`);
    }

    // Feature flag methods
    isFeatureEnabled(feature) {
        return this.config.features[feature] || false;
    }

    get showArticlesPage() {
        return this.isFeatureEnabled('showArticlesPage');
    }

    get showCreateArticle() {
        return this.isFeatureEnabled('showCreateArticle');
    }

    get showDebugInfo() {
        return this.isFeatureEnabled('showDebugInfo');
    }

    get enableDevTools() {
        return this.isFeatureEnabled('enableDevTools');
    }

    // Log configuration for debugging
    logConfig() {
        if (this.showDebugInfo) {
            console.log('🔧 Blog Configuration:', {
                environment: this.config.environment,
                apiBaseUrl: this.config.apiBaseUrl,
                staticBaseUrl: this.config.staticBaseUrl,
                isDevelopment: this.isDevelopment,
                features: this.config.features
            });
        }
    }
}

// Create global instance
window.blogConfig = new BlogConfig();


// Log configuration on load
window.blogConfig.logConfig();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogConfig;
}
