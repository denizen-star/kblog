// Main JavaScript functionality for Kerv Talks-Data Blog
// Version: 5.0 - NO LOCALSTORAGE, JSON FILES ONLY
console.log('🚀 Loading main.js v5.0 - JSON FILES ONLY');

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
    }


    async loadData() {
        try {
            // Ensure blogConfig is available
            if (!window.blogConfig) {
                console.error('❌ blogConfig not available');
                return;
            }

            // Load articles data with cache busting
            const articlesResponse = await fetch(`${window.blogConfig.getStaticUrl('data/articles.json')}?t=${Date.now()}`);
            const articlesData = await articlesResponse.json();
            this.articles = articlesData.articles;

            // Load comments data
            const commentsResponse = await fetch(window.blogConfig.getStaticUrl('data/comments.json'));
            const commentsData = await commentsResponse.json();
            this.comments = commentsData.comments;

            // Load authors data
            const authorsResponse = await fetch(window.blogConfig.getStaticUrl('data/authors.json'));
            const authorsData = await authorsResponse.json();
            this.authors = authorsData.authors;

            console.log('✅ Data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading data:', error);
        }
    }

    initializeComponents() {
        this.searchManager = new SearchManager(this.articles, this);
        this.commentsManager = new CommentsManager(this.comments);
        this.imageUploadManager = new ImageUploadManager();
        this.postManager = new PostManager();
        
        // Hide environment-restricted components
        this.hideEnvironmentRestrictedComponents();
        
        // Homepage articles will be loaded in init() after data is ready
        
    }

    hideEnvironmentRestrictedComponents() {
        // Hide post creation form if not enabled
        const postForm = document.querySelector('#post-form');
        if (postForm && !window.blogConfig.showCreateArticle) {
            const postCard = postForm.closest('.create-post');
            if (postCard) {
                postCard.style.display = 'none';
            }
        }
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.updateArticleStats();
            this.setupNavigation();
            this.setupRefreshButton();
        });
    }

    setupRefreshButton() {
        const refreshBtn = document.getElementById('refresh-articles-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadData().then(() => {
                    this.renderHomepageArticles();
                });
            });
        }
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
        // Hide navigation items based on feature flags
        this.hideFeatureRestrictedItems();
        
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

    hideFeatureRestrictedItems() {
        if (!window.blogConfig) {
            return;
        }
        
        // Hide navigation items that are restricted by feature flags
        const featureRestrictedItems = document.querySelectorAll('[data-feature]');
        
        featureRestrictedItems.forEach(item => {
            const feature = item.getAttribute('data-feature');
            const isEnabled = window.blogConfig.isFeatureEnabled(feature);
            
            if (!isEnabled) {
                // Hide the entire list item (parent <li>)
                const listItem = item.closest('li');
                if (listItem) {
                    listItem.style.display = 'none';
                }
            }
        });
    }

    loadHomepageArticles() {
        // Load articles on both homepage and articles page
        const pathname = window.location.pathname;
        
        // Check if we're on homepage or articles page
        const isHomepage = pathname === '/' || pathname === '/index.html' || pathname.endsWith('index.html');
        const isArticlesPage = pathname.includes('/articles/') || pathname.endsWith('/articles') || pathname.includes('/articles/index.html');
        
        if (isHomepage || isArticlesPage) {
            this.renderHomepageArticles();
        }
    }


    renderHomepageArticles() {
        const container = document.getElementById('articles-container');
        if (!container) return;

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
            const createLink = this.getCreateArticleLink();
            container.innerHTML = `<div style="color: #666; padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px; margin: 20px 0;"><h3>No articles found</h3><p>Start writing your first article to see it here!</p><a href="${createLink}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Create Article</a></div>`;
            console.log('📝 No articles found - showing empty state');
            return;
        }

        // Render each article
        sortedArticles.forEach(article => {
            const articleElement = this.createArticleCard(article);
            container.appendChild(articleElement);
        });

        console.log(`✅ Loaded ${sortedArticles.length} articles on homepage (newest to oldest)`);
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
                <h3 class="article-title"><a href="${this.getArticleLink(article.id)}">${article.title}</a></h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-image">${this.getArticleImage(article)}</div>
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

    getArticleLink(articleId) {
        // Determine correct article link path based on current page
        const pathname = window.location.pathname;
        const isArticlesPage = pathname.includes('/articles/');
        return isArticlesPage ? `${articleId}/` : `articles/${articleId}/`;
    }

    getCreateArticleLink() {
        // Determine correct create article link path based on current page
        const pathname = window.location.pathname;
        const isArticlesPage = pathname.includes('/articles/');
        return isArticlesPage ? 'create/' : 'articles/create/';
    }

    getArticleImage(article) {
        // Check if article has a featured image and it's not a placeholder
        if (article.image && article.image !== 'placeholder.jpg' && article.image !== '') {
            // Determine correct image path based on current page
            const pathname = window.location.pathname;
            const isArticlesPage = pathname.includes('/articles/');
            const imagePath = isArticlesPage ? `../assets/images/articles/${article.image}` : `assets/images/articles/${article.image}`;
            
            // Create image with error handling
            return `<img src="${imagePath}" alt="${article.title}" style="width: 100%; height: 350px; object-fit: cover; object-position: top; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="display: none; width: 100%; height: 350px; background: linear-gradient(45deg, #6A7B9A, #8B9DC3); border-radius: 8px; align-items: center; justify-content: center; color: white; font-size: 3rem;">${article.author.avatar}</div>`;
        }
        
        // Return author avatar as fallback with proper styling
        return `<div style="width: 100%; height: 350px; background: linear-gradient(45deg, #6A7B9A, #8B9DC3); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">${article.author.avatar}</div>`;
    }

}

// Search functionality
class SearchManager {
    constructor(articles, blogManager) {
        this.articles = articles;
        this.blogManager = blogManager;
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
                    <h4><a href="${this.blogManager.getArticleLink(article.id)}">${article.title}</a></h4>
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
            const pathname = window.location.pathname;
            const isArticlesPage = pathname.includes('/articles/');
            const createLink = isArticlesPage ? 'create/' : 'articles/create/';
            window.location.href = createLink;
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
    module.exports = { BlogManager, SearchManager, CommentsManager, ImageUploadManager, PostManager };
}
