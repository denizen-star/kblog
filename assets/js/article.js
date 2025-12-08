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

    setupEventListeners() {
        // Newsletter forms are handled by newsletter.js
        // No need to set up duplicate handlers here
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

}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ArticlePageManager();
});
