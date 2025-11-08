// Individual article page functionality
class ArticlePageManager {
    constructor() {
        this.articleId = this.getArticleId();
        this.article = null;
        this.comments = [];
        this.init();
    }

    async init() {
        await this.loadArticleData();
        this.setupEventListeners();
        this.updateArticleStats();
        this.handleFeaturedImage();
    }

    getArticleId() {
        const path = window.location.pathname;
        const matches = path.match(/articles\/([^\/]+)/);
        return matches ? matches[1] : null;
    }

    async loadArticleData() {
        try {
            const response = await fetch('../../data/articles.json');
            const data = await response.json();
            this.article = data.articles.find(article => article.id === this.articleId);
            
            if (this.article) {
                this.updatePageTitle();
                this.updateMetaTags();
            }
        } catch (error) {
            console.error('Error loading article data:', error);
        }
    }


    updatePageTitle() {
        if (this.article) {
            document.title = `${this.article.title} - Kerv Talks-Data Blog`;
        }
    }

    updateMetaTags() {
        if (!this.article) return;

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = this.article.excerpt;
        }

        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.content = this.article.title;
        }

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            ogDescription.content = this.article.excerpt;
        }
    }

    updateArticleStats() {
        // Simulate view count increment
        if (this.article) {
            const viewCountElement = document.querySelector('.stat-value');
            if (viewCountElement && viewCountElement.textContent === '156') {
                // In a real app, this would be sent to a server
                const currentViews = parseInt(viewCountElement.textContent);
                viewCountElement.textContent = currentViews + 1;
            }
        }
    }

    setupEventListeners() {
        // Newsletter forms
        const newsletterForms = document.querySelectorAll('.newsletter-panel__form, .newsletter-form');
        if (newsletterForms.length > 0) {
            newsletterForms.forEach((form) => {
                form.addEventListener('submit', this.handleNewsletterSubmit.bind(this));
            });
        }
    }


    handleNewsletterSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const email = formData.get('email');
        
        if (!email) {
            this.showNotification('Please enter a valid email address.');
            return;
        }

        // Simulate newsletter subscription
        this.showNotification('Thank you for subscribing to our newsletter!');
        event.target.reset();
    }


    handleFeaturedImage() {
        const featuredImage = document.getElementById('featured-image');
        const imagePlaceholder = document.getElementById('image-placeholder');
        
        if (featuredImage && imagePlaceholder) {
            // Check if image exists
            const img = new Image();
            img.onload = () => {
                // Image exists, show it
                featuredImage.style.display = 'block';
                imagePlaceholder.style.display = 'none';
            };
            img.onerror = () => {
                // Image doesn't exist, keep placeholder
                featuredImage.style.display = 'none';
                imagePlaceholder.style.display = 'block';
            };
            img.src = featuredImage.src;
        }
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ArticlePageManager();
});
