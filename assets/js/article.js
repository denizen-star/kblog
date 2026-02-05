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
            const response = await fetch('/data/articles.json');
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

        const title = (this.article.title || '').trim();
        const excerpt = (this.article.excerpt || '').trim().replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
        const description = excerpt ? `${title}: ${excerpt}` : title;

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = excerpt || description;
        }

        // Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.content = title;

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.content = description;

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) {
            ogImage.content = this.getOgImageUrl();
        }

        // Twitter Card tags
        const twTitle = document.querySelector('meta[name="twitter:title"]');
        if (twTitle) twTitle.content = title;
        const twDescription = document.querySelector('meta[name="twitter:description"]');
        if (twDescription) twDescription.content = description;
        const twImage = document.querySelector('meta[name="twitter:image"]');
        if (twImage) twImage.content = this.getOgImageUrl();
    }

    getOgImageUrl() {
        const origin = window.location.origin;
        const defaultImage = `${origin}/assets/images/previmgkblog.jpg`;
        const img = this.article?.image;
        if (img && img !== 'placeholder.jpg' && img !== '') {
            return `${origin}/assets/images/articles/${img}`;
        }
        return defaultImage;
    }

    setupEventListeners() {
        // Newsletter forms are handled by newsletter.js
        // No need to set up duplicate handlers here
    }


    handleFeaturedImage() {
        const featuredImage = document.getElementById('featured-image');
        const imagePlaceholder = document.getElementById('image-placeholder');
        
        if (featuredImage && imagePlaceholder) {
            // Check if image exists (use src as fallback, browser will use srcset if available)
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
            // Use the src attribute (fallback) - browser will automatically use srcset if available
            img.src = featuredImage.src || featuredImage.getAttribute('src');
        } else if (featuredImage && !imagePlaceholder) {
            // If there's an image but no placeholder, just ensure it's visible
            // The image might already be visible, but handle error case
            const img = new Image();
            img.onerror = () => {
                // If image fails to load and there's no placeholder, hide the image
                featuredImage.style.display = 'none';
            };
            img.src = featuredImage.src || featuredImage.getAttribute('src');
        }
    }

}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ArticlePageManager();
});
