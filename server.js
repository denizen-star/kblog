/**
 * Kerv Talks-Data Blog Server
 * Real backend API for article creation and management
 * NO SIMULATION - ACTUAL FILE CREATION
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { submitToGoogleSheets } = require('./lib/googleSheetsClient');
const { processUploadedImage } = require('./lib/imageProcessor');
const { generateResponsiveImageHTML } = require('./lib/imageUtils');

const app = express();
const PORT = 1977; // API server port (static server runs on 1978)
const PUBLIC_DIR = __dirname;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'assets', 'images', 'articles');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const tempName = `${Date.now()}${ext}` || Date.now().toString();
        cb(null, tempName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Project paths
const PROJECT_ROOT = __dirname;
const ARTICLES_DIR = path.join(PROJECT_ROOT, 'articles');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'assets', 'images', 'articles');

// Ensure directories exist
[ARTICLES_DIR, DATA_DIR, IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Serve static assets so article pages load directly
app.use(express.static(PUBLIC_DIR));

app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Allow pretty URLs like /articles/foo/ by serving index.html in that folder
app.get(/\/$/, (req, res, next) => {
    const relativePath = req.path.replace(/^\/+/, '');
    const candidate = path.join(PUBLIC_DIR, relativePath, 'index.html');
    if (fs.existsSync(candidate)) {
        return res.sendFile(candidate);
    }
    return next();
});

/**
 * API Routes
 */

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Kerv Talks-Data Blog API is running' });
});

// Create article endpoint
app.post('/api/create-article', upload.single('featuredImage'), async (req, res) => {
    try {
        console.log('📝 Creating new article...');
        
        const {
            title,
            excerpt,
            category,
            author,
            tags,
            content,
            featured,
            comments,
            notification
        } = req.body;

        // Validate required fields
        if (!title || !category || !content) {
            return res.status(400).json({
                error: 'Missing required fields: title, category, and content are required'
            });
        }

        // Generate slug
        const slug = generateSlug(title);
        const articleId = slug;
        let featuredImageFilename = null;

        if (req.file) {
            const originalExt = path.extname(req.file.originalname) || path.extname(req.file.filename);
            featuredImageFilename = `${slug}${originalExt}`;
            const currentPath = req.file.path;
            const destinationPath = path.join(IMAGES_DIR, featuredImageFilename);

            try {
                // Remove existing image and all its sizes if they exist
                if (fs.existsSync(destinationPath)) {
                    fs.unlinkSync(destinationPath);
                }
                
                // Remove existing responsive sizes
                const baseName = path.parse(featuredImageFilename).name;
                const ext = path.extname(featuredImageFilename);
                [400, 600, 900, 1200].forEach(width => {
                    const sizePath = path.join(IMAGES_DIR, `${baseName}-${width}w${ext}`);
                    if (fs.existsSync(sizePath)) {
                        fs.unlinkSync(sizePath);
                    }
                });

                // Move uploaded file to final destination
                fs.renameSync(currentPath, destinationPath);
                req.file.filename = featuredImageFilename;
                req.file.path = destinationPath;
                console.log(`🖼️  Image saved as: ${featuredImageFilename}`);

                // Generate responsive image sizes
                try {
                    const baseFilename = path.parse(featuredImageFilename).name;
                    await processUploadedImage(destinationPath, baseFilename, IMAGES_DIR);
                    console.log(`✅ Responsive image sizes generated for: ${featuredImageFilename}`);
                } catch (imageProcessingError) {
                    console.error('⚠️  Warning: Failed to generate responsive image sizes:', imageProcessingError.message);
                    // Don't fail the entire request if image processing fails
                    // The original image will still be available
                }
            } catch (renameError) {
                console.error('Error renaming uploaded image:', renameError);
                try {
                    if (fs.existsSync(currentPath)) {
                        fs.unlinkSync(currentPath);
                    }
                } catch (cleanupError) {
                    console.error('Failed to clean up temporary image file:', cleanupError);
                }
                featuredImageFilename = null;
            }
        }
        
        // Create article data
        const articleData = {
            id: articleId,
            slug: slug,
            title: title,
            excerpt: excerpt || '',
            author: getAuthorInfo(author),
            published: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: 'published',
            readTime: calculateReadingTime(content),
            category: category,
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            image: {
                featured: featuredImageFilename,
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
                metaDescription: excerpt || '',
                keywords: tags ? tags.split(',').map(tag => tag.trim()) : [],
                canonical: `https://kervtalksdata.com/articles/${slug}/`
            },
            settings: {
                featured: featured === 'true',
                allowComments: comments === 'true',
                notifySubscribers: notification === 'true',
                archived: false
            },
            content: content
        };

        // Create article directory
        const articleDir = path.join(ARTICLES_DIR, slug);
        if (!fs.existsSync(articleDir)) {
            fs.mkdirSync(articleDir, { recursive: true });
            console.log(`📁 Created directory: articles/${slug}/`);
        }

        // Create article HTML file
        const articleHTML = generateArticleHTML(articleData);
        const indexPath = path.join(articleDir, 'index.html');
        fs.writeFileSync(indexPath, articleHTML, 'utf8');
        console.log(`📄 Created: articles/${slug}/index.html`);

        // Create metadata.json
        const metadataPath = path.join(articleDir, 'metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(articleData, null, 2), 'utf8');
        console.log(`📄 Created: articles/${slug}/metadata.json`);

        // Create comments.json
        const commentsPath = path.join(articleDir, 'comments.json');
        const commentsData = {
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
        fs.writeFileSync(commentsPath, JSON.stringify(commentsData, null, 2), 'utf8');
        console.log(`📄 Created: articles/${slug}/comments.json`);

        // Update articles.json
        await updateArticlesJSON(articleData);
        console.log(`📝 Updated: data/articles.json`);

        // Handle image if uploaded
        if (featuredImageFilename) {
            console.log(`🖼️  Featured image available at: assets/images/articles/${featuredImageFilename}`);
        }

        console.log(`✅ Article "${slug}" created successfully!`);
        
        // Get the base URL from environment
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://kblog.kervinapps.com' 
            : 'http://localhost:1978';
            
        res.json({
            success: true,
            message: 'Article created successfully!',
            article: {
                id: articleData.id,
                slug: articleData.slug,
                title: articleData.title,
                url: `${baseUrl}/articles/${slug}/`
            }
        });

    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({
            error: 'Failed to create article',
            message: error.message
        });
    }
});

// Get articles list
app.get('/api/articles', (req, res) => {
    try {
        const articlesPath = path.join(DATA_DIR, 'articles.json');
        if (fs.existsSync(articlesPath)) {
            const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
            res.json(articlesData);
        } else {
            res.json({ articles: [] });
        }
    } catch (error) {
        console.error('Error reading articles:', error);
        res.status(500).json({ error: 'Failed to read articles' });
    }
});

// Get specific article
app.get('/api/articles/:slug', (req, res) => {
    try {
        const { slug } = req.params;
        const articleDir = path.join(ARTICLES_DIR, slug);
        const metadataPath = path.join(articleDir, 'metadata.json');
        
        if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            res.json(metadata);
        } else {
            res.status(404).json({ error: 'Article not found' });
        }
    } catch (error) {
        console.error('Error reading article:', error);
        res.status(500).json({ error: 'Failed to read article' });
    }
});

// Update article stats (views, likes, etc.)
app.post('/api/articles/:slug/stats', (req, res) => {
    try {
        const { slug } = req.params;
        const { type, increment = 1 } = req.body; // type: 'views', 'likes', 'comments'
        
        const articleDir = path.join(ARTICLES_DIR, slug);
        const metadataPath = path.join(articleDir, 'metadata.json');
        
        if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            
            if (metadata.stats && metadata.stats[type] !== undefined) {
                metadata.stats[type] += increment;
                metadata.updated = new Date().toISOString();
                
                fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
                
                // Also update articles.json
                updateArticlesJSON(metadata);
                
                res.json({ success: true, stats: metadata.stats });
            } else {
                res.status(400).json({ error: 'Invalid stat type' });
            }
        } else {
            res.status(404).json({ error: 'Article not found' });
        }
    } catch (error) {
        console.error('Error updating article stats:', error);
        res.status(500).json({ error: 'Failed to update article stats' });
    }
});

// Newsletter subscription endpoint
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        console.log('📧 Processing newsletter subscription...');
        
        const {
            email,
            sessionId,
            deviceData,
            sessionInfo,
            source,
            pageUrl,
            referrer
        } = req.body;

        // Validate required fields
        if (!email) {
            return res.status(400).json({
                error: 'Email address is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Please enter a valid email address'
            });
        }

        // Generate subscription ID
        const subscriptionId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create subscription data
        const subscriptionData = {
            id: subscriptionId,
            email: email.toLowerCase().trim(),
            sessionId: sessionId || null,
            deviceData: deviceData || null,
            sessionInfo: sessionInfo || null,
            subscriptionDate: new Date().toISOString(),
            source: source || 'newsletter_signup',
            pageUrl: pageUrl || null,
            referrer: referrer || null,
            status: 'active',
            preferences: {
                frequency: 'weekly',
                categories: ['data-architecture', 'information-asymmetry']
            }
        };

        const submissionPayload = {
            dataType: 'newsletter',
            timestamp: subscriptionData.subscriptionDate,
            sessionId: subscriptionData.sessionId,
            sourcePage: pageUrl || null,
            email: subscriptionData.email,
            campaignTag: source || 'newsletter_signup',
            referrer: referrer || null,
            deviceInfo: {
                deviceData: deviceData || null,
                sessionInfo: sessionInfo || null
            },
            userAgent: req.headers['user-agent'] || 'unknown',
            ipAddress:
                (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
                req.ip ||
                req.connection?.remoteAddress ||
                'unknown',
            status: 'submitted'
        };

        try {
            await submitToGoogleSheets(submissionPayload);
            console.log('🧾 Newsletter submission forwarded to Google Sheets');
        } catch (gsError) {
            console.error('Sheets submission failed (newsletter):', gsError);
        }

        // Save subscription to newsletter.json
        await saveNewsletterSubscription(subscriptionData);
        console.log(`✅ Newsletter subscription saved: ${email}`);

        res.json({
            success: true,
            message: 'Successfully subscribed to newsletter!',
            subscription: {
                id: subscriptionData.id,
                email: subscriptionData.email,
                status: subscriptionData.status
            }
        });

    } catch (error) {
        console.error('Error processing newsletter subscription:', error);
        res.status(500).json({
            error: 'Failed to process subscription',
            message: error.message
        });
    }
});

// Contact form endpoint
app.post('/api/contact/submit', async (req, res) => {
    try {
        console.log('📮 Processing contact form submission...');

        const {
            name,
            email,
            organization,
            role,
            subject,
            message,
            sessionId,
            deviceInfo,
            sessionInfo,
            pageUrl
        } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'Name, email, and message are required.',
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Please enter a valid email address.'
            });
        }

        const submissionTimestamp = new Date().toISOString();
        const submissionPayload = {
            dataType: 'contact',
            timestamp: submissionTimestamp,
            sessionId: sessionId || `contact_${Date.now()}`,
            sourcePage: pageUrl || 'contact',
            name: name.trim(),
            email: email.toLowerCase().trim(),
            organization: organization || '',
            role: role || '',
            subject: subject || '',
            message: message || '',
            deviceInfo: {
                deviceData: deviceInfo || null,
                sessionInfo: sessionInfo || null
            },
            userAgent: req.headers['user-agent'] || 'unknown',
            ipAddress:
                (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
                req.ip ||
                req.connection?.remoteAddress ||
                'unknown',
            status: 'submitted'
        };

        let sheetsResponse = null;
        try {
            sheetsResponse = await submitToGoogleSheets(submissionPayload);
            console.log('📊 Contact submission forwarded to Google Sheets');
        } catch (gsError) {
            console.error('Sheets submission failed (contact):', gsError);
        }

        res.json({
            success: true,
            message: 'Message received. Thank you for contacting us!',
            sheetsResponse
        });
    } catch (error) {
        console.error('Error processing contact submission:', error);
        res.status(500).json({
            error: 'Failed to process contact submission.',
            message: error.message
        });
    }
});

// Get newsletter subscribers (admin endpoint)
app.get('/api/newsletter/subscribers', (req, res) => {
    try {
        const newsletterPath = path.join(DATA_DIR, 'newsletter.json');
        
        if (fs.existsSync(newsletterPath)) {
            const newsletterData = JSON.parse(fs.readFileSync(newsletterPath, 'utf8'));
            res.json(newsletterData);
        } else {
            res.json({ subscriptions: [], stats: { totalSubscribers: 0, activeSubscribers: 0 } });
        }
    } catch (error) {
        console.error('Error reading newsletter data:', error);
        res.status(500).json({ error: 'Failed to read newsletter data' });
    }
});

/**
 * Helper Functions
 */

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function calculateReadingTime(content) {
    const textContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    return Math.ceil(words.length / 200); // 200 words per minute
}

function getAuthorInfo(authorId) {
    const authors = {
        'data-crusader': {
            id: 'data-crusader',
            name: 'Data Crusader',
            role: 'Head of Data Strategy',
            avatar: '🦸‍♂️',
            bio: 'A seasoned data professional with over 10 years of experience in enterprise data architecture and information asymmetry strategies.'
        },
        'cosmic-analyst': {
            id: 'cosmic-analyst',
            name: 'Cosmic Analyst',
            role: 'Data Architecture Lead',
            avatar: '🌌',
            bio: 'Specializing in building scalable data universes that connect disparate enterprise systems across organizational boundaries.'
        },
        'web-weaver': {
            id: 'web-weaver',
            name: 'Web Weaver',
            role: 'Analytics Specialist',
            avatar: '🕷️',
            bio: 'Expert in crafting compelling data narratives that transform complex information into actionable insights.'
        }
    };
    return authors[authorId] || authors['data-crusader'];
}

function generateArticleHTML(articleData) {
    const authorInfo = articleData.author;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="../../assets/images/favicon.svg">
    <title>${articleData.title} - Kerv Talks-Data Blog</title>
    <meta name="description" content="${articleData.excerpt || ''}">
    <meta name="keywords" content="${articleData.tags.join(', ')}, data architecture, information asymmetry">
    <meta name="author" content="${authorInfo.name}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${articleData.title}">
    <meta property="og:description" content="${articleData.excerpt || ''}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://kblog.kervinapps.com/articles/${articleData.slug}/">
    
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
                "url": "https://kblog.kervinapps.com/assets/images/logo.png"
            }
        },
        "datePublished": "${articleData.published}",
        "description": "${articleData.excerpt || ''}"
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

        <section class="article-newsletter article-newsletter--top">
            <div class="newsletter-panel newsletter-panel--article">
                <p class="newsletter-panel__headline">Join data leaders gaining hands-on human experience with my free monthly newsletter.</p>
                <form class="newsletter-panel__form" action="#" method="post" novalidate data-source="article-top-panel" data-component="article-newsletter">
                    <div class="newsletter-panel__inputs">
                        <input class="newsletter-panel__input" type="text" name="name" autocomplete="name" placeholder="Name">
                        <input class="newsletter-panel__input" type="email" name="email" autocomplete="email" placeholder="Email" required>
                        <div class="newsletter-panel__actions">
                            <button class="newsletter-panel__submit" type="submit" aria-label="Subscribe to newsletter">Subscribe</button>
                            <div class="newsletter-panel__icons">
                                <a class="newsletter-panel__icon newsletter-panel__icon--linkedin" href="https://www.linkedin.com/in/kleacock/" target="_blank" rel="noopener" aria-label="Connect on LinkedIn">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M20.452 20.452h-3.555v-5.569c0-1.327-.027-3.038-1.852-3.038-1.853 0-2.136 1.449-2.136 2.948v5.659H9.354V9.012h3.414v1.561h.049c.476-.9 1.637-1.852 3.369-1.852 3.601 0 4.267 2.37 4.267 5.455v6.276zM5.337 7.433c-1.144 0-2.068-.929-2.068-2.072 0-1.144.924-2.072 2.068-2.072 1.143 0 2.067.928 2.067 2.072 0 1.143-.924 2.072-2.067 2.072zM7.119 20.452H3.552V9.012h3.567v11.44z"/>
                                        </svg>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--mail" href="mailto:optium.optimizer@gmail.com" aria-label="Email Kervin">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm0 2v.21L12 13l9-5.79V7H3zm0 12h18V9.24l-9 5.79-9-5.79V19z"/>
                                        </svg>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--kerv" href="https://kervinapps.com/" target="_blank" rel="noopener" aria-label="Visit KervinApps">
                                    <span class="newsletter-panel__icon-inner">
                                        <span class="newsletter-panel__icon-text">K</span>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--chat" href="../../contact.html" aria-label="Contact Kervin">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2h-6l-4 3v-3H4a2 2 0 01-2-2V6a2 2 0 012-2zm3 5a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2z"/>
                                        </svg>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>

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
                                <span class="stat-value">${articleData.readTime} min</span>
                            </div>
                        </div>
                    </div>
                </header>

                ${articleData.image.featured ? `
                <!-- Article Image -->
                <div class="article-featured-image">
                    ${generateResponsiveImageHTML(
                        `../../assets/images/articles/${articleData.image.featured}`,
                        articleData.image.featured,
                        articleData.title,
                        { isArticlePage: true, maxHeight: 500 }
                    )}
                </div>
                ` : `
                <!-- Article Image -->
                <div class="article-featured-image">
                    ${generateResponsiveImageHTML(
                        `../../assets/images/articles/${articleData.slug}.jpg`,
                        `${articleData.slug}.jpg`,
                        articleData.title,
                        { isArticlePage: true, maxHeight: 500 }
                    ).replace('id="featured-image">', 'id="featured-image" style="display: none;">')}
                    <div class="featured-image-placeholder" id="image-placeholder">${authorInfo.avatar}</div>
                </div>
                `}

                <!-- Article Body -->
                <div class="article-body">
                    ${articleData.excerpt ? `<p class="article-lead">${articleData.excerpt}</p>` : ''}
                    <div class="article-content-html">${articleData.content}</div>
                </div>

                <!-- Tags -->
                <div class="article-tags-full">
                    ${articleData.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>

                <!-- Author Spotlight -->
                <section class="article-author-section">
                    <div class="card author-card">
                        <div class="author-card-header">
                            <div class="author-avatar-sidebar">${authorInfo.avatar}</div>
                            <div class="author-info-sidebar">
                                <h3>${authorInfo.name}</h3>
                                <p>${authorInfo.role}</p>
                            </div>
                        </div>
                        <p class="author-bio">${authorInfo.bio}</p>
                    </div>
                </section>
            </article>
        </div>

        <section class="article-newsletter article-newsletter--bottom">
            <div class="newsletter-panel newsletter-panel--article">
                <p class="newsletter-panel__headline">Join data leaders gaining hands-on human experience with my free monthly newsletter.</p>
                <form class="newsletter-panel__form" action="#" method="post" novalidate data-source="article-bottom-panel" data-component="article-newsletter">
                    <div class="newsletter-panel__inputs">
                        <input class="newsletter-panel__input" type="text" name="name" autocomplete="name" placeholder="Name">
                        <input class="newsletter-panel__input" type="email" name="email" autocomplete="email" placeholder="Email" required>
                        <div class="newsletter-panel__actions">
                            <button class="newsletter-panel__submit" type="submit" aria-label="Subscribe to newsletter">Subscribe</button>
                            <div class="newsletter-panel__icons">
                                <a class="newsletter-panel__icon newsletter-panel__icon--linkedin" href="https://www.linkedin.com/in/kleacock/" target="_blank" rel="noopener" aria-label="Connect on LinkedIn">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M20.452 20.452h-3.555v-5.569c0-1.327-.027-3.038-1.852-3.038-1.853 0-2.136 1.449-2.136 2.948v5.659H9.354V9.012h3.414v1.561h.049c.476-.9 1.637-1.852 3.369-1.852 3.601 0 4.267 2.37 4.267 5.455v6.276zM5.337 7.433c-1.144 0-2.068-.929-2.068-2.072 0-1.144.924-2.072 2.068-2.072 1.143 0 2.067.928 2.067 2.072 0 1.143-.924 2.072-2.067 2.072zM7.119 20.452H3.552V9.012h3.567v11.44z"/>
                                        </svg>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--mail" href="mailto:optium.optimizer@gmail.com" aria-label="Email Kervin">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm0 2v.21L12 13l9-5.79V7H3zm0 12h18V9.24l-9 5.79-9-5.79V19z"/>
                                        </svg>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--kerv" href="https://kervinapps.com/" target="_blank" rel="noopener" aria-label="Visit KervinApps">
                                    <span class="newsletter-panel__icon-inner">
                                        <span class="newsletter-panel__icon-text">K</span>
                                    </span>
                                </a>
                                <a class="newsletter-panel__icon newsletter-panel__icon--chat" href="../../contact.html" aria-label="Contact Kervin">
                                    <span class="newsletter-panel__icon-inner">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path fill="currentColor" d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2h-6l-4 3v-3H4a2 2 0 01-2-2V6a2 2 0 012-2zm3 5a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2z"/>
                                        </svg>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="footer-content">
            <p>&copy; 2024 Kerv Talks-Data Blog. All rights reserved.</p>
        </div>
    </footer>
    
    <!-- JavaScript -->
    <script src="../../assets/js/config.js"></script>
    <script src="../../assets/js/main.js"></script>
    <script src="../../assets/js/article.js"></script>
    <script src="../../assets/js/newsletter.js"></script>
    <script src="../../assets/js/analytics.js"></script>
</body>
</html>`;
}

async function updateArticlesJSON(articleData) {
    const articlesJsonPath = path.join(DATA_DIR, 'articles.json');
    
    // Read existing articles
    let articlesData;
    try {
        if (fs.existsSync(articlesJsonPath)) {
            const content = fs.readFileSync(articlesJsonPath, 'utf8');
            articlesData = JSON.parse(content);
        } else {
            articlesData = { articles: [] };
        }
    } catch (error) {
        console.error('Error reading articles.json:', error);
        articlesData = { articles: [] };
    }
    
    // Check if article already exists
    const existingIndex = articlesData.articles.findIndex(article => article.id === articleData.id);
    
    const articleEntry = {
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
        image: articleData.image.featured || `${articleData.slug}.jpg`,
        content: articleData.content,
        likes: articleData.stats.likes,
        comments: articleData.stats.comments,
        views: articleData.stats.views
    };
    
    if (existingIndex >= 0) {
        // Update existing article
        articlesData.articles[existingIndex] = articleEntry;
        console.log(`📝 Updated existing article in articles.json`);
    } else {
        // Add new article to the beginning
        articlesData.articles.unshift(articleEntry);
        console.log(`📝 Added new article to articles.json`);
    }
    
    // Write updated articles.json
    fs.writeFileSync(articlesJsonPath, JSON.stringify(articlesData, null, 2), 'utf8');
}

async function saveNewsletterSubscription(subscriptionData) {
    const newsletterPath = path.join(DATA_DIR, 'newsletter.json');
    
    // Read existing newsletter data
    let newsletterData;
    try {
        if (fs.existsSync(newsletterPath)) {
            const content = fs.readFileSync(newsletterPath, 'utf8');
            newsletterData = JSON.parse(content);
        } else {
            newsletterData = { 
                subscriptions: [],
                stats: {
                    totalSubscribers: 0,
                    activeSubscribers: 0,
                    lastSubscription: null
                }
            };
        }
    } catch (error) {
        console.error('Error reading newsletter.json:', error);
        newsletterData = { 
            subscriptions: [],
            stats: {
                totalSubscribers: 0,
                activeSubscribers: 0,
                lastSubscription: null
            }
        };
    }
    
    // Check if email already exists
    const existingIndex = newsletterData.subscriptions.findIndex(
        sub => sub.email === subscriptionData.email
    );
    
    if (existingIndex >= 0) {
        // Update existing subscription
        newsletterData.subscriptions[existingIndex] = subscriptionData;
        console.log(`📧 Updated existing newsletter subscription: ${subscriptionData.email}`);
    } else {
        // Add new subscription
        newsletterData.subscriptions.push(subscriptionData);
        console.log(`📧 Added new newsletter subscription: ${subscriptionData.email}`);
    }
    
    // Update stats
    newsletterData.stats.totalSubscribers = newsletterData.subscriptions.length;
    newsletterData.stats.activeSubscribers = newsletterData.subscriptions.filter(
        sub => sub.status === 'active'
    ).length;
    newsletterData.stats.lastSubscription = subscriptionData.subscriptionDate;
    
    // Write updated newsletter.json
    fs.writeFileSync(newsletterPath, JSON.stringify(newsletterData, null, 2), 'utf8');
    console.log(`📄 Updated newsletter.json with ${newsletterData.subscriptions.length} subscriptions`);
}

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Kerv Talks-Data Blog API Server running on port ${PORT}`);
    console.log(`📝 Article creation endpoint: http://localhost:${PORT}/api/create-article`);
    console.log(`📚 Articles list endpoint: http://localhost:${PORT}/api/articles`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
