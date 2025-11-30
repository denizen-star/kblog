#!/usr/bin/env python3

"""
Kerv Talks-Data Blog API Server
Real backend API for article creation and management
NO SIMULATION - ACTUAL FILE CREATION
"""

import os
import json
import re
import sys
import shutil
import mimetypes
from datetime import datetime
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import cgi
import tempfile

class BlogAPIHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.project_root = Path(__file__).parent
        self.articles_dir = self.project_root / 'articles'
        self.data_dir = self.project_root / 'data'
        self.images_dir = self.project_root / 'assets' / 'images' / 'articles'
        
        # Ensure directories exist
        for dir_path in [self.articles_dir, self.data_dir, self.images_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        super().__init__(*args, **kwargs)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/'):
            self.route_api_request(parsed_path)
        else:
            self.handle_static(parsed_path.path)

    def route_api_request(self, parsed_path):
        """Dispatch API routes"""
        if parsed_path.path == '/api/health':
            self.handle_health()
        elif parsed_path.path == '/api/articles':
            self.handle_get_articles()
        elif parsed_path.path.startswith('/api/articles/'):
            slug = parsed_path.path.split('/')[-1]
            self.handle_get_article(slug)
        else:
            self.send_error(404, "Not Found")

    def handle_static(self, url_path):
        """Serve static files for the blog UI so port 1978 mirrors the site"""
        relative_path = url_path.lstrip('/')
        if not relative_path:
            relative_path = 'index.html'
        
        file_path = (self.project_root / relative_path).resolve()
        try:
            project_root_resolved = self.project_root.resolve()
        except FileNotFoundError:
            project_root_resolved = self.project_root
        
        # Prevent directory traversal
        if not str(file_path).startswith(str(project_root_resolved)):
            self.send_error(403, "Forbidden")
            return
        
        if not file_path.exists() or file_path.is_dir():
            self.send_error(404, "Not Found")
            return
        
        content_type, _ = mimetypes.guess_type(str(file_path))
        if not content_type:
            content_type = 'application/octet-stream'
        
        try:
            with open(file_path, 'rb') as fp:
                data = fp.read()
        except Exception as exc:
            print(f"Error reading {file_path}: {exc}")
            self.send_error(500, "Failed to read file")
            return
        
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/create-article':
            self.handle_create_article()
        elif parsed_path.path.startswith('/api/articles/') and parsed_path.path.endswith('/stats'):
            slug = parsed_path.path.split('/')[-2]
            self.handle_update_stats(slug)
        else:
            self.send_error(404, "Not Found")
    
    def handle_health(self):
        """Health check endpoint"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            'status': 'OK',
            'message': 'Kerv Talks-Data Blog API is running',
            'timestamp': datetime.now().isoformat()
        }
        self.wfile.write(json.dumps(response).encode())
    
    def handle_get_articles(self):
        """Get all articles"""
        try:
            articles_file = self.data_dir / 'articles.json'
            if articles_file.exists():
                with open(articles_file, 'r', encoding='utf-8') as f:
                    articles_data = json.load(f)
            else:
                articles_data = {'articles': []}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(articles_data).encode())
            
        except Exception as e:
            self.send_error(500, f"Error reading articles: {str(e)}")
    
    def handle_get_article(self, slug):
        """Get specific article"""
        try:
            article_dir = self.articles_dir / slug
            metadata_file = article_dir / 'metadata.json'
            
            if metadata_file.exists():
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(metadata).encode())
            else:
                self.send_error(404, "Article not found")
                
        except Exception as e:
            self.send_error(500, f"Error reading article: {str(e)}")
    
    def handle_create_article(self):
        """Create new article"""
        try:
            # Parse multipart form data
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_error(400, "Content-Type must be multipart/form-data")
                return
            
            # Parse form data
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST'}
            )
            
            # Extract form fields
            title = form.getvalue('title', '').strip()
            excerpt = form.getvalue('excerpt', '').strip()
            category = form.getvalue('category', '').strip()
            author = form.getvalue('author', 'data-crusader').strip()
            tags = form.getvalue('tags', '').strip()
            content = form.getvalue('content', '').strip()
            featured = form.getvalue('featured', 'false').strip()
            comments = form.getvalue('comments', 'true').strip()
            notification = form.getvalue('notification', 'false').strip()
            
            # Validate required fields
            if not title or not category or not content:
                self.send_error(400, "Missing required fields: title, category, and content are required")
                return
            
            # Generate slug
            slug = self.generate_slug(title)
            article_id = slug
            
            # Get author info
            author_info = self.get_author_info(author)
            
            # Create article data
            article_data = {
                'id': article_id,
                'slug': slug,
                'title': title,
                'excerpt': excerpt,
                'author': author_info,
                'published': datetime.now().isoformat(),
                'updated': datetime.now().isoformat(),
                'status': 'published',
                'readTime': self.calculate_reading_time(content),
                'category': category,
                'tags': [tag.strip() for tag in tags.split(',') if tag.strip()] if tags else [],
                'image': {
                    'featured': None,
                    'alt': f'{title} featured image'
                },
                'stats': {
                    'views': 0,
                    'likes': 0,
                    'comments': 0,
                    'shares': 0
                },
                'seo': {
                    'metaTitle': f'{title} - Kerv Talks-Data Blog',
                    'metaDescription': excerpt or f'Professional insights on {title} and data architecture.',
                    'keywords': [tag.strip() for tag in tags.split(',') if tag.strip()] if tags else [],
                    'canonical': f'https://kervtalksdata.com/articles/{slug}/'
                },
                'settings': {
                    'featured': featured == 'true',
                    'allowComments': comments == 'true',
                    'notifySubscribers': notification == 'true',
                    'archived': False
                },
            'content': content,  # Store the actual content
            'contentStats': {
                'wordCount': len(re.sub(r'<[^>]*>', '', content).split()),
                'characterCount': len(content),
                'hasImages': '<img' in content,
                'hasCode': '<code' in content or '<pre' in content,
                'readingLevel': 'intermediate'
            }
            }
            
            # Handle image upload
            if 'featuredImage' in form:
                image_file = form['featuredImage']
                if image_file.filename:
                    # Save image
                    image_ext = os.path.splitext(image_file.filename)[1]
                    image_filename = f'{slug}{image_ext}'
                    image_path = self.images_dir / image_filename
                    
                    with open(image_path, 'wb') as f:
                        f.write(image_file.file.read())
                    
                    article_data['image']['featured'] = image_filename
                    print(f"🖼️  Image uploaded: {image_filename}")
            
            # Create article directory
            article_dir = self.articles_dir / slug
            article_dir.mkdir(parents=True, exist_ok=True)
            print(f"📁 Created directory: articles/{slug}/")
            
            # Create article HTML file
            article_html = self.generate_article_html(article_data)
            index_path = article_dir / 'index.html'
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(article_html)
            print(f"📄 Created: articles/{slug}/index.html")
            
            # Create metadata.json
            metadata_path = article_dir / 'metadata.json'
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(article_data, f, indent=2, ensure_ascii=False)
            print(f"📄 Created: articles/{slug}/metadata.json")
            
            # Create comments.json
            comments_path = article_dir / 'comments.json'
            comments_data = {
                'articleId': slug,
                'comments': [],
                'stats': {
                    'totalComments': 0,
                    'totalReplies': 0,
                    'lastComment': None
                },
                'moderation': {
                    'allowAnonymous': True,
                    'requireApproval': False,
                    'maxLength': 1000
                }
            }
            with open(comments_path, 'w', encoding='utf-8') as f:
                json.dump(comments_data, f, indent=2, ensure_ascii=False)
            print(f"📄 Created: articles/{slug}/comments.json")
            
            # Update articles.json
            self.update_articles_json(article_data)
            print(f"📝 Updated: data/articles.json")
            
            print(f"✅ Article '{slug}' created successfully!")
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'message': 'Article created successfully!',
                'article': {
                    'id': article_data['id'],
                    'slug': article_data['slug'],
                    'title': article_data['title'],
                    'url': f'http://localhost:1977/articles/{slug}/'
                }
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"❌ Error creating article: {str(e)}")
            self.send_error(500, f"Failed to create article: {str(e)}")
    
    def handle_update_stats(self, slug):
        """Update article stats"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            stat_type = data.get('type')
            increment = data.get('increment', 1)
            
            if not stat_type:
                self.send_error(400, "Missing stat type")
                return
            
            article_dir = self.articles_dir / slug
            metadata_file = article_dir / 'metadata.json'
            
            if metadata_file.exists():
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                if 'stats' in metadata and stat_type in metadata['stats']:
                    metadata['stats'][stat_type] += increment
                    metadata['updated'] = datetime.now().isoformat()
                    
                    with open(metadata_file, 'w', encoding='utf-8') as f:
                        json.dump(metadata, f, indent=2, ensure_ascii=False)
                    
                    # Also update articles.json
                    self.update_articles_json(metadata)
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    response = {'success': True, 'stats': metadata['stats']}
                    self.wfile.write(json.dumps(response).encode())
                else:
                    self.send_error(400, "Invalid stat type")
            else:
                self.send_error(404, "Article not found")
                
        except Exception as e:
            self.send_error(500, f"Error updating article stats: {str(e)}")
    
    def generate_slug(self, title):
        """Generate URL-friendly slug from title"""
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')  # Remove leading/trailing dashes
        return slug
    
    def calculate_reading_time(self, content):
        """Calculate reading time in minutes"""
        text_content = re.sub(r'<[^>]*>', '', content)  # Remove HTML tags
        words = text_content.split()
        return max(1, len(words) // 200)  # 200 words per minute
    
    def get_author_info(self, author_id):
        """Get author information"""
        authors = {
            'data-crusader': {
                'id': 'data-crusader',
                'name': 'Data Crusader',
                'role': 'Head of Data Strategy',
                'avatar': '🦸‍♂️',
                'bio': 'A seasoned data professional with over 10 years of experience in enterprise data architecture and information asymmetry strategies.',
                'articles': 16,
                'followers': 1247
            },
            'cosmic-analyst': {
                'id': 'cosmic-analyst',
                'name': 'Cosmic Analyst',
                'role': 'Data Architecture Lead',
                'avatar': '🌌',
                'bio': 'Specializing in building scalable data universes that connect disparate enterprise systems across organizational boundaries.',
                'articles': 13,
                'followers': 892
            },
            'web-weaver': {
                'id': 'web-weaver',
                'name': 'Web Weaver',
                'role': 'Analytics Specialist',
                'avatar': '🕷️',
                'bio': 'Expert in crafting compelling data narratives that transform complex information into actionable insights.',
                'articles': 19,
                'followers': 1156
            }
        }
        return authors.get(author_id, authors['data-crusader'])
    
    def generate_article_html(self, article_data):
        """Generate complete HTML for article"""
        author_info = article_data['author']
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="../../assets/images/favicon.svg">
    <title>{article_data['title']} - Kerv Talks-Data Blog</title>
    <meta name="description" content="{article_data['excerpt'] or 'Professional insights on data architecture and enterprise strategies.'}">
    <meta name="keywords" content="{', '.join(article_data['tags'])}, data architecture, information asymmetry">
    <meta name="author" content="{author_info['name']}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{article_data['title']}">
    <meta property="og:description" content="{article_data['excerpt'] or 'Professional insights on data architecture and enterprise strategies.'}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://kervtalksdata.com/articles/{article_data['slug']}/">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="../../assets/css/main.css">
    <link rel="stylesheet" href="../../assets/css/responsive.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "{article_data['title']}",
        "author": {{
            "@type": "Person",
            "name": "{author_info['name']}",
            "jobTitle": "{author_info['role']}"
        }},
        "publisher": {{
            "@type": "Organization",
            "name": "Kerv Talks-Data",
            "logo": {{
                "@type": "ImageObject",
                "url": "https://kervtalksdata.com/assets/images/logo.png"
            }}
        }},
        "datePublished": "{article_data['published']}",
        "description": "{article_data['excerpt'] or 'Professional insights on data architecture and enterprise strategies.'}"
    }}
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
            <span class="breadcrumb-current">{article_data['title']}</span>
        </nav>

        <section class="article-newsletter article-newsletter--top">
            <div class="newsletter-panel newsletter-panel--article">
                <p class="newsletter-panel__headline">Join data leaders gaining hands-on human experience with my free monthly newsletter.</p>
                <form class="newsletter-panel__form" action="#" method="post" novalidate data-source="api-article-top" data-component="article-newsletter">
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
                    <div class="article-category-badge">{article_data['category']}</div>
                    <h1 class="article-title-full">{article_data['title']}</h1>
                    
                    <div class="article-meta-full">
                        <div class="article-author-info">
                            <div class="article-avatar-large">{author_info['avatar']}</div>
                            <div class="author-details">
                                <div class="author-name">{author_info['name']}</div>
                                <div class="author-role">{author_info['role']}</div>
                            </div>
                        </div>
                        
                        <div class="article-stats-full">
                            <div class="stat-item">
                                <span class="stat-label">Published</span>
                                <span class="stat-value">{datetime.fromisoformat(article_data['published']).strftime('%B %d, %Y')}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Read time</span>
                                <span class="stat-value">{article_data['readTime']} min</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Views</span>
                                <span class="stat-value">{article_data['stats']['views']}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {f'''
                <!-- Article Image -->
                <div class="article-featured-image">
                    <img src="../../assets/images/articles/{article_data['image']['featured']}" alt="{article_data['title']}" style="width: 100%; object-fit: cover;" id="featured-image">
                </div>
                ''' if article_data['image']['featured'] else f'''
                <!-- Article Image -->
                <div class="article-featured-image">
                    <img src="../../assets/images/articles/{article_data['slug']}.jpg" alt="{article_data['title']}" style="width: 100%; object-fit: cover; display: none;" id="featured-image">
                    <div class="featured-image-placeholder" id="image-placeholder">{author_info['avatar']}</div>
                </div>
                '''}

                <!-- Article Body -->
                <div class="article-body">
                    {f'<p class="article-lead">{article_data["excerpt"]}</p>' if article_data['excerpt'] else ''}
                    <div class="article-content-html">{article_data['content']}</div>
                </div>

                <!-- Article Actions -->
                <div class="article-actions-full">
                    <button class="action-button like-button" data-article-id="{article_data['id']}">
                        <span class="action-icon">👍</span>
                        <span class="action-text">Like</span>
                        <span class="action-count">{article_data['stats']['likes']}</span>
                    </button>
                    
                    <button class="action-button share-button" data-article-id="{article_data['id']}">
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
                    {''.join([f'<span class="tag">{tag}</span>' for tag in article_data['tags']])}
                </div>

                <section class="article-author-section">
                    <div class="card author-card">
                        <div class="author-card-header">
                            <div class="author-avatar-sidebar">{author_info['avatar']}</div>
                            <div class="author-info-sidebar">
                                <h3>{author_info['name']}</h3>
                                <p>{author_info['role']}</p>
                            </div>
                        </div>
                        <p class="author-bio">{author_info['bio']}</p>
                        <div class="author-stats">
                            <div class="author-stat">
                                <span class="stat-number">{author_info['articles']}</span>
                                <span class="stat-label">Articles</span>
                            </div>
                            <div class="author-stat">
                                <span class="stat-number">{author_info['followers']}</span>
                                <span class="stat-label">Followers</span>
                            </div>
                        </div>
                    </div>
                </section>
            </article>
        </div>

        <section class="article-newsletter article-newsletter--bottom">
            <div class="newsletter-panel newsletter-panel--article">
                <p class="newsletter-panel__headline">Join data leaders gaining hands-on human experience with my free monthly newsletter.</p>
                <form class="newsletter-panel__form" action="#" method="post" novalidate data-source="api-article-bottom" data-component="article-newsletter">
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

        <!-- Comments Section -->
        <section class="comments-section" id="comments">
            <div class="comments-header">
                <h2>Comments ({article_data['stats']['comments']})</h2>
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
    <script src="../../assets/js/config.js"></script>
    <script src="../../assets/js/main.js"></script>
    <script src="../../assets/js/article.js"></script>
    <script src="../../assets/js/newsletter.js"></script>
    <script src="../../assets/js/analytics.js"></script>
</body>
</html>"""
    
    def update_articles_json(self, article_data):
        """Update the main articles.json file"""
        articles_file = self.data_dir / 'articles.json'
        
        # Read existing articles
        try:
            if articles_file.exists():
                with open(articles_file, 'r', encoding='utf-8') as f:
                    articles_data = json.load(f)
            else:
                articles_data = {'articles': []}
        except Exception as e:
            print(f"Error reading articles.json: {e}")
            articles_data = {'articles': []}
        
        # Check if article already exists
        existing_index = None
        for i, article in enumerate(articles_data['articles']):
            if article['id'] == article_data['id']:
                existing_index = i
                break
        
        # Create article entry
        article_entry = {
            'id': article_data['id'],
            'title': article_data['title'],
            'excerpt': article_data['excerpt'],
            'author': {
                'name': article_data['author']['name'],
                'avatar': article_data['author']['avatar'],
                'role': article_data['author']['role']
            },
            'published': article_data['published'].split('T')[0],  # Date only
            'readTime': article_data['readTime'],
            'category': article_data['category'],
            'tags': article_data['tags'],
            'image': article_data['image']['featured'] or f"{article_data['slug']}.jpg",
            'content': f"{article_data['slug']}-content.html",
            'likes': article_data['stats']['likes'],
            'comments': article_data['stats']['comments'],
            'views': article_data['stats']['views']
        }
        
        if existing_index is not None:
            # Update existing article
            articles_data['articles'][existing_index] = article_entry
            print("📝 Updated existing article in articles.json")
        else:
            # Add new article to the beginning
            articles_data['articles'].insert(0, article_entry)
            print("📝 Added new article to articles.json")
        
        # Write updated articles.json
        try:
            with open(articles_file, 'w', encoding='utf-8') as f:
                json.dump(articles_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error writing articles.json: {e}")
    
    def log_message(self, format, *args):
        """Override to customize logging"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def run_server(port=1978):
    """Run the API server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, BlogAPIHandler)
    
    print(f"🚀 Kerv Talks-Data Blog API Server running on port {port}")
    print(f"📝 Article creation endpoint: http://localhost:{port}/api/create-article")
    print(f"📚 Articles list endpoint: http://localhost:{port}/api/articles")
    print(f"🔍 Health check: http://localhost:{port}/api/health")
    print("Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    port_arg = 1979
    if len(sys.argv) > 1:
        try:
            port_arg = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port '{sys.argv[1]}', falling back to {port_arg}")
    run_server(port_arg)
