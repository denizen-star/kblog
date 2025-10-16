# Kerv Talks-Data Blog - Cursor AI Project Brief

## Project Overview
Create a **fully functional personal blog website** for Kerv Talks-Data that matches the exact look and feel of the provided design. The blog must be **immediately usable on day 1** with complete article creation, image upload, and content management capabilities. The blog will feature articles about data topics and allow for community engagement through comments and discussions.

**CRITICAL REQUIREMENT: This must be a complete, working blog application from day 1 - not just a static design mockup.**

## Brand Identity
- **Name:** Kerv Talks-Data
- **Logo:** "KT" in a blue-gray square icon
- **Tagline:** "Information Asymmetry Experts"
- **Color Scheme:** Blue-gray (#6A7B9A) with professional LinkedIn-inspired design

## Design Requirements

### Visual Style
- **Clean, professional LinkedIn-inspired design**
- **White backgrounds with subtle gray borders**
- **Blue-gray (#6A7B9A) accent color**
- **Minimal shadows and clean typography**
- **Card-based layout with consistent spacing**

### Layout Structure
- **Two-column layout:** Main content (2/3 width) + Right sidebar (1/3 width)
- **Sticky header** with navigation and search
- **Responsive design** for mobile and desktop
- **Professional typography** using system fonts

## Technical Requirements

### Framework & Technology
- **HTML5** with semantic markup
- **CSS3** with modern features (Grid, Flexbox)
- **JavaScript** for interactive elements
- **Responsive design** with mobile-first approach
- **Clean, maintainable code structure**

### File Structure
```
kerv-talks-data-blog/
├── index.html
├── articles/
│   ├── index.html
│   └── [article-slugs]/
│       └── index.html
├── about.html
├── contact.html
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── components.css
│   ├── js/
│   │   └── main.js
│   └── images/
└── README.md
```

## Page Specifications

### 1. Homepage (index.html)
- **Hero section** with "Share an insight" post creation area
- **Article feed** with 3-5 featured articles
- **Right sidebar** with:
  - Profile card (Kerv Talks-Data)
  - Activity stats
  - Quick links
  - Premium insights card
  - News section
  - Challenges/puzzles section

### 2. Articles Page (articles/index.html)
- **Filter system** by category
- **Article grid** with thumbnails and metadata
- **Pagination** controls
- **Search functionality**

### 3. Article Detail Pages (articles/[slug]/index.html)
- **Full article content** with proper typography
- **Breadcrumb navigation**
- **Engagement buttons** (Like, Comment, Share)
- **Related articles** section
- **Comments section** for community interaction

### 4. About Page (about.html)
- **Mission statement** and story
- **Team section** with data expert profiles
- **Statistics** and impact metrics
- **Values** and approach

### 5. Contact Page (contact.html)
- **Contact form** with role selection
- **Contact information** with icons
- **Social media links**
- **FAQ section**

## Interactive Features

### Post Creation (FULLY FUNCTIONAL DAY 1)
- **Text area** for sharing insights with rich text editor
- **Image upload** with drag-and-drop functionality
- **Article creation** with title, content, and metadata
- **Real-time character count** and validation
- **Draft saving** and auto-save functionality
- **Publish/unpublish** controls
- **Category and tag** assignment
- **Featured image** upload and selection

### Article Engagement
- **Like/Unlike** functionality
- **Comment system** with threading
- **Share buttons** for social media
- **Reading time** estimation
- **View count** tracking

### Search & Filter
- **Global search** in header
- **Category filters** on articles page
- **Tag-based filtering**
- **Sort options** (date, popularity, relevance)

## Content Management (FULLY FUNCTIONAL DAY 1)

### Article Creation & Management
- **Complete article editor** with WYSIWYG functionality
- **Title, excerpt, and full content** editing
- **Author** information management
- **Publication date** and **reading time** calculation
- **Category and tags** assignment and management
- **Featured image** upload and selection
- **Article status** (draft, published, archived)
- **Article listing** and management dashboard
- **Edit and delete** existing articles
- **Bulk operations** for multiple articles

### Image Management System
- **Upload interface** for multiple image formats
- **Image gallery** for managing uploaded images
- **Automatic resizing** and optimization
- **Image metadata** storage and retrieval
- **Delete and replace** image functionality

### Comment System
- **Nested comments** with replies
- **User authentication** (optional)
- **Moderation** capabilities
- **Email notifications** for replies

## Performance Requirements

### Optimization
- **Fast loading** times (< 3 seconds)
- **Optimized images** with proper sizing
- **Minimal HTTP requests**
- **Efficient CSS** and JavaScript
- **SEO-friendly** structure

### Accessibility
- **WCAG 2.1 AA** compliance
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** ratios
- **Alt text** for images

## Deployment Requirements

### Hosting
- **Static site** hosting (Netlify, Vercel, GitHub Pages)
- **Custom domain** support
- **SSL certificate**
- **CDN** for global performance

### Analytics
- **Google Analytics** integration
- **Page view** tracking
- **User engagement** metrics
- **Performance monitoring**

## Future Enhancements

### Phase 2 Features
- **User accounts** and profiles
- **Newsletter** subscription
- **Advanced search** with filters
- **Article bookmarks** and favorites
- **Social media** integration

### Phase 3 Features
- **Admin dashboard** for content management
- **Comment moderation** tools
- **Email notifications** system
- **Advanced analytics** dashboard
- **Multi-language** support

## Success Criteria (DAY 1 DELIVERABLES)
- **Exact visual match** to provided design
- **Fully functional blog** with complete content management
- **Working image upload** system with file management
- **Complete article creation** and editing capabilities
- **Fully responsive** across all devices
- **Fast performance** and smooth interactions
- **Clean, maintainable** codebase
- **SEO optimized** for search engines
- **Accessible** to all users
- **Ready for immediate use** - no additional development needed

## Deliverables (DAY 1)
1. **Complete, fully functional blog website** with all pages
2. **Working content management system** for articles and images
3. **Image upload and management** functionality
4. **Article creation and editing** interface
5. **Responsive design** for all screen sizes
6. **Clean, documented** code
7. **Deployment** instructions
8. **User guide** for content management
9. **Performance** optimization report
10. **Ready-to-use** blog application
