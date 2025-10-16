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
        this.loadComments();
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

    async loadComments() {
        try {
            const response = await fetch('../../data/comments.json');
            const data = await response.json();
            this.comments = data.comments.filter(comment => comment.articleId === this.articleId);
            this.renderComments();
        } catch (error) {
            console.error('Error loading comments:', error);
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
        // Like button
        const likeButton = document.querySelector('.like-button');
        if (likeButton) {
            likeButton.addEventListener('click', this.handleLike.bind(this));
        }

        // Share button
        const shareButton = document.querySelector('.share-button');
        if (shareButton) {
            shareButton.addEventListener('click', this.handleShare.bind(this));
        }

        // Bookmark button
        const bookmarkButton = document.querySelector('.bookmark-button');
        if (bookmarkButton) {
            bookmarkButton.addEventListener('click', this.handleBookmark.bind(this));
        }

        // Comment form
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', this.handleCommentSubmit.bind(this));
        }

        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', this.handleNewsletterSubmit.bind(this));
        }
    }

    handleLike(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const isLiked = button.classList.contains('liked');
        
        if (isLiked) {
            button.classList.remove('liked');
            const countElement = button.querySelector('.action-count');
            if (countElement) {
                const currentCount = parseInt(countElement.textContent);
                countElement.textContent = currentCount - 1;
            }
        } else {
            button.classList.add('liked');
            const countElement = button.querySelector('.action-count');
            if (countElement) {
                const currentCount = parseInt(countElement.textContent);
                countElement.textContent = currentCount + 1;
            }
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
                this.showNotification('Link copied to clipboard!');
            }).catch(() => {
                this.showNotification('Unable to copy link. Please copy manually.');
            });
        }
    }

    handleBookmark(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const isBookmarked = button.classList.contains('bookmarked');
        
        if (isBookmarked) {
            button.classList.remove('bookmarked');
            this.showNotification('Removed from bookmarks');
        } else {
            button.classList.add('bookmarked');
            this.showNotification('Added to bookmarks');
        }
    }

    handleCommentSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const content = formData.get('content');
        const author = formData.get('author') || 'Anonymous';
        
        if (!content.trim()) {
            this.showNotification('Please enter a comment.');
            return;
        }

        const newComment = {
            id: 'comment-' + Date.now(),
            articleId: this.articleId,
            author: {
                name: author,
                avatar: this.generateAvatar(author)
            },
            content: content,
            timestamp: new Date().toISOString(),
            likes: 0,
            replies: []
        };

        this.comments.unshift(newComment);
        this.renderComments();
        this.updateCommentCount();
        
        // Reset form
        event.target.reset();
        this.showNotification('Comment posted successfully!');
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

    renderComments() {
        const commentsContainer = document.getElementById('comments-container');
        if (!commentsContainer) return;

        if (this.comments.length === 0) {
            commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        const commentsHTML = this.comments.map(comment => this.createCommentHTML(comment)).join('');
        commentsContainer.innerHTML = commentsHTML;

        // Add event listeners to comment actions
        this.addCommentEventListeners();
    }

    createCommentHTML(comment) {
        const date = new Date(comment.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-avatar">${comment.author.avatar}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author.name}</span>
                        <span class="comment-date">${date}</span>
                    </div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-actions">
                        <button class="comment-like" data-comment-id="${comment.id}">
                            👍 ${comment.likes}
                        </button>
                        <button class="comment-reply" data-comment-id="${comment.id}">
                            Reply
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addCommentEventListeners() {
        const likeButtons = document.querySelectorAll('.comment-like');
        likeButtons.forEach(button => {
            button.addEventListener('click', this.handleCommentLike.bind(this));
        });

        const replyButtons = document.querySelectorAll('.comment-reply');
        replyButtons.forEach(button => {
            button.addEventListener('click', this.handleCommentReply.bind(this));
        });
    }

    handleCommentLike(event) {
        event.preventDefault();
        const commentId = event.currentTarget.dataset.commentId;
        const comment = this.comments.find(c => c.id === commentId);
        
        if (comment) {
            comment.likes += 1;
            event.currentTarget.textContent = `👍 ${comment.likes}`;
        }
    }

    handleCommentReply(event) {
        event.preventDefault();
        const commentId = event.currentTarget.dataset.commentId;
        // In a real app, this would open a reply form
        this.showNotification('Reply functionality coming soon!');
    }

    updateCommentCount() {
        const commentsHeader = document.querySelector('.comments-header h2');
        if (commentsHeader) {
            commentsHeader.textContent = `Comments (${this.comments.length})`;
        }
    }

    generateAvatar(name) {
        return name.substring(0, 2).toUpperCase();
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
