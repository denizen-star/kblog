// Articles page functionality
class ArticlesPageManager {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.currentPage = 1;
        this.articlesPerPage = 6;
        this.currentCategory = '';
        this.currentSort = 'date';
        this.init();
    }

    async init() {
        await this.loadArticles();
        this.setupEventListeners();
        this.renderArticles();
        this.renderPagination();
    }

    async loadArticles() {
        try {
            const response = await fetch(`${window.blogConfig.getStaticUrl('data/articles.json')}?t=${Date.now()}`);
            const data = await response.json();
            this.articles = data.articles;
            this.filteredArticles = [...this.articles];
            console.log('Articles loaded:', this.articles.length);
        } catch (error) {
            console.error('Error loading articles:', error);
            this.articles = [];
            this.filteredArticles = [];
        }
    }

    setupEventListeners() {
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.filterAndSortArticles();
            });
        }

        // Sort filter
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.filterAndSortArticles();
            });
        }

        // Search functionality (inherited from main.js)
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }
    }

    filterAndSortArticles() {
        // Filter by category
        if (this.currentCategory) {
            this.filteredArticles = this.articles.filter(article => 
                article.category === this.currentCategory
            );
        } else {
            this.filteredArticles = [...this.articles];
        }

        // Sort articles
        this.sortArticles();
        
        // Reset to first page
        this.currentPage = 1;
        
        // Re-render
        this.renderArticles();
        this.renderPagination();
    }

    sortArticles() {
        switch (this.currentSort) {
            case 'date':
                this.filteredArticles.sort((a, b) => new Date(b.published) - new Date(a.published));
                break;
            case 'popularity':
                this.filteredArticles.sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
                break;
            case 'title':
                this.filteredArticles.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
    }

    handleSearch(event) {
        const query = event.target.value.toLowerCase();
        if (query.length > 2) {
            this.filteredArticles = this.articles.filter(article => 
                article.title.toLowerCase().includes(query) ||
                article.excerpt.toLowerCase().includes(query) ||
                article.tags.some(tag => tag.toLowerCase().includes(query)) ||
                article.author.name.toLowerCase().includes(query)
            );
        } else {
            this.filterAndSortArticles();
        }
        
        this.currentPage = 1;
        this.renderArticles();
        this.renderPagination();
    }

    renderArticles() {
        const articlesGrid = document.getElementById('articles-grid');
        if (!articlesGrid) return;

        const startIndex = (this.currentPage - 1) * this.articlesPerPage;
        const endIndex = startIndex + this.articlesPerPage;
        const articlesToShow = this.filteredArticles.slice(startIndex, endIndex);

        if (articlesToShow.length === 0) {
            articlesGrid.innerHTML = '<div class="no-articles">No articles found matching your criteria.</div>';
            return;
        }

        const articlesHTML = articlesToShow.map(article => this.createArticleCard(article)).join('');
        articlesGrid.innerHTML = articlesHTML;

        // Add event listeners to new article cards
        this.addArticleEventListeners();
    }

    getArticleImage(article) {
        // Check if article has a featured image and it's not a placeholder
        if (article.image && article.image !== 'placeholder.jpg' && article.image !== '') {
            const imagePath = `assets/images/articles/${article.image}`;
            // Create image with error handling
            return `<img src="${imagePath}" alt="${article.title}" style="width: 100%; height: 100%; object-fit: cover; object-position: top;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="display: none; width: 100%; height: 100%; background: linear-gradient(45deg, #6A7B9A, #8B9DC3); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; position: absolute; top: 0; left: 0;">${article.author.avatar}</div>`;
        }
        
        // Return author avatar as fallback with proper styling
        return `<div style="width: 100%; height: 100%; background: linear-gradient(45deg, #6A7B9A, #8B9DC3); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; position: absolute; top: 0; left: 0;">${article.author.avatar}</div>`;
    }

    createArticleCard(article) {
        const publishedDate = new Date(article.published).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const tagsHTML = article.tags.map(tag => 
            `<span class="article-tag">${tag}</span>`
        ).join('');

        return `
            <article class="article-card-grid" data-article-id="${article.id}">
                <div class="article-image-container">
                    ${this.getArticleImage(article)}
                    <div class="article-category">${article.category}</div>
                </div>
                
                <div class="article-content-grid">
                    <div class="article-header-grid">
                        <div class="article-avatar-small">${article.author.avatar}</div>
                        <div class="article-info-grid">
                            <div class="article-author">${article.author.name}</div>
                            <div class="article-meta">${article.author.role} • ${publishedDate}</div>
                        </div>
                    </div>
                    
                    <h3 class="article-title-grid">
                        <a href="${article.id}/">${article.title}</a>
                    </h3>
                    
                    <p class="article-excerpt-grid">${article.excerpt}</p>
                    
                    <div class="article-tags">${tagsHTML}</div>
                    
                    <div class="article-stats">
                        <span class="stat-item">${article.readTime} min read</span>
                        <span class="stat-item">${article.likes} likes</span>
                        <span class="stat-item">${article.comments} comments</span>
                    </div>
                </div>
            </article>
        `;
    }

    addArticleEventListeners() {
        // Add any specific event listeners for article cards here
        const articleCards = document.querySelectorAll('.article-card-grid');
        articleCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('a')) {
                    const articleId = card.dataset.articleId;
                    window.location.href = `${articleId}/`;
                }
            });
        });
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredArticles.length / this.articlesPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination-container">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage - 1}">Previous</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="pagination-btn active" data-page="${i}">${i}</button>`;
            } else {
                paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage + 1}">Next</button>`;
        }
        
        paginationHTML += '</div>';
        pagination.innerHTML = paginationHTML;

        // Add event listeners to pagination buttons
        const paginationBtns = document.querySelectorAll('.pagination-btn');
        paginationBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            });
        });
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderArticles();
        this.renderPagination();
        
        // Scroll to top of articles
        const articlesGrid = document.getElementById('articles-grid');
        if (articlesGrid) {
            articlesGrid.scrollIntoView({ behavior: 'smooth' });
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ArticlesPageManager();
});
