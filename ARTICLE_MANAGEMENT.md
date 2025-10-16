# Article Management Guide

## 📁 **File Structure & Naming Conventions**

### **Directory Structure:**
```
articles/
├── [YYYY-MM-DD]-[slug]/
│   ├── index.html          # Main article content
│   ├── metadata.json       # Article metadata
│   ├── comments.json       # Article-specific comments
│   └── assets/            # Article-specific images/assets (optional)
│       ├── featured.jpg
│       └── diagrams/
```

### **Naming Conventions:**

#### **1. Article Directories:**
- **Format:** `YYYY-MM-DD-[slug]`
- **Examples:**
  - `2024-10-16-kblog-test`
  - `2024-10-17-data-architecture-patterns`
  - `2024-10-18-information-asymmetry-strategies`

#### **2. Article Slugs:**
- **Rules:**
  - Lowercase only
  - Use hyphens instead of spaces
  - No special characters except hyphens
  - Keep under 50 characters
  - Be descriptive but concise
- **Examples:**
  - `kblog-test` ✅
  - `data-architecture-patterns` ✅
  - `information-asymmetry-strategies` ✅
  - `My Article Title!` ❌
  - `data_architecture_patterns` ❌

#### **3. File Names:**
- **index.html** - Always the main article file
- **metadata.json** - Always the metadata file
- **comments.json** - Always the comments file
- **featured.jpg** - Featured image (if any)

## 📊 **Metadata Structure**

### **metadata.json Schema:**
```json
{
  "id": "unique-article-id",
  "slug": "url-friendly-slug",
  "title": "Article Title",
  "excerpt": "Brief description...",
  "author": {
    "id": "author-id",
    "name": "Author Name",
    "avatar": "emoji or image path",
    "role": "Job Title",
    "bio": "Author biography"
  },
  "published": "ISO 8601 date",
  "updated": "ISO 8601 date",
  "status": "published|draft|archived",
  "readTime": 5,
  "category": "Strategy|Architecture|Analytics|Technology",
  "tags": ["tag1", "tag2"],
  "image": {
    "featured": "image-filename.jpg",
    "alt": "Alt text"
  },
  "stats": {
    "views": 0,
    "likes": 0,
    "comments": 0,
    "shares": 0
  },
  "seo": {
    "metaTitle": "SEO Title",
    "metaDescription": "SEO Description",
    "keywords": ["keyword1", "keyword2"],
    "canonical": "https://kervtalksdata.com/articles/slug/"
  },
  "settings": {
    "featured": false,
    "allowComments": true,
    "notifySubscribers": false,
    "archived": false
  },
  "content": {
    "wordCount": 500,
    "characterCount": 3000,
    "hasImages": true,
    "hasCode": false,
    "readingLevel": "beginner|intermediate|advanced"
  }
}
```

## 🔧 **Management Commands**

### **Create New Article:**
```bash
node create-article.js "My Article Title" "Strategy" "tag1,tag2"
```

### **List All Articles:**
```bash
node list-articles.js
```

### **Update Article Metadata:**
```bash
node update-article.js [slug] [field] [value]
```

### **Archive Article:**
```bash
node archive-article.js [slug]
```

## 📈 **Benefits of This System:**

### **1. Scalability:**
- Each article is self-contained
- Easy to backup individual articles
- No single point of failure

### **2. Performance:**
- Load only needed article data
- Faster article listing (load metadata only)
- Efficient caching

### **3. Management:**
- Easy to move/delete articles
- Simple version control
- Clear separation of concerns

### **4. SEO:**
- Individual metadata per article
- Easy to update SEO without touching content
- Better search engine indexing

### **5. Development:**
- Easy to test individual articles
- Simple to migrate to different systems
- Clear file organization

## 🚀 **Migration Strategy:**

### **Phase 1: Current System**
- Keep existing `articles.json` for backward compatibility
- Create new articles with the new structure

### **Phase 2: Gradual Migration**
- Convert existing articles to new structure
- Update article loading system

### **Phase 3: Full Migration**
- Remove old `articles.json`
- Use only individual metadata files

## 📝 **Best Practices:**

1. **Always use consistent naming**
2. **Keep metadata files small and focused**
3. **Use semantic versioning for article updates**
4. **Regular backups of article directories**
5. **Validate JSON files before deployment**
6. **Use descriptive slugs for better SEO**
7. **Keep images organized in article-specific folders**
