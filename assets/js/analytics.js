(() => {
    const SESSION_KEY = 'kblog_session_id';

    const getApiBaseUrl = () => {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
        return isLocal ? 'http://localhost:1977' : 'https://kblog.kervinapps.com';
    };

    const getSessionId = () => {
        try {
            const stored = sessionStorage.getItem(SESSION_KEY);
            if (stored) {
                return stored;
            }
            const newId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            sessionStorage.setItem(SESSION_KEY, newId);
            return newId;
        } catch (error) {
            console.warn('Unable to access sessionStorage; falling back to transient session id.', error);
            return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        }
    };

    const collectDeviceInfo = () => {
        if (window.DeviceMetadataCollector) {
            return window.DeviceMetadataCollector.collectDeviceData();
        }

        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${window.screen.width}x${window.screen.height}`
        };
    };

    const sendEvent = async (payload) => {
        try {
            await fetch(`${getApiBaseUrl()}/api/analytics/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.warn('Analytics event failed to send:', error);
        }
    };

    const buildBasePayload = () => ({
        sessionId: getSessionId(),
        pageUrl: window.location.href,
        referrer: document.referrer || '',
        deviceInfo: collectDeviceInfo()
    });

    const trackPageView = () => {
        const payload = {
            ...buildBasePayload(),
            eventType: 'page_view'
        };

        sendEvent(payload);
    };

    const trackArticleView = () => {
        const path = window.location.pathname || '';
        if (!path.includes('/articles/')) {
            return;
        }

        const slug = path
            .replace(/\/index\.html$/, '')
            .split('/')
            .filter(Boolean)
            .pop() || '';

        if (!slug) {
            return;
        }

        const payload = {
            ...buildBasePayload(),
            eventType: 'article_view',
            articleSlug: slug
        };

        sendEvent(payload);
    };

    document.addEventListener('DOMContentLoaded', () => {
        trackPageView();
        trackArticleView();
    });
})();


