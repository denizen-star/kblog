(() => {
    const getApiBaseUrl = () => {
        const isLocal =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
        return isLocal ? 'http://localhost:1977' : 'https://kblog.kervinapps.com';
    };

    const getSessionManager = () => {
        if (window.SessionManager) {
            return new window.SessionManager();
        }
        return {
            sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            startTime: Date.now(),
            getSessionData() {
                return {
                    sessionId: this.sessionId,
                    startTime: this.startTime,
                    duration: Date.now() - this.startTime,
                    pageViews: 1
                };
            }
        };
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

    const showStatusMessage = (form, type, message) => {
        let statusEl = form.querySelector('.contact-form-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'contact-form-status';
            statusEl.style.marginTop = '16px';
            statusEl.style.fontSize = '14px';
            form.appendChild(statusEl);
        }

        statusEl.textContent = message;

        const styles = {
            success: {
                color: '#155724',
                background: '#d4edda',
                border: '1px solid #c3e6cb'
            },
            error: {
                color: '#721c24',
                background: '#f8d7da',
                border: '1px solid #f5c6cb'
            },
            info: {
                color: '#0c5460',
                background: '#d1ecf1',
                border: '1px solid #bee5eb'
            }
        };

        const palette = styles[type] || styles.info;

        statusEl.style.color = palette.color;
        statusEl.style.backgroundColor = palette.background;
        statusEl.style.border = palette.border;
        statusEl.style.padding = '10px 14px';
        statusEl.style.borderRadius = '6px';
    };

    const toggleSubmittingState = (button, isSubmitting) => {
        if (!button) return;
        button.disabled = isSubmitting;
        button.textContent = isSubmitting ? 'Sending...' : 'Send Message';
    };

    const initContactForm = () => {
        const form = document.querySelector('.contact-form form');
        if (!form) return;

        const submitButton = form.querySelector('button[type="submit"]');
        const sessionManager = getSessionManager();

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(form);
            const payload = {
                name: formData.get('name')?.trim(),
                email: formData.get('email')?.trim(),
                organization: formData.get('organization')?.trim(),
                role: formData.get('role') || '',
                subject: formData.get('subject') || '',
                message: formData.get('message')?.trim(),
                sessionId: sessionManager.sessionId,
                sessionInfo: sessionManager.getSessionData(),
                deviceInfo: collectDeviceInfo(),
                pageUrl: window.location.href,
                referrer: document.referrer || ''
            };

            if (!payload.name || !payload.email || !payload.message) {
                showStatusMessage(
                    form,
                    'error',
                    'Please complete your name, email, and message before submitting.'
                );
                return;
            }

            toggleSubmittingState(submitButton, true);
            showStatusMessage(form, 'info', 'Sending your message...');

            try {
                const response = await fetch(`${getApiBaseUrl()}/api/contact/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showStatusMessage(
                        form,
                        'success',
                        'Thanks! Your message has been sent and we will follow up soon.'
                    );
                    form.reset();
                } else {
                    const message =
                        result.error ||
                        'We could not send your message right now. Please try again shortly.';
                    showStatusMessage(form, 'error', message);
                }
            } catch (error) {
                console.error('Contact submission error:', error);
                showStatusMessage(
                    form,
                    'error',
                    'Something went wrong while sending your message. Please try again.'
                );
            } finally {
                toggleSubmittingState(submitButton, false);
            }
        });
    };

    document.addEventListener('DOMContentLoaded', initContactForm);
})();

