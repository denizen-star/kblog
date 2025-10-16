# Cursor AI Project Prompt - Kerv Talks-Data Blog

## Project Overview
Create a **fully functional personal blog website** that matches the exact design and functionality of the provided reference files. This is a professional data blog with LinkedIn-inspired design for "Kerv Talks-Data" - a personal brand focused on information asymmetry and data topics.

**CRITICAL: This must be a complete, working blog application ready for immediate use on day 1 - not just a static design mockup. You must be able to upload images and create articles immediately upon completion.**

## Reference Files
The following files in the `blog2` folder serve as the complete design reference:
- `index.html` - Homepage with two-column layout
- `articles.html` - Articles listing page with filters
- `article-1.html` - Individual article page
- `about.html` - About page with team information
- `contact.html` - Contact page with form

## Key Requirements

### 1. Exact Visual Match
- **Replicate the design pixel-perfectly** from the reference files
- **Maintain the blue-gray color scheme** (#6A7B9A primary, #5A6B8A secondary)
- **Preserve the LinkedIn-inspired layout** with clean, professional styling
- **Keep the two-column layout** (main content + right sidebar)
- **Maintain responsive behavior** for mobile devices
- **No gradients anywhere** - use solid colors only
- **No CSS icons** - use uploaded images or text/emoji alternatives

### 2. Brand Identity
- **Name:** "Kerv Talks-Data"
- **Logo:** "KT" in a blue-gray square icon
- **Tagline:** "Data Expertise"
- **Color Palette:** Blue-gray (#8b9dc3), light beige background (#f3f2ef), white cards

### 3. Core Functionality (MUST WORK ON DAY 1)
- **Complete article management system** for creating, editing, and publishing content
- **Full image upload system** with drag-and-drop functionality
- **Content management dashboard** for managing all articles and images
- **Comment system** for community engagement
- **Search functionality** in the header
- **Category filtering** on articles page
- **Responsive design** for all screen sizes
- **Professional typography** and spacing
- **Image management** with automatic resizing and optimization
- **Draft and publish** workflow for articles

### 4. Content Structure
- **Homepage:** Post creation area + article feed + right sidebar
- **Articles Page:** Filterable grid of articles with pagination
- **Article Pages:** Full article content with comments and engagement
- **About Page:** Mission, team, and company information
- **Contact Page:** Contact form and information

### 5. Image Upload Requirements (FULLY FUNCTIONAL DAY 1)
- **File Upload Interface:** Drag-and-drop or click-to-upload functionality
- **Supported Formats:** JPG, PNG, WebP, GIF
- **File Size Limit:** Maximum 5MB per image
- **Image Processing:** Automatic resizing and optimization
- **Storage:** Local file system or cloud storage integration
- **Usage:** Replace placeholder backgrounds with uploaded images
- **Preview:** Real-time image preview before upload
- **Image Gallery:** Manage all uploaded images
- **Delete/Replace:** Full image management capabilities
- **Integration:** Seamless integration with article creation

## DAY 1 FUNCTIONALITY REQUIREMENTS

### Must-Have Features (Working Immediately)
1. **Article Creation Interface**
   - Rich text editor for writing articles
   - Title, excerpt, and content fields
   - Category and tag assignment
   - Draft and publish status controls
   - Save and auto-save functionality

2. **Image Upload System**
   - Drag-and-drop file upload interface
   - Multiple file format support (JPG, PNG, WebP, GIF)
   - File size validation (5MB limit)
   - Real-time upload progress
   - Image preview and management

3. **Content Management Dashboard**
   - List all created articles
   - Edit existing articles
   - Delete articles
   - Manage article status (draft/published)
   - Image gallery for uploaded files

4. **Blog Functionality**
   - Display published articles on homepage
   - Article detail pages with full content
   - Search functionality
   - Category filtering
   - Responsive design for all devices

## Technical Specifications

### Technology Stack
- **HTML5** with semantic markup
- **CSS3** with modern features (Grid, Flexbox, Custom Properties)
- **Vanilla JavaScript** for interactivity
- **Local storage** for content management (JSON files)
- **File API** for image uploads
- **Responsive design** with mobile-first approach

### File Structure
```
kerv-talks-data-blog/
├── index.html
├── about.html
├── contact.html
├── articles/
│   ├── index.html
│   └── [article-slug]/
│       └── index.html
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── components.css
│   ├── js/
│   │   └── main.js
│   └── images/
└── README.md
```

### CSS Architecture
- **CSS Custom Properties** for consistent theming
- **Component-based** CSS organization
- **Mobile-first** responsive design
- **Clean, maintainable** code structure

### JavaScript Features
- **Search functionality** with debounced input
- **Comment system** with nested replies
- **Article interactions** (like, share, bookmark)
- **Form handling** and validation
- **Responsive navigation** for mobile

## Design System

### Color Palette
```css
:root {
    --primary-color: #6A7B9A;
    --secondary-color: #5A6B8A;
    --background-color: #f3f2ef;
    --white: #ffffff;
    --black: #000000;
    --text-gray: #666666;
    --border-gray: #e0dfdc;
}
```

### Typography
- **Font Stack:** System fonts (-apple-system, BlinkMacSystemFont, etc.)
- **Headings:** 32px, 24px, 18px with 600 font-weight
- **Body Text:** 14px with 400 font-weight
- **Small Text:** 12px for metadata

### Layout
- **Container:** max-width 1128px, centered
- **Grid:** 2fr (main) + 1fr (sidebar) on desktop
- **Spacing:** 8px, 16px, 24px, 32px scale
- **Cards:** White background, 8px border-radius, subtle shadows

## Interactive Features

### Post Creation
- **Text area** for sharing insights
- **Action buttons** for Video, Photo, Article
- **Real-time character count**
- **Draft saving** (localStorage)

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
- **Sort options** (date, popularity)

## Content Management

### Article Structure
```json
{
    "id": "article-slug",
    "title": "Article Title",
    "excerpt": "Brief description...",
    "author": {
        "name": "Author Name",
        "avatar": "initials",
        "role": "Role Title"
    },
    "published": "2024-03-15",
    "readTime": 5,
    "category": "Strategy",
    "tags": ["tag1", "tag2"],
    "content": "Full article content...",
    "likes": 24,
    "comments": 8,
    "views": 156
}
```

### Comment System
- **Nested comments** with replies
- **User information** (name, avatar)
- **Timestamp** and engagement
- **Moderation** capabilities

## Performance Requirements

### Core Web Vitals
- **LCP:** < 2.5 seconds
- **FID:** < 100 milliseconds
- **CLS:** < 0.1

### Optimization
- **Image optimization** (WebP, responsive)
- **CSS/JS minification**
- **Lazy loading** for images
- **Efficient caching** strategy

## Accessibility

### WCAG 2.1 AA Compliance
- **Color contrast** ratios
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Focus indicators**
- **Semantic HTML** structure

## SEO Requirements

### Meta Tags
- **Title tags** with brand name
- **Meta descriptions** for each page
- **Open Graph** tags for social sharing
- **Structured data** for articles

### URL Structure
- **Clean URLs** with article slugs
- **Breadcrumb navigation**
- **XML sitemap** generation

## Deployment

### Hosting Options
- **Netlify** (recommended)
- **Vercel**
- **GitHub Pages**
- **Custom hosting**

### Domain Setup
- **Custom domain** configuration
- **SSL certificate** setup
- **CDN** configuration

## Success Criteria

### Visual Match
- **100% pixel-perfect** match to reference design
- **Consistent styling** across all pages
- **Proper responsive** behavior
- **Cross-browser** compatibility

### Functionality
- **All interactive features** working
- **Form submissions** handling
- **Search functionality** operational
- **Comment system** functional
- **Mobile navigation** working

### Performance
- **Fast loading** times
- **Smooth animations** and transitions
- **Optimized** for Core Web Vitals
- **Accessible** to all users

## Deliverables

1. **Complete website** with all pages
2. **Responsive design** for all devices
3. **Clean, documented** code
4. **Deployment** instructions
5. **Content management** guidelines
6. **Performance** optimization report

## Getting Started

1. **Review** the reference files in the `blog2` folder
2. **Set up** the project structure
3. **Create** the HTML templates
4. **Build** the CSS system
5. **Implement** JavaScript functionality
6. **Test** across devices and browsers
7. **Deploy** to hosting platform

## Notes

- **Focus on quality** over speed
- **Maintain consistency** with the reference design
- **Write clean, maintainable** code
- **Test thoroughly** before delivery
- **Document** any customizations or deviations

This project should result in a professional, fully-functional blog that perfectly matches the provided design while being optimized for performance, accessibility, and user experience.
