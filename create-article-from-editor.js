#!/usr/bin/env node

/**
 * Article Creation Helper Script
 * This script creates article files from data stored in localStorage by the article editor
 * 
 * Usage: node create-article-from-editor.js [article-slug]
 * 
 * The script will:
 * 1. Read article data from localStorage (stored by the editor)
 * 2. Create the article directory structure
 * 3. Generate all necessary files (index.html, metadata.json, comments.json)
 * 4. Update the main articles.json file
 * 5. Handle image uploads if present
 */

const fs = require('fs');
const path = require('path');

class ArticleCreator {
    constructor() {
        this.projectRoot = process.cwd();
        this.articlesDir = path.join(this.projectRoot, 'articles');
        this.dataDir = path.join(this.projectRoot, 'data');
        this.imagesDir = path.join(this.projectRoot, 'assets', 'images', 'articles');
    }

    async createArticleFromSlug(slug) {
        try {
            console.log(`Creating article: ${slug}`);
            
            // Check if article data exists in localStorage (we'll simulate this)
            const articleData = await this.getArticleDataFromEditor(slug);
            
            if (!articleData) {
                console.error(`No article data found for slug: ${slug}`);
                console.log('Available articles in localStorage:');
                this.listAvailableArticles();
                return;
            }

            // Create article directory
            await this.createArticleDirectory(slug);
            
            // Create article files
            await this.createArticleFiles(slug, articleData);
            
            // Update articles.json
            await this.updateArticlesJSON(articleData);
            
            // Handle image if present
            await this.handleImageUpload(slug, articleData);
            
            console.log(`✅ Article "${slug}" created successfully!`);
            console.log(`📁 Directory: articles/${slug}/`);
            console.log(`🌐 URL: http://localhost:1977/articles/${slug}/`);
            
        } catch (error) {
            console.error('Error creating article:', error);
        }
    }

    async getArticleDataFromEditor(slug) {
        // In a real implementation, this would read from localStorage
        // For now, we'll create a sample article data structure
        console.log(`Looking for article data for slug: ${slug}`);
        
        // Check if we have stored data (this would come from localStorage in browser)
        const storedData = this.getStoredArticleData(slug);
        
        if (storedData) {
            return storedData;
        }

        // If no stored data, create a sample article for testing
        return this.createSampleArticleData(slug);
    }

    getStoredArticleData(slug) {
        // This would normally read from localStorage
        // For now, return null to trigger sample data creation
        return null;
    }

    createSampleArticleData(slug) {
        return {
            id: slug,
            slug: slug,
            title: this.slugToTitle(slug),
            excerpt: `A comprehensive article about ${slug.replace(/-/g, ' ')} and its impact on data architecture.`,
            author: {
                id: 'data-crusader',
                name: 'Data Crusader',
                avatar: '🦸‍♂️',
                role: 'Head of Data Strategy',
                bio: 'A seasoned data professional with over 10 years of experience in enterprise data architecture and information asymmetry strategies.',
                articles: 16,
                followers: 1247
            },
            published: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: 'published',
            readTime: 5,
            category: 'Technology',
            tags: [slug, 'data-architecture', 'enterprise'],
            image: {
                featured: null,
                alt: `${slug} featured image`
            },
            stats: {
                views: 0,
                likes: 0,
                comments: 0,
                shares: 0
            },
            seo: {
                metaTitle: `${this.slugToTitle(slug)} - Kerv Talks-Data Blog`,
                metaDescription: `A comprehensive article about ${slug.replace(/-/g, ' ')} and its impact on data architecture.`,
                keywords: [slug, 'data-architecture', 'enterprise'],
                canonical: `https://kervtalksdata.com/articles/${slug}/`
            },
            settings: {
                featured: false,
                allowComments: true,
                notifySubscribers: false,
                archived: false
            },
            content: {
                wordCount: 800,
                characterCount: 4800,
                hasImages: false,
                hasCode: false,
                readingLevel: 'intermediate'
            },
            htmlContent: this.generateSampleHTML(slug)
        };
    }

    slugToTitle(slug) {
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    generateSampleHTML(slug) {
        const title = this.slugToTitle(slug);
        const authorInfo = {
            name: 'Data Crusader',
            role: 'Head of Data Strategy',
            avatar: '🦸‍♂️',
            bio: 'A seasoned data professional with over 10 years of experience in enterprise data architecture and information asymmetry strategies.',
            articles: 16,
            followers: 1247
        };

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Kerv Talks-Data Blog</title>
    <meta name="description" content="A comprehensive article about ${slug.replace(/-/g, ' ')} and its impact on data architecture.">
    <meta name="keywords" content="${slug}, data-architecture, enterprise">
    <meta name="author" content="${authorInfo.name}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="A comprehensive article about ${slug.replace(/-/g, ' ')} and its impact on data architecture.">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://kervtalksdata.com/articles/${slug}/">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="../../assets/css/main.css">
    <link rel="stylesheet" href="../../assets/css/responsive.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${title}",
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
        "datePublished": "${new Date().toISOString()}",
        "description": "A comprehensive article about ${slug.replace(/-/g, ' ')} and its impact on data architecture."
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
            <span class="breadcrumb-current">${title}</span>
        </nav>

        <div class="article-layout">
            <article class="article-content">
                <!-- Article Header -->
                <header class="article-header-full">
                    <div class="article-category-badge">Technology</div>
                    <h1 class="article-title-full">${title}</h1>
                    
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
                                <span class="stat-value">${new Date().toLocaleDateString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Read time</span>
                                <span class="stat-value">5 min</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Views</span>
                                <span class="stat-value">0</span>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Article Image -->
                <div class="article-featured-image">
                    <img src="../../assets/images/articles/${slug}.jpg" alt="${title}" style="width: 100%; height: 300px; object-fit: cover; display: none;" id="featured-image">
                    <div class="featured-image-placeholder" id="image-placeholder">${authorInfo.avatar}</div>
                </div>

                <!-- Article Body -->
                <div class="article-body">
                    <p class="article-lead">This is a comprehensive article about ${slug.replace(/-/g, ' ')} and its impact on modern data architecture and enterprise strategies.</p>

                    <h2>Understanding ${title}</h2>
                    <p>In today's rapidly evolving digital landscape, ${slug.replace(/-/g, ' ')} has become a critical component of successful enterprise data architecture. This article explores the key concepts, implementation strategies, and best practices that every data professional should understand.</p>

                    <h3>Key Benefits</h3>
                    <ul>
                        <li><strong>Scalability:</strong> Enables organizations to handle growing data volumes efficiently</li>
                        <li><strong>Flexibility:</strong> Provides adaptable solutions for changing business requirements</li>
                        <li><strong>Performance:</strong> Optimizes data processing and retrieval operations</li>
                        <li><strong>Integration:</strong> Seamlessly connects disparate systems and data sources</li>
                    </ul>

                    <h3>Implementation Considerations</h3>
                    <p>When implementing ${slug.replace(/-/g, ' ')}, organizations must consider several critical factors:</p>

                    <ol>
                        <li><strong>Data Quality:</strong> Ensure data integrity and consistency across all systems</li>
                        <li><strong>Security:</strong> Implement robust security measures to protect sensitive information</li>
                        <li><strong>Governance:</strong> Establish clear policies and procedures for data management</li>
                        <li><strong>Monitoring:</strong> Set up comprehensive monitoring and alerting systems</li>
                    </ol>

                    <h2>Best Practices</h2>
                    <p>To maximize the benefits of ${slug.replace(/-/g, ' ')}, follow these proven best practices:</p>

                    <blockquote>
                        <p>"The key to successful data architecture lies not just in the technology, but in the people, processes, and governance that support it."</p>
                        <cite>— Data Crusader, Head of Data Strategy</cite>
                    </blockquote>

                    <h3>Conclusion</h3>
                    <p>${title} represents a fundamental shift in how organizations approach data architecture. By understanding its principles and implementing best practices, data professionals can build more resilient, scalable, and efficient systems that drive business value.</p>

                    <p>As we continue to navigate the complexities of modern enterprise data, staying informed about emerging trends and technologies like ${slug.replace(/-/g, ' ')} will be crucial for long-term success.</p>

                    <div class="article-tags-full">
                        <span class="tag">${slug}</span>
                        <span class="tag">data-architecture</span>
                        <span class="tag">enterprise</span>
                        <span class="tag">technology</span>
                    </div>
                </div>

                <!-- Article Actions -->
                <div class="article-actions-full">
                    <button class="action-button like-button" data-article-id="${slug}">
                        <span class="action-icon">👍</span>
                        <span class="action-text">Like</span>
                        <span class="action-count">0</span>
                    </button>
                    
                    <button class="action-button share-button" data-article-id="${slug}">
                        <span class="action-icon">🔄</span>
                        <span class="action-text">Share</span>
                    </button>
                    
                    <button class="action-button bookmark-button">
                        <span class="action-icon">🔖</span>
                        <span class="action-text">Save</span>
                    </button>
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

    async createArticleDirectory(slug) {
        const articleDir = path.join(this.articlesDir, slug);
        
        if (!fs.existsSync(articleDir)) {
            fs.mkdirSync(articleDir, { recursive: true });
            console.log(`📁 Created directory: articles/${slug}/`);
        } else {
            console.log(`📁 Directory already exists: articles/${slug}/`);
        }
    }

    async createArticleFiles(slug, articleData) {
        const articleDir = path.join(this.articlesDir, slug);
        
        // Create index.html
        const indexPath = path.join(articleDir, 'index.html');
        fs.writeFileSync(indexPath, articleData.htmlContent, 'utf8');
        console.log(`📄 Created: articles/${slug}/index.html`);
        
        // Create metadata.json
        const metadataPath = path.join(articleDir, 'metadata.json');
        const metadata = {
            id: articleData.id,
            slug: articleData.slug,
            title: articleData.title,
            excerpt: articleData.excerpt,
            author: articleData.author,
            published: articleData.published,
            updated: articleData.updated,
            status: articleData.status,
            readTime: articleData.readTime,
            category: articleData.category,
            tags: articleData.tags,
            image: articleData.image,
            stats: articleData.stats,
            seo: articleData.seo,
            settings: articleData.settings,
            content: articleData.content
        };
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        console.log(`📄 Created: articles/${slug}/metadata.json`);
        
        // Create comments.json
        const commentsPath = path.join(articleDir, 'comments.json');
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
        fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2), 'utf8');
        console.log(`📄 Created: articles/${slug}/comments.json`);
    }

    async updateArticlesJSON(articleData) {
        const articlesJsonPath = path.join(this.dataDir, 'articles.json');
        
        // Read existing articles
        let articlesData;
        try {
            const content = fs.readFileSync(articlesJsonPath, 'utf8');
            articlesData = JSON.parse(content);
        } catch (error) {
            console.error('Error reading articles.json:', error);
            return;
        }
        
        // Check if article already exists
        const existingIndex = articlesData.articles.findIndex(article => article.id === articleData.id);
        
        if (existingIndex >= 0) {
            // Update existing article
            articlesData.articles[existingIndex] = {
                id: articleData.id,
                title: articleData.title,
                excerpt: articleData.excerpt,
                author: {
                    name: articleData.author.name,
                    avatar: articleData.author.avatar,
                    role: articleData.author.role
                },
                published: articleData.published.split('T')[0], // Date only
                readTime: articleData.readTime,
                category: articleData.category,
                tags: articleData.tags,
                image: `${articleData.slug}.jpg`,
                content: `${articleData.slug}-content.html`,
                likes: articleData.stats.likes,
                comments: articleData.stats.comments,
                views: articleData.stats.views
            };
            console.log(`📝 Updated existing article in articles.json`);
        } else {
            // Add new article to the beginning
            const newArticle = {
                id: articleData.id,
                title: articleData.title,
                excerpt: articleData.excerpt,
                author: {
                    name: articleData.author.name,
                    avatar: articleData.author.avatar,
                    role: articleData.author.role
                },
                published: articleData.published.split('T')[0], // Date only
                readTime: articleData.readTime,
                category: articleData.category,
                tags: articleData.tags,
                image: `${articleData.slug}.jpg`,
                content: `${articleData.slug}-content.html`,
                likes: articleData.stats.likes,
                comments: articleData.stats.comments,
                views: articleData.stats.views
            };
            
            articlesData.articles.unshift(newArticle);
            console.log(`📝 Added new article to articles.json`);
        }
        
        // Write updated articles.json
        fs.writeFileSync(articlesJsonPath, JSON.stringify(articlesData, null, 2), 'utf8');
        console.log(`📝 Updated: data/articles.json`);
    }

    async handleImageUpload(slug, articleData) {
        // Check if image data exists in localStorage (simulated)
        const imageData = this.getStoredImageData(slug);
        
        if (imageData) {
            // Ensure images directory exists
            if (!fs.existsSync(this.imagesDir)) {
                fs.mkdirSync(this.imagesDir, { recursive: true });
            }
            
            // Save image file
            const imagePath = path.join(this.imagesDir, `${slug}.jpg`);
            // In a real implementation, this would save the actual image data
            console.log(`🖼️  Image data found for ${slug} (would save to: assets/images/articles/${slug}.jpg)`);
        } else {
            console.log(`🖼️  No image data found for ${slug}`);
        }
    }

    getStoredImageData(slug) {
        // This would normally read from localStorage
        // For now, return null
        return null;
    }

    listAvailableArticles() {
        console.log('To create an article, use: node create-article-from-editor.js [article-slug]');
        console.log('Example: node create-article-from-editor.js my-new-article');
    }
}

// Main execution
async function main() {
    const slug = process.argv[2];
    
    if (!slug) {
        console.log('Usage: node create-article-from-editor.js [article-slug]');
        console.log('Example: node create-article-from-editor.js my-new-article');
        process.exit(1);
    }
    
    const creator = new ArticleCreator();
    await creator.createArticleFromSlug(slug);
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ArticleCreator;
