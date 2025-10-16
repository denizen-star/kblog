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

        // SEO preview updates
        const titleInput = document.getElementById('article-title');
        const excerptInput = document.getElementById('article-excerpt');
        
        if (titleInput) {
            titleInput.addEventListener('input', this.updateSEOPreview.bind(this));
        }
        
        if (excerptInput) {
            excerptInput.addEventListener('input', this.updateSEOPreview.bind(this));
        }
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
            this.updateSEOPreview();
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

    updateSEOPreview() {
        const title = document.getElementById('article-title').value;
        const excerpt = document.getElementById('article-excerpt').value;
        
        const seoTitle = document.getElementById('seo-title');
        const seoDescription = document.getElementById('seo-description');

        if (seoTitle) {
            seoTitle.textContent = title || 'Your article title will appear here';
        }

        if (seoDescription) {
            seoDescription.textContent = excerpt || 'Your article description will appear here';
        }
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

        // Simulate API call
        setTimeout(() => {
            console.log('Article created:', articleData);
            
            // Show success message
            this.showNotification('Article published successfully!', 'success');
            
            // Redirect to the new article (in a real app, this would be the actual article URL)
            setTimeout(() => {
                window.location.href = '../../articles/';
            }, 2000);
            
            // Reset button
            publishBtn.textContent = originalText;
            publishBtn.disabled = false;
        }, 2000);
    }

    saveDraft() {
        const formData = new FormData(this.form);
        const draftData = this.collectArticleData(formData);
        draftData.status = 'draft';

        // Save to localStorage (in a real app, this would be saved to a server)
        const drafts = JSON.parse(localStorage.getItem('article_drafts') || '[]');
        drafts.push({
            ...draftData,
            savedAt: new Date().toISOString()
        });
        localStorage.setItem('article_drafts', JSON.stringify(drafts));

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

        // Save to localStorage
        localStorage.setItem('article_autosave', JSON.stringify(autoSaveData));
        
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
