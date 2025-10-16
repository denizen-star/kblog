#!/usr/bin/env node

/**
 * Article Management Utility
 * 
 * Commands:
 * - node manage-articles.js list
 * - node manage-articles.js create "Title" "Category" "tag1,tag2"
 * - node manage-articles.js update [slug] [field] [value]
 * - node manage-articles.js archive [slug]
 * - node manage-articles.js stats
 */

const fs = require('fs');
const path = require('path');

class ArticleManager {
    constructor() {
        this.articlesDir = path.join(__dirname, 'articles');
        this.dataDir = path.join(__dirname, 'data');
    }

    // List all articles
    list() {
        console.log('📚 Articles in your blog:\n');
        
        const articles = this.getAllArticles();
        
        if (articles.length === 0) {
            console.log('No articles found.');
            return;
        }

        articles.forEach((article, index) => {
            console.log(`${index + 1}. ${article.title}`);
            console.log(`   📁 Directory: ${article.directory}`);
            console.log(`   📅 Published: ${article.published}`);
            console.log(`   📊 Views: ${article.stats.views} | Likes: ${article.stats.likes}`);
            console.log(`   🏷️  Category: ${article.category} | Tags: ${article.tags.join(', ')}`);
            console.log(`   🔗 URL: /articles/${article.slug}/\n`);
        });

        console.log(`Total: ${articles.length} articles`);
    }

    // Create new article
    create(title, category = 'Technology', tags = '') {
        const slug = this.generateSlug(title);
        const date = new Date().toISOString().split('T')[0];
        const directory = `${date}-${slug}`;
        const articleDir = path.join(this.articlesDir, directory);

        // Create directory
        if (!fs.existsSync(articleDir)) {
            fs.mkdirSync(articleDir, { recursive: true });
        } else {
            console.log(`❌ Article directory already exists: ${directory}`);
            return;
        }

        // Create metadata.json
        const metadata = {
            id: slug,
            slug: slug,
            title: title,
            excerpt: `A new article about ${title.toLowerCase()}.`,
            author: {
                id: "data-crusader",
                name: "Data Crusader",
                avatar: "🦸‍♂️",
                role: "Head of Data Strategy",
                bio: "A seasoned data professional with over 10 years of experience in enterprise data architecture and information asymmetry strategies."
            },
            published: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: "draft",
            readTime: 5,
            category: category,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            image: {
                featured: null,
                alt: `${title} featured image`
            },
            stats: {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0
            },
            seo: {
                metaTitle: `${title} - Kerv Talks-Data Blog`,
                metaDescription: `Professional insights on ${title.toLowerCase()}.`,
                keywords: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                canonical: `https://kervtalksdata.com/articles/${slug}/`
            },
            settings: {
                featured: false,
                allowComments: true,
                notifySubscribers: false,
                archived: false
            },
            content: {
                wordCount: 0,
                characterCount: 0,
                hasImages: false,
                hasCode: false,
                readingLevel: "intermediate"
            }
        };

        fs.writeFileSync(
            path.join(articleDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        // Create comments.json
        const comments = {
            articleId: slug,
            comments: [],
            stats: {
                totalComments: 0,
                totalReplies: 0,
                lastComment: null
            },
            moderation: {
                allowAnonymous: true,
                requireApproval: false,
                maxLength: 1000
            }
        };

        fs.writeFileSync(
            path.join(articleDir, 'comments.json'),
            JSON.stringify(comments, null, 2)
        );

        // Create index.html template
        const htmlTemplate = this.generateHTMLTemplate(metadata);
        fs.writeFileSync(
            path.join(articleDir, 'index.html'),
            htmlTemplate
        );

        console.log(`✅ Created new article: ${title}`);
        console.log(`📁 Directory: ${directory}`);
        console.log(`🔗 URL: /articles/${slug}/`);
        console.log(`📝 Status: Draft (ready for content)`);
    }

    // Update article metadata
    update(slug, field, value) {
        const articleDir = this.findArticleDirectory(slug);
        
        if (!articleDir) {
            console.log(`❌ Article not found: ${slug}`);
            return;
        }

        const metadataPath = path.join(articleDir, 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

        // Update the field
        const fieldPath = field.split('.');
        let current = metadata;
        
        for (let i = 0; i < fieldPath.length - 1; i++) {
            current = current[fieldPath[i]];
        }
        
        current[fieldPath[fieldPath.length - 1]] = value;
        metadata.updated = new Date().toISOString();

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`✅ Updated ${field} to "${value}" for article: ${metadata.title}`);
    }

    // Archive article
    archive(slug) {
        const articleDir = this.findArticleDirectory(slug);
        
        if (!articleDir) {
            console.log(`❌ Article not found: ${slug}`);
            return;
        }

        const metadataPath = path.join(articleDir, 'metadata.json');
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

        metadata.status = "archived";
        metadata.settings.archived = true;
        metadata.updated = new Date().toISOString();

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`✅ Archived article: ${metadata.title}`);
    }

    // Show blog statistics
    stats() {
        const articles = this.getAllArticles();
        const categories = {};
        const authors = {};
        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;

        articles.forEach(article => {
            // Categories
            categories[article.category] = (categories[article.category] || 0) + 1;
            
            // Authors
            authors[article.author.name] = (authors[article.author.name] || 0) + 1;
            
            // Stats
            totalViews += article.stats.views;
            totalLikes += article.stats.likes;
            totalComments += article.stats.comments;
        });

        console.log('📊 Blog Statistics:\n');
        console.log(`📚 Total Articles: ${articles.length}`);
        console.log(`👀 Total Views: ${totalViews}`);
        console.log(`👍 Total Likes: ${totalLikes}`);
        console.log(`💬 Total Comments: ${totalComments}\n`);

        console.log('📂 Categories:');
        Object.entries(categories).forEach(([category, count]) => {
            console.log(`   ${category}: ${count} articles`);
        });

        console.log('\n👤 Authors:');
        Object.entries(authors).forEach(([author, count]) => {
            console.log(`   ${author}: ${count} articles`);
        });
    }

    // Helper methods
    getAllArticles() {
        const articles = [];
        
        if (!fs.existsSync(this.articlesDir)) {
            return articles;
        }

        const directories = fs.readdirSync(this.articlesDir);
        
        directories.forEach(dir => {
            const metadataPath = path.join(this.articlesDir, dir, 'metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    metadata.directory = dir;
                    articles.push(metadata);
                } catch (error) {
                    console.log(`⚠️  Error reading metadata for ${dir}: ${error.message}`);
                }
            }
        });

        return articles.sort((a, b) => new Date(b.published) - new Date(a.published));
    }

    findArticleDirectory(slug) {
        const directories = fs.readdirSync(this.articlesDir);
        
        for (const dir of directories) {
            const metadataPath = path.join(this.articlesDir, dir, 'metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    if (metadata.slug === slug) {
                        return path.join(this.articlesDir, dir);
                    }
                } catch (error) {
                    continue;
                }
            }
        }
        
        return null;
    }

    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    generateHTMLTemplate(metadata) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.seo.metaTitle}</title>
    <meta name="description" content="${metadata.seo.metaDescription}">
    <meta name="keywords" content="${metadata.seo.keywords.join(', ')}">
    <meta name="author" content="${metadata.author.name}">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="../../assets/css/main.css">
    <link rel="stylesheet" href="../../assets/css/responsive.css">
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
            <span class="breadcrumb-current">${metadata.title}</span>
        </nav>

        <div class="article-layout">
            <article class="article-content">
                <header class="article-header-full">
                    <div class="article-category-badge">${metadata.category}</div>
                    <h1 class="article-title-full">${metadata.title}</h1>
                    
                    <div class="article-meta-full">
                        <div class="article-author-info">
                            <div class="article-avatar-large">${metadata.author.avatar}</div>
                            <div class="author-details">
                                <div class="author-name">${metadata.author.name}</div>
                                <div class="author-role">${metadata.author.role}</div>
                            </div>
                        </div>
                        
                        <div class="article-stats-full">
                            <div class="stat-item">
                                <span class="stat-label">Published</span>
                                <span class="stat-value">${new Date(metadata.published).toLocaleDateString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Read time</span>
                                <span class="stat-value">${metadata.readTime} min</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Views</span>
                                <span class="stat-value">${metadata.stats.views}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div class="article-featured-image">
                    <div class="featured-image-placeholder">${metadata.author.avatar}</div>
                </div>

                <div class="article-body">
                    <p class="article-lead">${metadata.excerpt}</p>
                    
                    <h2>Article Content</h2>
                    <p>This article is ready for your content. Start writing your insights on ${metadata.title.toLowerCase()}!</p>
                    
                    <div class="article-tags-full">
                        ${metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>

                <div class="article-actions-full">
                    <button class="action-button like-button" data-article-id="${metadata.id}">
                        <span class="action-icon">👍</span>
                        <span class="action-text">Like</span>
                        <span class="action-count">${metadata.stats.likes}</span>
                    </button>
                    
                    <button class="action-button share-button" data-article-id="${metadata.id}">
                        <span class="action-icon">🔄</span>
                        <span class="action-text">Share</span>
                    </button>
                    
                    <button class="action-button bookmark-button">
                        <span class="action-icon">🔖</span>
                        <span class="action-text">Save</span>
                    </button>
                </div>
            </article>

            <aside class="article-sidebar">
                <div class="card author-card">
                    <div class="author-card-header">
                        <div class="author-avatar-sidebar">${metadata.author.avatar}</div>
                        <div class="author-info-sidebar">
                            <h3>${metadata.author.name}</h3>
                            <p>${metadata.author.role}</p>
                        </div>
                    </div>
                    <p class="author-bio">${metadata.author.bio}</p>
                </div>
            </aside>
        </div>
    </main>

    <footer class="footer">
        <div class="footer-content">
            <p>&copy; 2024 Kerv Talks-Data Blog. All rights reserved.</p>
        </div>
    </footer>
    
    <script src="../../assets/js/main.js"></script>
    <script src="../../assets/js/article.js"></script>
</body>
</html>`;
    }
}

// CLI Interface
const manager = new ArticleManager();
const command = process.argv[2];

switch (command) {
    case 'list':
        manager.list();
        break;
        
    case 'create':
        const title = process.argv[3];
        const category = process.argv[4] || 'Technology';
        const tags = process.argv[5] || '';
        
        if (!title) {
            console.log('Usage: node manage-articles.js create "Article Title" [Category] [tags]');
            console.log('Example: node manage-articles.js create "Data Architecture Patterns" "Architecture" "data,patterns,architecture"');
            process.exit(1);
        }
        
        manager.create(title, category, tags);
        break;
        
    case 'update':
        const slug = process.argv[3];
        const field = process.argv[4];
        const value = process.argv[5];
        
        if (!slug || !field || !value) {
            console.log('Usage: node manage-articles.js update [slug] [field] [value]');
            console.log('Example: node manage-articles.js update my-article category Strategy');
            process.exit(1);
        }
        
        manager.update(slug, field, value);
        break;
        
    case 'archive':
        const archiveSlug = process.argv[3];
        
        if (!archiveSlug) {
            console.log('Usage: node manage-articles.js archive [slug]');
            process.exit(1);
        }
        
        manager.archive(archiveSlug);
        break;
        
    case 'stats':
        manager.stats();
        break;
        
    default:
        console.log('📚 Article Management Utility\n');
        console.log('Commands:');
        console.log('  list                    - List all articles');
        console.log('  create "Title" [cat] [tags] - Create new article');
        console.log('  update [slug] [field] [value] - Update article metadata');
        console.log('  archive [slug]          - Archive article');
        console.log('  stats                   - Show blog statistics\n');
        console.log('Examples:');
        console.log('  node manage-articles.js list');
        console.log('  node manage-articles.js create "My Article" "Technology" "tag1,tag2"');
        console.log('  node manage-articles.js update my-article category Strategy');
        console.log('  node manage-articles.js archive old-article');
        console.log('  node manage-articles.js stats');
        break;
}
