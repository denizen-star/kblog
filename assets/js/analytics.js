(() => {
    const SESSION_KEY = 'kblog_session_id';
    const IMPRESSIONS_KEY = 'kblog_impressions';
    const READS_KEY = 'kblog_reads';

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

    const getPageCategory = () => {
        const path = (window.location.pathname || '').replace(/\/index\.html$/, '');
        if (path === '/' || path === '') return 'home';
        if (path.startsWith('/articles/')) return 'article';
        if (path.startsWith('/articles')) return 'articles_list';
        if (path.startsWith('/contact')) return 'contact';
        if (path.startsWith('/project-inquiries')) return 'project_inquiries';
        if (path.startsWith('/about')) return 'about';
        return 'other';
    };

    const trackPageView = () => {
        const payload = {
            ...buildBasePayload(),
            eventType: 'page_view',
            pageCategory: getPageCategory()
        };
        sendEvent(payload);
        console.debug('[analytics] page_view', payload);
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
        console.debug('[analytics] article_view', payload);
    };

    // Track article impressions on lists (home/sidebar, articles list)
    const getImpressionSet = () => {
        try {
            return new Set(JSON.parse(sessionStorage.getItem(IMPRESSIONS_KEY) || '[]'));
        } catch {
            return new Set();
        }
    };
    const saveImpressionSet = (set) => {
        try {
            sessionStorage.setItem(IMPRESSIONS_KEY, JSON.stringify(Array.from(set)));
        } catch {}
    };

    const trackArticleImpressions = () => {
        const tiles = Array.from(document.querySelectorAll('.latest-article-item, .article-card'));
        if (tiles.length === 0) return;

        const seen = getImpressionSet();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const articleId = el.getAttribute('data-article-id') || el.getAttribute('data-article-slug') || '';
                if (!articleId || seen.has(articleId)) return;

                const listContext =
                    el.closest('#sidebar-latest-articles') ? 'home_sidebar' :
                    el.closest('.articles-grid') ? 'articles_list' :
                    'unknown';

                const payload = {
                    ...buildBasePayload(),
                    eventType: 'article_impression',
                    articleId,
                    listContext,
                    pageCategory: getPageCategory()
                };
                seen.add(articleId);
                saveImpressionSet(seen);
                sendEvent(payload);
                console.debug('[analytics] article_impression', payload);
                observer.unobserve(el);
            });
        }, { root: null, rootMargin: '0px', threshold: 0.4 });

        tiles.forEach((t) => observer.observe(t));
    };

    // Track article opens (clicks on tiles)
    const bindArticleOpens = () => {
        const tiles = Array.from(document.querySelectorAll('.latest-article-item, .article-card'));
        if (tiles.length === 0) return;
        tiles.forEach((tile) => {
            tile.addEventListener('click', () => {
                const articleId = tile.getAttribute('data-article-id') || tile.getAttribute('data-article-slug') || '';
                const payload = {
                    ...buildBasePayload(),
                    eventType: 'article_open',
                    articleId,
                    pageCategory: getPageCategory()
                };
                try {
                    if (navigator.sendBeacon) {
                        navigator.sendBeacon(`${getApiBaseUrl()}/api/analytics/event`, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
                    } else {
                        sendEvent(payload);
                    }
                } catch {}
                console.debug('[analytics] article_open', payload);
            }, { capture: true });
        });
    };

    // Track article read depth (>= 75%) on article pages
    const getReadSet = () => {
        try {
            return new Set(JSON.parse(sessionStorage.getItem(READS_KEY) || '[]'));
        } catch {
            return new Set();
        }
    };
    const saveReadSet = (set) => {
        try {
            sessionStorage.setItem(READS_KEY, JSON.stringify(Array.from(set)));
        } catch {}
    };

    const trackArticleReadDepth = () => {
        const path = window.location.pathname || '';
        if (!path.includes('/articles/')) return;
        const slug = path.replace(/\/index\.html$/, '').split('/').filter(Boolean).pop() || '';
        if (!slug) return;

        const sentReads = getReadSet();
        if (sentReads.has(slug)) return;

        const handler = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.offsetHeight,
                document.body.clientHeight,
                document.documentElement.clientHeight
            );
            const winHeight = window.innerHeight || document.documentElement.clientHeight;
            const depth = ((scrollTop + winHeight) / docHeight) * 100;
            if (depth >= 75) {
                const payload = {
                    ...buildBasePayload(),
                    eventType: 'article_read',
                    articleId: slug,
                    depthPercent: Math.round(depth),
                    pageCategory: getPageCategory()
                };
                sendEvent(payload);
                console.debug('[analytics] article_read', payload);
                sentReads.add(slug);
                saveReadSet(sentReads);
                window.removeEventListener('scroll', handler);
            }
        };
        window.addEventListener('scroll', handler, { passive: true });
        handler();
    };
    document.addEventListener('DOMContentLoaded', () => {
        trackPageView();
        trackArticleView();
        trackArticleImpressions();
        bindArticleOpens();
        trackArticleReadDepth();
    });
})();


