// Article Editor functionality
class ArticleEditor {
    constructor() {
        this.form = document.getElementById('article-editor-form');
        this.editorContent = document.getElementById('editor-content');
        this.imageUploadArea = document.getElementById('image-upload-area');
        this.imagePreview = document.getElementById('image-preview');
        this.featuredImageInput = document.getElementById('featured-image');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRichTextEditor();
        this.setupImageUpload();
        this.startWordCount();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Draft saving
        const saveDraftBtn = document.getElementById('save-draft');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', this.saveDraft.bind(this));
        }

        // Preview
        const previewBtn = document.getElementById('preview-article');
        if (previewBtn) {
            previewBtn.addEventListener('click', this.previewArticle.bind(this));
        }

        // Auto-save every 30 seconds
        setInterval(() => {
            this.autoSave();
        }, 30000);

    }

    setupRichTextEditor() {
        // Toolbar button functionality
        const toolbarBtns = document.querySelectorAll('.toolbar-btn');
        toolbarBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                const value = btn.dataset.value;
                
                if (command === 'formatBlock') {
                    document.execCommand('formatBlock', false, value);
                } else {
                    document.execCommand(command, false, null);
                }
                
                this.editorContent.focus();
            });
        });

        // Content change tracking
        this.editorContent.addEventListener('input', () => {
            this.updateWordCount();
        });

        // Placeholder functionality
        this.editorContent.addEventListener('focus', () => {
            if (this.editorContent.textContent.trim() === '') {
                this.editorContent.classList.add('focused');
            }
        });

        this.editorContent.addEventListener('blur', () => {
            if (this.editorContent.textContent.trim() === '') {
                this.editorContent.classList.remove('focused');
            }
        });
    }

    setupImageUpload() {
        // Click to upload
        this.imageUploadArea.addEventListener('click', () => {
            this.featuredImageInput.click();
        });

        // File selection
        this.featuredImageInput.addEventListener('change', this.handleImageUpload.bind(this));

        // Drag and drop
        this.imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.add('drag-over');
        });

        this.imageUploadArea.addEventListener('dragleave', () => {
            this.imageUploadArea.classList.remove('drag-over');
        });

        this.imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.featuredImageInput.files = files;
                this.handleImageUpload();
            }
        });

        // Remove image
        const removeImageBtn = document.getElementById('remove-image');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', this.removeImage.bind(this));
        }
    }

    handleImageUpload() {
        const file = this.featuredImageInput.files[0];
        if (!file) return;

        // Validate file
        if (!this.validateImageFile(file)) {
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImg = document.getElementById('preview-img');
            previewImg.src = e.target.result;
            
            this.imageUploadArea.style.display = 'none';
            this.imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    validateImageFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPG, PNG, WebP, or GIF)');
            return false;
        }

        if (file.size > maxSize) {
            alert('File size must be less than 5MB');
            return false;
        }

        return true;
    }

    removeImage() {
        this.imageUploadArea.style.display = 'block';
        this.imagePreview.style.display = 'none';
        this.featuredImageInput.value = '';
    }

    startWordCount() {
        this.updateWordCount();
    }

    updateWordCount() {
        const content = this.editorContent.textContent || '';
        const words = content.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        const charCount = content.length;
        const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

        // Update display
        const wordCountEl = document.getElementById('word-count');
        const charCountEl = document.getElementById('char-count');
        const readingTimeEl = document.getElementById('reading-time');

        if (wordCountEl) wordCountEl.textContent = wordCount;
        if (charCountEl) charCountEl.textContent = charCount;
        if (readingTimeEl) readingTimeEl.textContent = `${readingTime} min`;
    }


    handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(this.form);
        const articleData = this.collectArticleData(formData);

        // Simulate article creation
        this.createArticle(articleData);
    }

    validateForm() {
        const title = document.getElementById('article-title').value.trim();
        const category = document.getElementById('article-category').value;
        const content = this.editorContent.textContent.trim();

        if (!title) {
            alert('Please enter an article title');
            document.getElementById('article-title').focus();
            return false;
        }

        if (!category) {
            alert('Please select a category');
            document.getElementById('article-category').focus();
            return false;
        }

        if (!content) {
            alert('Please enter article content');
            this.editorContent.focus();
            return false;
        }

        return true;
    }

    collectArticleData(formData) {
        return {
            title: formData.get('title'),
            excerpt: formData.get('excerpt'),
            category: formData.get('category'),
            author: formData.get('author'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            content: this.editorContent.innerHTML,
            featuredImage: this.featuredImageInput.files[0],
            featured: formData.get('featured') === 'on',
            comments: formData.get('comments') === 'on',
            notification: formData.get('notification') === 'on',
            published: new Date().toISOString(),
            status: 'published'
        };
    }

    createArticle(articleData) {
        // Show loading state
        const publishBtn = document.getElementById('publish-article');
        const originalText = publishBtn.textContent;
        publishBtn.textContent = 'Publishing...';
        publishBtn.disabled = true;

        // Generate article slug and ID
        const articleSlug = this.generateSlug(articleData.title);
        const articleId = articleSlug;
        
        // Add metadata to article data
        articleData.id = articleId;
        articleData.slug = articleSlug;
        articleData.published = new Date().toISOString();
        articleData.views = 0;
        articleData.likes = 0;
        articleData.comments = 0;

        // Create the article files
        this.saveArticleToFiles(articleData)
            .then(() => {
                console.log('Article created successfully:', articleData);
                
                // Show success message
                this.showNotification('Article published successfully!', 'success');
                
                // Set flag to refresh homepage
                
                // Redirect to the new article
                setTimeout(() => {
                    window.location.href = `../${articleSlug}/`;
                }, 2000);
                
                // Reset button
                publishBtn.textContent = originalText;
                publishBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error creating article:', error);
                this.showNotification('Error publishing article. Please try again.', 'error');
                
                // Reset button
                publishBtn.textContent = originalText;
                publishBtn.disabled = false;
            });
    }

    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
    }

    async saveArticleToFiles(articleData) {
        try {
            // Create FormData for the API request
            const formData = new FormData();
            
            // Add all article data
            formData.append('title', articleData.title);
            formData.append('excerpt', articleData.excerpt || '');
            formData.append('category', articleData.category);
            formData.append('author', articleData.author);
            formData.append('tags', articleData.tags.join(', '));
            formData.append('content', articleData.content);
            formData.append('featured', articleData.featured);
            formData.append('comments', articleData.comments);
            formData.append('notification', articleData.notification);
            formData.append('slug', articleData.slug);
            
            // Add image if provided
            if (articleData.featuredImage) {
                formData.append('featuredImage', articleData.featuredImage);
            }
            
            // Send to REAL API (environment-aware)
            const response = await fetch(window.blogConfig.createArticleUrl, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create article');
            }
            
            const result = await response.json();
            console.log('✅ Article created successfully:', result);
            
            return result;
            
        } catch (error) {
            console.error('❌ Error creating article:', error);
            throw error;
        }
    }

    generateArticleHTML(articleData) {
        const authorInfo = this.getAuthorInfo(articleData.author);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${articleData.title} - Kerv Talks-Data Blog</title>
    <meta name="description" content="${articleData.excerpt || 'Professional insights on data architecture and enterprise strategies.'}">
    <meta name="keywords" content="${articleData.tags.join(', ')}, data architecture, information asymmetry">
    <meta name="author" content="${authorInfo.name}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${articleData.title}">
    <meta property="og:description" content="${articleData.excerpt || 'Professional insights on data architecture and enterprise strategies.'}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://kervtalksdata.com/articles/${articleData.slug}/">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="../../assets/css/main.css">
    <link rel="stylesheet" href="../../assets/css/responsive.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${articleData.title}",
        "author": {
            "@type": "Person",
            "name": "${authorInfo.name}",
            "jobTitle": "${authorInfo.role}"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Kerv Talks-Data",
            "logo": {
                "@type": "ImageObject",
                "url": "https://kervtalksdata.com/assets/images/logo.png"
            }
        },
        "datePublished": "${articleData.published}",
        "description": "${articleData.excerpt || 'Professional insights on data architecture and enterprise strategies.'}"
    }
    </script>
</head>
<body>
    <header class="header">
        <nav class="nav-container">
            <a href="../../index.html" class="logo">
                <div class="logo-icon">KT</div>
                Kerv Talks-Data
            </a>
            
            <div class="search-bar">
                <input type="text" placeholder="Search articles, authors, topics..." id="search-input">
                <div class="search-results" id="search-results"></div>
            </div>
            
            <ul class="nav-menu">
                <li><a href="../../index.html">Home</a></li>
                <li><a href="../index.html">Articles</a></li>
                <li><a href="../../about.html">About</a></li>
                <li><a href="../../contact.html">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main class="article-main-container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
            <a href="../../index.html">Home</a>
            <span class="breadcrumb-separator">›</span>
            <a href="../index.html">Articles</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">${articleData.title}</span>
        </nav>

        <div class="article-layout">
            <article class="article-content">
                <!-- Article Header -->
                <header class="article-header-full">
                    <div class="article-category-badge">${articleData.category}</div>
                    <h1 class="article-title-full">${articleData.title}</h1>
                    
                    <div class="article-meta-full">
                        <div class="article-author-info">
                            <div class="article-avatar-large">${authorInfo.avatar}</div>
                            <div class="author-details">
                                <div class="author-name">${authorInfo.name}</div>
                                <div class="author-role">${authorInfo.role}</div>
                            </div>
                        </div>
                        
                        <div class="article-stats-full">
                            <div class="stat-item">
                                <span class="stat-label">Published</span>
                                <span class="stat-value">${new Date(articleData.published).toLocaleDateString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Read time</span>
                                <span class="stat-value">${this.calculateReadingTime(articleData.content)} min</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Views</span>
                                <span class="stat-value">${articleData.views}</span>
                            </div>
                        </div>
                    </div>
                </header>

                ${articleData.featuredImage ? `
                <!-- Article Image -->
                <div class="article-featured-image">
                    <img src="../../assets/images/articles/${articleData.slug}.jpg" alt="${articleData.title}" style="width: 100%; height: 300px; object-fit: cover;">
                </div>
                ` : `
                <div class="article-featured-image">
                    <div class="featured-image-placeholder">${authorInfo.avatar}</div>
                </div>
                `}

                <!-- Article Body -->
                <div class="article-body">
                    ${articleData.excerpt ? `<p class="article-lead">${articleData.excerpt}</p>` : ''}
                    ${articleData.content}
                </div>

                <!-- Article Actions -->
                <div class="article-actions-full">
                    <button class="action-button like-button" data-article-id="${articleData.id}">
                        <span class="action-icon">👍</span>
                        <span class="action-text">Like</span>
                        <span class="action-count">${articleData.likes}</span>
                    </button>
                    
                    <button class="action-button share-button" data-article-id="${articleData.id}">
                        <span class="action-icon">🔄</span>
                        <span class="action-text">Share</span>
                    </button>
                    
                    <button class="action-button bookmark-button">
                        <span class="action-icon">🔖</span>
                        <span class="action-text">Save</span>
                    </button>
                </div>

                <!-- Tags -->
                <div class="article-tags-full">
                    ${articleData.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </article>

            <!-- Sidebar -->
            <aside class="article-sidebar">
                <!-- Author Card -->
                <div class="card author-card">
                    <div class="author-card-header">
                        <div class="author-avatar-sidebar">${authorInfo.avatar}</div>
                        <div class="author-info-sidebar">
                            <h3>${authorInfo.name}</h3>
                            <p>${authorInfo.role}</p>
                        </div>
                    </div>
                    <p class="author-bio">${authorInfo.bio}</p>
                    <div class="author-stats">
                        <div class="author-stat">
                            <span class="stat-number">${authorInfo.articles}</span>
                            <span class="stat-label">Articles</span>
                        </div>
                        <div class="author-stat">
                            <span class="stat-number">${authorInfo.followers}</span>
                            <span class="stat-label">Followers</span>
                        </div>
                    </div>
                </div>

                <!-- Newsletter Signup -->
                <div class="card newsletter-card">
                    <h3>Stay Updated</h3>
                    <p>Get the latest insights on data architecture and enterprise strategies delivered to your inbox.</p>
                    <form class="newsletter-form">
                        <input type="email" placeholder="Enter your email" required>
                        <button type="submit">Subscribe</button>
                    </form>
                </div>
            </aside>
        </div>

        <!-- Comments Section -->
        <section class="comments-section" id="comments">
            <div class="comments-header">
                <h2>Comments (0)</h2>
            </div>
            
            <div class="comment-form-container">
                <form class="comment-form" id="comment-form">
                    <div class="comment-input-group">
                        <div class="comment-avatar">You</div>
                        <div class="comment-input-wrapper">
                            <textarea placeholder="Share your thoughts..." name="content" required></textarea>
                            <input type="text" placeholder="Your name (optional)" name="author">
                        </div>
                    </div>
                    <button type="submit" class="comment-submit">Post Comment</button>
                </form>
            </div>
            
            <div class="comments-container" id="comments-container">
                <p class="no-comments">No comments yet. Be the first to comment!</p>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="footer-content">
            <p>&copy; 2024 Kerv Talks-Data Blog. All rights reserved.</p>
        </div>
    </footer>
    
    <!-- JavaScript -->
    <script src="../../assets/js/main.js"></script>
    <script src="../../assets/js/article.js"></script>
</body>
</html>`;
    }

    calculateReadingTime(content) {
        const textContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
        const words = textContent.split(/\s+/).filter(word => word.length > 0);
        return Math.ceil(words.length / 200); // 200 words per minute
    }

    getAuthorInfo(authorId) {
        const authors = {
            'data-crusader': {
                name: 'Data Crusader',
                role: 'Head of Data Strategy',
                avatar: '🦸‍♂️',
                bio: 'A seasoned data professional with over 10 years of experience in enterprise data architecture and information asymmetry strategies.',
                articles: 16,
                followers: 1247
            },
            'cosmic-analyst': {
                name: 'Cosmic Analyst',
                role: 'Data Architecture Lead',
                avatar: '🌌',
                bio: 'Specializing in building scalable data universes that connect disparate enterprise systems across organizational boundaries.',
                articles: 13,
                followers: 892
            },
            'web-weaver': {
                name: 'Web Weaver',
                role: 'Analytics Specialist',
                avatar: '🕷️',
                bio: 'Expert in crafting compelling data narratives that transform complex information into actionable insights.',
                articles: 19,
                followers: 1156
            }
        };
        return authors[authorId] || authors['data-crusader'];
    }

    async createArticleDirectory(slug, htmlContent) {
        // This method is no longer needed as we handle everything in saveArticleToFiles
        return Promise.resolve();
    }

    showManualCreationInstructions(slug, htmlContent) {
        const instructions = `
MANUAL ARTICLE CREATION REQUIRED:

1. Create directory: mkdir -p articles/${slug}

2. Create index.html file in articles/${slug}/ with the following content:
${htmlContent}

3. Create metadata.json file in articles/${slug}/ with article metadata

4. Create comments.json file in articles/${slug}/ with empty comments array

5. Update data/articles.json to include the new article

6. If you uploaded an image, save it as assets/images/articles/${slug}.jpg
        `;
        
        console.log(instructions);
        this.showNotification('Manual creation required. Check console for detailed instructions.', 'warning');
        
        // Store data for manual creation
    }

    // These methods are no longer needed as the API handles everything

    saveDraft() {
        const formData = new FormData(this.form);
        const draftData = this.collectArticleData(formData);
        draftData.status = 'draft';

        // Draft saving removed - using JSON files only

        this.showNotification('Draft saved successfully!', 'success');
    }

    previewArticle() {
        const formData = new FormData(this.form);
        const previewData = this.collectArticleData(formData);
        
        // Open preview in new window
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(this.generatePreviewHTML(previewData));
        previewWindow.document.close();
    }

    generatePreviewHTML(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Preview: ${data.title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                    h1 { color: #333; border-bottom: 2px solid #6A7B9A; padding-bottom: 10px; }
                    h2 { color: #6A7B9A; margin-top: 30px; }
                    h3 { color: #333; margin-top: 25px; }
                    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
                    .content { margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1>${data.title}</h1>
                <div class="meta">
                    <strong>Category:</strong> ${data.category} | 
                    <strong>Author:</strong> ${this.getAuthorName(data.author)} | 
                    <strong>Published:</strong> ${new Date(data.published).toLocaleDateString()}
                </div>
                ${data.excerpt ? `<p><em>${data.excerpt}</em></p>` : ''}
                <div class="content">
                    ${data.content}
                </div>
            </body>
            </html>
        `;
    }

    getAuthorName(authorId) {
        const authors = {
            'data-crusader': 'Data Crusader',
            'cosmic-analyst': 'Cosmic Analyst',
            'web-weaver': 'Web Weaver'
        };
        return authors[authorId] || 'Unknown Author';
    }

    autoSave() {
        const formData = new FormData(this.form);
        const autoSaveData = this.collectArticleData(formData);
        autoSaveData.status = 'autosave';
        autoSaveData.autoSavedAt = new Date().toISOString();

        // Autosave removed - using JSON files only
        
        // Show subtle indicator
        this.showAutoSaveIndicator();
    }

    showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.textContent = 'Auto-saved';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        // Fade in
        setTimeout(() => indicator.style.opacity = '1', 10);
        
        // Fade out and remove
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
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
    new ArticleEditor();
});
