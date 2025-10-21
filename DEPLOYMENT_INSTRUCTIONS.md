# Deployment Instructions for kblog.kervinapps.com

## Prerequisites

1. **GitHub Account**: `denizen-star` user
2. **Netlify Account**: Connected to GitHub
3. **Domain**: `kblog.kervinapps.com` configured

## Step-by-Step Deployment

### 1. GitHub Repository Setup

```bash
# Push to GitHub (run this after creating the repo on GitHub)
git push -u origin main
```

### 2. Netlify Configuration

1. **Login to Netlify**: https://app.netlify.com
2. **New Site from Git**: Click "New site from Git"
3. **Connect to GitHub**: Authorize Netlify to access your repositories
4. **Select Repository**: Choose `denizen-star/kblog`
5. **Build Settings**:
   - Build command: `echo 'Static site - no build required'`
   - Publish directory: `.` (root directory)
   - Click "Deploy site"

### 3. Custom Domain Setup

1. **Add Custom Domain**:
   - In Netlify dashboard, go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter: `kblog.kervinapps.com`

2. **DNS Configuration**:
   - Add CNAME record: `kblog` → `your-site-name.netlify.app`
   - Or A record: `kblog.kervinapps.com` → Netlify IP addresses

### 4. Environment Verification

After deployment, verify the environment detection:

- **Production Site** (`kblog.kervinapps.com`):
  - ✅ Articles page should be hidden from navigation
  - ✅ Post creation form should be hidden
  - ✅ Clean public blog experience

- **Local Development** (`localhost:1978`):
  - ✅ Articles page visible in navigation
  - ✅ Post creation form enabled
  - ✅ Full development features

## Automatic Deployment

Once configured, any push to the `main` branch will automatically trigger a new deployment:

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main
```

## Troubleshooting

### Common Issues

1. **Environment Detection Not Working**:
   - Check browser console for `window.blogConfig.logConfig()`
   - Verify hostname detection in `config.js`

2. **Articles Page Still Visible in Production**:
   - Clear browser cache
   - Check Netlify build logs
   - Verify `netlify.toml` configuration

3. **Images Not Loading**:
   - Check file paths in `assets/images/articles/`
   - Verify image files are committed to git

### Netlify Build Logs

Check build logs in Netlify dashboard:
- Site settings → Build & deploy → Deploys
- Click on latest deploy to see logs

## Security Considerations

- Environment detection is client-side only
- Sensitive admin features are hidden, not secured
- Consider server-side authentication for production admin features

## Performance Optimization

The `netlify.toml` includes:
- Static asset caching (1 year)
- Security headers
- SPA routing redirects

## Support

For deployment issues:
1. Check Netlify status page
2. Review build logs
3. Test locally first
4. Contact development team
