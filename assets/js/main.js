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

            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    initializeComponents() {
        this.searchManager = new SearchManager(this.articles);
        this.commentsManager = new CommentsManager(this.comments);
        this.articleManager = new ArticleManager(this.articles);
        this.imageUploadManager = new ImageUploadManager();
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
    module.exports = { BlogManager, SearchManager, CommentsManager, ArticleManager, ImageUploadManager };
}
