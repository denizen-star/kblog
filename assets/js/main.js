// Main JavaScript functionality for Kerv Talks-Data Blog

class BlogManager {
    constructor() {
        this.articles = [];
        this.comments = [];
        this.authors = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.initializeComponents();
        this.setupEventListeners();
        
        // Load homepage articles after everything is initialized
        this.loadHomepageArticles();
        
        // Check if we need to refresh due to new article creation
        this.checkForRefreshFlag();
    }

    async loadData() {
        try {
            // Load articles data
            const articlesResponse = await fetch('data/articles.json');
            const articlesData = await articlesResponse.json();
            this.articles = articlesData.articles;

            // Load comments data
            const commentsResponse = await fetch('data/comments.json');
            const commentsData = await commentsResponse.json();
            this.comments = commentsData.comments;

            // Load authors data
            const authorsResponse = await fetch('data/authors.json');
            const authorsData = await authorsResponse.json();
            this.authors = authorsData.authors;

            console.log('✅ Data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading data:', error);
        }
    }

    initializeComponents() {
        this.searchManager = new SearchManager(this.articles);
        this.commentsManager = new CommentsManager(this.comments);
        this.articleManager = new ArticleManager(this.articles);
        this.imageUploadManager = new ImageUploadManager();
        this.postManager = new PostManager();
        
        // Homepage articles will be loaded in init() after data is ready
        
        // Set up auto-refresh for homepage (every 30 seconds)
        const pathname = window.location.pathname;
        if (pathname === '/' || pathname === '/index.html' || pathname.endsWith('index.html')) {
            setInterval(() => {
                this.refreshHomepageArticles();
            }, 30000); // Refresh every 30 seconds
            
            // Add refresh button event listener
            const refreshBtn = document.getElementById('refresh-articles-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.refreshHomepageArticles();
                });
            }
        }
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.updateArticleStats();
            this.setupNavigation();
        });
    }

    updateArticleStats() {
        // Update article statistics dynamically
        const statElements = document.querySelectorAll('.stat-value');
        if (statElements.length > 0) {
            const totalViews = this.articles.reduce((sum, article) => sum + article.views, 0);
            const totalLikes = this.articles.reduce((sum, article) => sum + article.likes, 0);
            
            // Update stats if elements exist
            if (statElements[0]) statElements[0].textContent = this.articles.length;
            if (statElements[1]) statElements[1].textContent = totalViews;
        }
    }

    setupNavigation() {
        // Add active class to current page navigation
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-menu a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    loadHomepageArticles() {
        // Only load articles on the homepage
        const pathname = window.location.pathname;
        console.log('🔍 loadHomepageArticles called, pathname:', pathname);
        console.log('🔍 Articles available:', this.articles.length);
        
        if (pathname === '/' || pathname === '/index.html' || pathname.endsWith('index.html')) {
            console.log('✅ Homepage detected, calling renderHomepageArticles');
            this.renderHomepageArticles();
        } else {
            console.log('❌ Not homepage, skipping');
        }
    }

    async refreshHomepageArticles() {
        // Only refresh on the homepage
        const pathname = window.location.pathname;
        if (pathname === '/' || pathname === '/index.html' || pathname.endsWith('index.html')) {
            try {
                // Reload articles data
                const articlesResponse = await fetch('data/articles.json');
                const articlesData = await articlesResponse.json();
                this.articles = articlesData.articles;
                
                // Re-render articles
                this.renderHomepageArticles();
                console.log('🔄 Homepage articles refreshed');
            } catch (error) {
                console.error('Error refreshing articles:', error);
            }
        }
    }

    renderHomepageArticles() {
        console.log('🔍 renderHomepageArticles called');
        const container = document.getElementById('articles-container');
        console.log('🔍 Container found:', !!container);
        if (!container) {
            console.log('❌ Articles container not found!');
            return;
        }

        // Sort articles by published date (newest first)
        const sortedArticles = [...this.articles].sort((a, b) => {
            const dateA = new Date(a.published);
            const dateB = new Date(b.published);
            return dateB - dateA; // Newest first
        });

        // Clear container (including test element)
        container.innerHTML = '';

        // Add a test indicator
        if (sortedArticles.length === 0) {
            container.innerHTML = '<p style="color: red; padding: 20px; text-align: center;">No articles found</p>';
            return;
        }

        // Render each article
        sortedArticles.forEach(article => {
            const articleElement = this.createArticleCard(article);
            container.appendChild(articleElement);
        });

        console.log(`✅ Loaded ${sortedArticles.length} articles on homepage (newest to oldest)`);
        console.log('📋 First article:', sortedArticles[0]?.title || 'No articles');
    }

    createArticleCard(article) {
        const articleElement = document.createElement('article');
        articleElement.className = 'card article-card';
        articleElement.setAttribute('data-article-id', article.id);

        // Calculate time ago
        const timeAgo = this.getTimeAgo(article.published);

        // Create article HTML
        articleElement.innerHTML = `
            <div class="article-header">
                <div class="article-avatar">${article.author.avatar}</div>
                <div class="article-info">
                    <div class="article-author">${article.author.name}</div>
                    <div class="article-meta">${article.author.role} • ${timeAgo}</div>
                </div>
            </div>
            <div class="article-content">
                <h3 class="article-title"><a href="articles/${article.id}/">${article.title}</a></h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-image">${this.getArticleImage(article)}</div>
            </div>
            <div class="article-actions">
                <button class="action-button like-button" data-article-id="${article.id}">👍 Like</button>
                <a href="articles/${article.id}/#comments" class="action-button">💬 Comment</a>
                <button class="action-button share-button" data-article-id="${article.id}">🔄 Repost</button>
                <button class="action-button">📤 Send</button>
            </div>
        `;

        return articleElement;
    }

    getTimeAgo(publishedDate) {
        const now = new Date();
        const published = new Date(publishedDate);
        const diffInSeconds = Math.floor((now - published) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d`;
        } else if (diffInSeconds < 31536000) {
            const months = Math.floor(diffInSeconds / 2592000);
            return `${months}mo`;
        } else {
            const years = Math.floor(diffInSeconds / 31536000);
            return `${years}y`;
        }
    }

    getArticleImage(article) {
        // Check if article has a featured image
        if (article.image && article.image !== 'placeholder.jpg') {
            return `<img src="assets/images/articles/${article.image}" alt="${article.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">`;
        }
        
        // Return author avatar as fallback
        return article.author.avatar;
    }

    checkForRefreshFlag() {
        // Check if we need to refresh due to new article creation
        const refreshFlag = localStorage.getItem('refreshHomepage');
        if (refreshFlag === 'true') {
            console.log('🔄 New article detected, refreshing homepage...');
            localStorage.removeItem('refreshHomepage');
            this.refreshHomepageArticles();
        }
    }
}

// Search functionality
class SearchManager {
    constructor(articles) {
        this.articles = articles;
        this.searchInput = document.querySelector('.search-bar input');
        this.searchResults = document.querySelector('.search-results');
        this.init();
    }

    init() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }
    }

    handleSearch(event) {
        const query = event.target.value.toLowerCase();
        if (query.length > 2) {
            this.performSearch(query);
        } else {
            this.clearSearchResults();
        }
    }

    performSearch(query) {
        const results = this.articles.filter(article => 
            article.title.toLowerCase().includes(query) ||
            article.excerpt.toLowerCase().includes(query) ||
            article.tags.some(tag => tag.toLowerCase().includes(query))
        );

        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        if (!this.searchResults) return;

        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="no-results">No articles found matching your search.</div>';
        } else {
            const resultsHTML = results.map(article => `
                <div class="search-result-item">
                    <h4><a href="articles/${article.id}/">${article.title}</a></h4>
                    <p>${article.excerpt}</p>
                    <span class="search-meta">${article.author.name} • ${article.readTime} min read</span>
                </div>
            `).join('');
            
            this.searchResults.innerHTML = resultsHTML;
        }
    }

    clearSearchResults() {
        if (this.searchResults) {
            this.searchResults.innerHTML = '';
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Comments system
class CommentsManager {
    constructor(comments) {
        this.comments = comments;
        this.commentsContainer = document.querySelector('.comments-container');
        this.commentForm = document.querySelector('.comment-form');
        this.init();
    }

    init() {
        if (this.commentForm) {
            this.commentForm.addEventListener('submit', this.handleSubmit.bind(this));
        }
        this.loadComments();
    }

    handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        this.submitComment(formData);
    }

    submitComment(formData) {
        const commentData = {
            id: 'comment-' + Date.now(),
            articleId: this.getCurrentArticleId(),
            author: {
                name: formData.get('author') || 'Anonymous',
                avatar: this.generateAvatar(formData.get('author') || 'A')
            },
            content: formData.get('content'),
            timestamp: new Date().toISOString(),
            likes: 0,
            replies: []
        };

        this.comments.push(commentData);
        this.displayComment(commentData);
        this.commentForm.reset();
    }

    loadComments() {
        if (!this.commentsContainer) return;

        const currentArticleId = this.getCurrentArticleId();
        const articleComments = this.comments.filter(comment => comment.articleId === currentArticleId);

        if (articleComments.length === 0) {
            this.commentsContainer.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
        } else {
            const commentsHTML = articleComments.map(comment => this.createCommentHTML(comment)).join('');
            this.commentsContainer.innerHTML = commentsHTML;
        }
    }

    displayComment(comment) {
        if (!this.commentsContainer) return;

        const commentHTML = this.createCommentHTML(comment);
        this.commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
    }

    createCommentHTML(comment) {
        const date = new Date(comment.timestamp).toLocaleDateString();
        return `
            <div class="comment-item">
                <div class="comment-avatar">${comment.author.avatar}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author.name}</span>
                        <span class="comment-date">${date}</span>
                    </div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-actions">
                        <button class="comment-like" data-comment-id="${comment.id}">👍 ${comment.likes}</button>
                        <button class="comment-reply" data-comment-id="${comment.id}">Reply</button>
                    </div>
                </div>
            </div>
        `;
    }

    getCurrentArticleId() {
        const path = window.location.pathname;
        const matches = path.match(/articles\/([^\/]+)/);
        return matches ? matches[1] : null;
    }

    generateAvatar(name) {
        return name.substring(0, 2).toUpperCase();
    }
}

// Article interactions
class ArticleManager {
    constructor(articles) {
        this.articles = articles;
        this.likeButtons = document.querySelectorAll('.like-button, .action-button');
        this.shareButtons = document.querySelectorAll('.share-button');
        this.init();
    }

    init() {
        this.likeButtons.forEach(button => {
            if (button.textContent.includes('Like')) {
                button.addEventListener('click', this.handleLike.bind(this));
            }
        });

        this.shareButtons.forEach(button => {
            button.addEventListener('click', this.handleShare.bind(this));
        });
    }

    handleLike(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const isLiked = button.classList.contains('liked');
        
        if (isLiked) {
            button.classList.remove('liked');
            button.textContent = button.textContent.replace('👍', '👍');
        } else {
            button.classList.add('liked');
            button.textContent = button.textContent.replace('👍', '👍');
        }
    }

    handleShare(event) {
        event.preventDefault();
        const url = window.location.href;
        const title = document.title;
        
        if (navigator.share) {
            navigator.share({
                title: title,
                url: url
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    }
}

// Image upload functionality
class ImageUploadManager {
    constructor() {
        this.uploadInputs = document.querySelectorAll('.image-upload');
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.init();
    }

    init() {
        this.uploadInputs.forEach(input => {
            input.addEventListener('change', this.handleFileSelect.bind(this));
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (this.validateFile(file)) {
            this.uploadFile(file, event.target);
        }
    }

    validateFile(file) {
        if (!file) return false;
        
        if (!this.allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPG, PNG, WebP, or GIF)');
            return false;
        }
        
        if (file.size > this.maxFileSize) {
            alert('File size must be less than 5MB');
            return false;
        }
        
        return true;
    }

    uploadFile(file, inputElement) {
        const formData = new FormData();
        formData.append('image', file);
        
        // Show loading state
        this.showLoading(inputElement);
        
        // Simulate upload (in a real app, this would be an actual API call)
        setTimeout(() => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.handleUploadSuccess(e.target.result, inputElement);
            };
            reader.readAsDataURL(file);
        }, 1000);
    }

    showLoading(inputElement) {
        const preview = inputElement.nextElementSibling;
        if (preview) {
            preview.innerHTML = '<div class="upload-loading">Uploading...</div>';
        }
    }

    handleUploadSuccess(dataUrl, inputElement) {
        const preview = inputElement.nextElementSibling;
        if (preview) {
            preview.innerHTML = `<img src="${dataUrl}" alt="Uploaded image" class="uploaded-image">`;
        }
        
        // Store the image URL for form submission
        inputElement.dataset.uploadedUrl = dataUrl;
    }

    handleUploadError(error, inputElement) {
        const preview = inputElement.nextElementSibling;
        if (preview) {
            preview.innerHTML = '<div class="upload-error">Upload failed. Please try again.</div>';
        }
        console.error('Upload error:', error);
    }
}

// Initialize the blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing BlogManager...');
    new BlogManager();
});

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
}

// Post creation functionality
class PostManager {
    constructor() {
        this.postForm = document.querySelector('#post-form');
        this.postActions = document.querySelectorAll('.post-action[data-type]');
        this.imageUploadContainer = document.querySelector('.image-upload-container');
        this.init();
    }

    init() {
        if (this.postForm) {
            this.postForm.addEventListener('submit', this.handleSubmit.bind(this));
        }

        this.postActions.forEach(action => {
            action.addEventListener('click', this.handleActionClick.bind(this));
        });
    }

    handleActionClick(event) {
        const type = event.currentTarget.dataset.type;
        
        if (type === 'photo') {
            this.toggleImageUpload();
        } else if (type === 'article') {
            // Redirect to article creation page
            window.location.href = 'articles/create/';
        } else if (type === 'video') {
            // Handle video upload
            alert('Video upload functionality coming soon!');
        }
    }

    toggleImageUpload() {
        if (this.imageUploadContainer) {
            const isVisible = this.imageUploadContainer.style.display !== 'none';
            this.imageUploadContainer.style.display = isVisible ? 'none' : 'block';
        }
    }

    handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const content = formData.get('content');
        
        if (!content.trim()) {
            alert('Please enter some content before posting.');
            return;
        }

        // Simulate post creation
        this.createPost(content, formData.get('image'));
    }

    createPost(content, image) {
        // In a real application, this would send data to a server
        console.log('Creating post:', { content, image });
        
        // Show success message
        alert('Post created successfully!');
        
        // Reset form
        this.postForm.reset();
        if (this.imageUploadContainer) {
            this.imageUploadContainer.style.display = 'none';
        }
    }

}

// Initialize the blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing BlogManager...');
    new BlogManager();
});

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlogManager, SearchManager, CommentsManager, ArticleManager, ImageUploadManager, PostManager };
}
