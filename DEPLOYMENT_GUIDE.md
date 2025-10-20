# Kerv Talks-Data Blog - Production Deployment Guide

**Target Domain:** `kblog.kervinapps.com`  
**Environment:** Production  
**Date:** October 20, 2025

---

## 🚀 **Environment-Aware Configuration**

The blog system now automatically detects the environment and uses appropriate URLs:

### **Development (localhost)**
- **API Server:** `http://localhost:1977`
- **Static Server:** `http://localhost:1978`
- **Environment Detection:** `localhost` or `127.0.0.1`

### **Production (kblog.kervinapps.com)**
- **API Server:** `https://kblog.kervinapps.com`
- **Static Server:** `https://kblog.kervinapps.com`
- **Environment Detection:** `kblog.kervinapps.com` or `*.kervinapps.com`

---

## 📁 **Files Modified for Environment Awareness**

### **New Configuration System**
- **`assets/js/config.js`** - Environment detection and URL management
- **`assets/js/main.js`** - Updated to use dynamic URLs
- **`assets/js/article-editor.js`** - Updated API endpoint
- **`assets/js/articles.js`** - Updated data loading URLs
- **`server.js`** - Environment-aware response URLs

### **HTML Files Updated**
- **`index.html`** - Added config.js script
- **`articles/index.html`** - Added config.js script
- **`articles/create/index.html`** - Added config.js script

---

## 🔧 **Production Deployment Steps**

### **1. Server Setup**

#### **Option A: Single Server (Recommended)**
Deploy both API and static files to the same server:

```bash
# Upload all files to kblog.kervinapps.com
# Structure:
kblog.kervinapps.com/
├── server.js              # API server
├── package.json           # Dependencies
├── static_server.py       # Static file server (if needed)
├── index.html             # Homepage
├── articles/              # Article pages
├── assets/                # CSS, JS, images
└── data/                  # JSON data files
```

#### **Option B: Separate Servers**
- **API Server:** Deploy Node.js app to one server
- **Static Server:** Deploy static files to another server/CDN

### **2. Environment Variables**

Set production environment variable:

```bash
export NODE_ENV=production
```

### **3. Dependencies Installation**

```bash
npm install
```

### **4. Server Configuration**

#### **For Single Server Setup:**
```bash
# Start the Node.js server (handles both API and static files)
NODE_ENV=production node server.js
```

#### **For Separate Servers:**
```bash
# API Server
NODE_ENV=production node server.js

# Static Server (if using Python)
python3 static_server.py
```

### **5. Reverse Proxy Configuration (Nginx)**

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name kblog.kervinapps.com;
    
    # SSL configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:1977;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location / {
        proxy_pass http://localhost:1978;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔄 **How Environment Detection Works**

### **Frontend Detection (config.js)**
```javascript
detectEnvironment() {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isProduction = hostname === 'kblog.kervinapps.com' || hostname.includes('kervinapps.com');
    
    return isLocalhost && !isProduction;
}
```

### **Backend Detection (server.js)**
```javascript
const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://kblog.kervinapps.com' 
    : 'http://localhost:1978';
```

---

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Test article creation locally
- [ ] Verify all hardcoded URLs are removed
- [ ] Check environment detection works
- [ ] Test API endpoints respond correctly

### **Deployment**
- [ ] Upload all files to production server
- [ ] Set `NODE_ENV=production`
- [ ] Install dependencies (`npm install`)
- [ ] Configure reverse proxy (if needed)
- [ ] Set up SSL certificates
- [ ] Configure domain DNS

### **Post-Deployment**
- [ ] Test homepage loads correctly
- [ ] Test article creation works
- [ ] Verify API endpoints respond
- [ ] Check article pages display properly
- [ ] Test search functionality
- [ ] Verify image uploads work

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. CORS Errors**
If you see CORS errors in production:
```javascript
// In server.js, ensure CORS is configured for production domain
app.use(cors({
    origin: ['https://kblog.kervinapps.com', 'http://localhost:1978']
}));
```

#### **2. Environment Not Detected**
Check browser console for configuration logs:
```javascript
// Should show:
🔧 Blog Configuration: {
    environment: 'production',
    apiBaseUrl: 'https://kblog.kervinapps.com',
    staticBaseUrl: 'https://kblog.kervinapps.com',
    isDevelopment: false
}
```

#### **3. API Endpoints Not Found**
Verify the API server is running and accessible:
```bash
curl https://kblog.kervinapps.com/api/health
# Should return: {"status":"OK","message":"Kerv Talks-Data Blog API is running"}
```

#### **4. Static Files Not Loading**
Check that static files are served correctly:
```bash
curl https://kblog.kervinapps.com/assets/js/config.js
# Should return the configuration file content
```

---

## 🔒 **Security Considerations**

### **Production Security**
- [ ] Enable HTTPS/SSL
- [ ] Set secure headers
- [ ] Configure CORS properly
- [ ] Validate file uploads
- [ ] Rate limit API endpoints
- [ ] Use environment variables for secrets

### **File Upload Security**
```javascript
// In server.js, ensure file validation
const allowedTypes = /jpeg|jpg|png|gif|webp/;
const maxFileSize = 5 * 1024 * 1024; // 5MB
```

---

## 📊 **Monitoring & Maintenance**

### **Health Checks**
- **API Health:** `GET /api/health`
- **Articles List:** `GET /api/articles`
- **Static Files:** Check main pages load

### **Logs to Monitor**
- API server logs
- Static server logs
- Error logs
- Access logs

### **Regular Maintenance**
- [ ] Monitor disk space (for uploaded images)
- [ ] Check article data integrity
- [ ] Backup data files regularly
- [ ] Update dependencies
- [ ] Monitor performance

---

## 🎯 **Success Criteria**

The deployment is successful when:

1. **Homepage loads** at `https://kblog.kervinapps.com`
2. **Article creation works** without errors
3. **API endpoints respond** correctly
4. **Environment detection** shows "production"
5. **No hardcoded localhost URLs** in browser network tab
6. **SSL certificate** is valid and working
7. **All functionality** works as in development

---

**Deployment Guide Generated:** October 20, 2025  
**System Status:** Ready for Production Deployment  
**Next Steps:** Deploy to kblog.kervinapps.com
