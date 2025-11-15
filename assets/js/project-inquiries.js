(() => {
    const getApiBaseUrl = () => {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
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

    const showStatusMessage = (container, type, message) => {
        let statusEl = container.querySelector('.project-inquiry-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'project-inquiry-status';
            statusEl.style.marginTop = '16px';
            statusEl.style.fontSize = '14px';
            container.appendChild(statusEl);
        }

        const styles = {
            success: {
                color: '#0f5132',
                background: '#d1e7dd',
                border: '1px solid #badbcc'
            },
            error: {
                color: '#842029',
                background: '#f8d7da',
                border: '1px solid #f5c2c7'
            },
            info: {
                color: '#055160',
                background: '#cff4fc',
                border: '1px solid #b6effb'
            }
        };

        const palette = styles[type] || styles.info;

        statusEl.textContent = message;
        statusEl.style.color = palette.color;
        statusEl.style.backgroundColor = palette.background;
        statusEl.style.border = palette.border;
        statusEl.style.padding = '12px 16px';
        statusEl.style.borderRadius = '8px';
    };

    const initProjectInquiryForm = () => {
        const form = document.querySelector('.page-project-inquiries .form-grid');
        if (!form) {
            return;
        }

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
                engagementPreference: formData.get('subject') || '',
                timeline: formData.get('timeline') || '',
                message: formData.get('message')?.trim(),
                sessionId: sessionManager.sessionId,
                sessionInfo: sessionManager.getSessionData(),
                deviceInfo: collectDeviceInfo(),
                pageUrl: window.location.href,
                referrer: document.referrer || ''
            };

            if (!payload.name || !payload.email || !payload.message) {
                showStatusMessage(form, 'error', 'Please complete your name, work email, and project details.');
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalText = submitButton.dataset.originalText || submitButton.textContent;
                submitButton.textContent = 'Submitting...';
            }

            showStatusMessage(form, 'info', 'Submitting your request...');

            try {
                const response = await fetch(`${getApiBaseUrl()}/api/project-inquiries/submit`, {
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
                        'Thank you! Your project inquiry has been received and we will follow up shortly.'
                    );
                    form.reset();
                } else {
                    showStatusMessage(
                        form,
                        'error',
                        result.error || 'We could not process your request right now. Please try again.'
                    );
                }
            } catch (error) {
                console.error('Project inquiry submission error:', error);
                showStatusMessage(
                    form,
                    'error',
                    'An unexpected error occurred. Please try again in a moment.'
                );
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = submitButton.dataset.originalText || 'Submit Request';
                }
            }
        });
    };

    document.addEventListener('DOMContentLoaded', initProjectInquiryForm);
})();


