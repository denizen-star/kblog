/**
 * Newsletter Subscription System
 * Handles session tracking, device metadata collection, and newsletter subscriptions
 */

class SessionManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.pageViews = 1;
        this.trackingData = {
            sessionId: this.sessionId,
            startTime: this.startTime,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio
        };
        
        // Track page views
        this.trackPageView();
    }
    
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    trackPageView() {
        this.pageViews++;
    }
    
    getSessionData() {
        return {
            ...this.trackingData,
            duration: Date.now() - this.startTime,
            pageViews: this.pageViews
        };
    }
}

class DeviceMetadataCollector {
    static collectDeviceData() {
        return {
            // Device Information
            deviceType: this.detectDeviceType(),
            os: this.getOperatingSystem(),
            browser: this.getBrowserInfo(),
            
            // Hardware Information
            cpuCores: navigator.hardwareConcurrency || 'unknown',
            memory: navigator.deviceMemory || 'unknown',
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            
            // Display Information
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            
            // Performance Metrics
            performance: this.getPerformanceMetrics()
        };
    }
    
    static detectDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
            return 'mobile';
        } else if (/tablet|ipad/.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }
    
    static getOperatingSystem() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS')) return 'iOS';
        return 'Unknown';
    }
    
    static getBrowserInfo() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    }
    
    static getPerformanceMetrics() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            return {
                pageLoadTime: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                connectionTime: timing.connectEnd - timing.connectStart
            };
        }
        return null;
    }
}

class NewsletterSubscription {
    constructor() {
        this.sessionManager = new SessionManager();
        this.setupEventListeners();
    }

    getApiBaseUrl() {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
        return isLocal ? 'http://localhost:1977' : 'https://kblog.kervinapps.com';
    }
    
    setupEventListeners() {
        // Find all newsletter forms on the page
        const newsletterForms = document.querySelectorAll('.newsletter-form, .newsletter-panel__form');
        
        newsletterForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubscription(e);
            });
        });
    }
    
    async handleSubscription(event) {
        console.log('Newsletter subscription attempt started');
        const form = event.target;
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        console.log('Email input value:', email);
        
        // Validate email
        if (!this.validateEmail(email)) {
            console.log('Email validation failed');
            this.showError('Please enter a valid email address', form);
            return;
        }
        
        console.log('Email validation passed, proceeding with subscription');
        
        // Show loading state
        this.showLoading(form);
        
        try {
            // Collect all data
            const subscriptionData = {
                email: email,
                dataType: 'newsletter',
                sessionId: this.sessionManager.sessionId,
                deviceInfo: DeviceMetadataCollector.collectDeviceData(),
                sessionInfo: this.sessionManager.getSessionData(),
                timestamp: new Date().toISOString(),
                source: form.dataset.source || 'newsletter_signup',
                campaignTag: form.dataset.campaign || null,
                pageUrl: window.location.href,
                referrer: document.referrer || '',
                componentId: form.dataset.component || null
            };
            
            // Send to server
            const response = await this.submitSubscription(subscriptionData);
            
            if (response.success) {
                this.showSuccess('Successfully subscribed! Check your email for confirmation.', form);
                this.trackSubscriptionSuccess(subscriptionData);
                form.reset(); // Clear the form
            } else {
                this.showError(response.message || 'Subscription failed. Please try again.', form);
            }
            
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            this.showError('An error occurred. Please try again.', form);
        } finally {
            this.hideLoading(form);
        }
    }
    
    async submitSubscription(data) {
        const baseUrl = this.getApiBaseUrl();
            
        const response = await fetch(`${baseUrl}/api/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    }
    
    validateEmail(email) {
        // More permissive email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        // Debug logging
        console.log('Email validation:', { email, isValid });
        
        return isValid;
    }
    
    showLoading(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            if (!submitButton.dataset.originalText) {
                submitButton.dataset.originalText = submitButton.textContent;
            }
            submitButton.textContent = 'Subscribing...';
        }
    }
    
    hideLoading(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = submitButton.dataset.originalText || 'Subscribe';
        }
    }
    
    showSuccess(message, form) {
        this.showMessage(message, 'success', form);
    }
    
    showError(message, form) {
        this.showMessage(message, 'error', form);
    }
    
    showMessage(message, type, form) {
        // Remove existing messages
        const existingMessage = form.querySelector('.newsletter-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `newsletter-message newsletter-message-${type}`;
        messageDiv.textContent = message;
        
        // Add styles
        messageDiv.style.cssText = `
            margin-top: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            ${type === 'success' 
                ? 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' 
                : 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
        `;
        
        // Insert after the form
        form.parentNode.insertBefore(messageDiv, form.nextSibling);
        
        // Auto-remove success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }
    
    trackSubscriptionSuccess(data) {
        // Track successful subscription for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_signup', {
                event_category: 'engagement',
                event_label: 'newsletter_subscription',
                value: 1
            });
        }
        
        // Console log for debugging
        console.log('Newsletter subscription successful:', {
            email: data.email,
            sessionId: data.sessionId,
            deviceType: data.deviceInfo.deviceType,
            source: data.source
        });
    }
}

// Initialize newsletter system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewsletterSubscription();
});

// Export for potential external use
window.NewsletterSubscription = NewsletterSubscription;
window.SessionManager = SessionManager;
window.DeviceMetadataCollector = DeviceMetadataCollector;
