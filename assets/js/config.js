// Environment-aware configuration for Kerv Talks-Data Blog
// Automatically detects development vs production environment

class BlogConfig {
    constructor() {
        this.isDevelopment = this.detectEnvironment();
        this.config = this.getConfig();
    }

    detectEnvironment() {
        // Check if we're running on localhost (development)
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        
        // Check if we're on the production domain
        const isProduction = hostname === 'kblog.kervinapps.com' || hostname.includes('kervinapps.com');
        
        return isLocalhost && !isProduction;
    }

    getConfig() {
        if (this.isDevelopment) {
            return {
                apiBaseUrl: 'http://localhost:1977',
                staticBaseUrl: 'http://localhost:1978',
                environment: 'development',
                corsEnabled: true
            };
        } else {
            return {
                apiBaseUrl: 'https://kblog.kervinapps.com',
                staticBaseUrl: 'https://kblog.kervinapps.com',
                environment: 'production',
                corsEnabled: false
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

    // Log configuration for debugging
    logConfig() {
        console.log('🔧 Blog Configuration:', {
            environment: this.config.environment,
            apiBaseUrl: this.config.apiBaseUrl,
            staticBaseUrl: this.config.staticBaseUrl,
            isDevelopment: this.isDevelopment
        });
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
