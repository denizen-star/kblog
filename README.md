# Kerv Talks-Data Blog

A professional blog platform focused on data architecture, information asymmetry, and enterprise data strategies.

## Features

- **Environment-Aware Configuration**: Automatically adapts between development and production
- **Responsive Design**: Mobile-first approach with modern UI
- **Article Management**: Dynamic article loading and display
- **Search Functionality**: Real-time article search
- **Comment System**: Interactive commenting on articles

## Environment Configuration

The application automatically detects the environment and adjusts functionality:

- **Development** (`localhost`): Full access including Articles page and post creation
- **Production** (`kblog.kervinapps.com`): Public blog with restricted admin features

## Quick Start

### Local Development

For local development, you need to run two servers simultaneously:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/denizen-star/kblog.git
   cd kblog
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start both servers:**

   **Option A: Run servers separately (in two terminal windows)**
   
   Terminal 1 - Static file server (port 1978):
   ```bash
   python3 static_server.py
   # or
   npm run static
   ```
   
   Terminal 2 - API server (port 1977):
   ```bash
   node server.js
   # or
   npm start
   ```

   **Option B: Run both servers together (recommended)**
   ```bash
   npm run both
   ```

4. **Open your browser:**
   - Main site: `http://localhost:1978`
   - Article creation: `http://localhost:1978/articles/create/`
   - API health check: `http://localhost:1977/api/health`

### Server Ports

- **Port 1978**: Static file server (serves HTML, CSS, JS, images)
- **Port 1977**: API server (handles article creation, newsletter subscriptions, contact forms)

**Important**: Both servers must be running for full functionality. Article publishing requires the API server on port 1977.

### Troubleshooting

**Issue: "Failed to fetch" or "ERR_CONNECTION_REFUSED" when publishing articles**
- **Solution**: The API server on port 1977 is not running. Start it with `node server.js` or `npm start`.

**Issue: Port already in use**
- Check if a process is using the port: `lsof -i :1977` (macOS/Linux) or `netstat -ano | findstr :1977` (Windows)
- Kill the process or use a different port (requires configuration changes)

**Issue: Article creation page loads but publish button doesn't work**
- Verify both servers are running
- Check browser console for errors
- Verify API server is responding: `curl http://localhost:1977/api/health`

### Production Deployment

The site is automatically deployed to `kblog.kervinapps.com` via Netlify when changes are pushed to the main branch.

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express (API server)
- **Styling**: Custom CSS with responsive design
- **Data**: JSON files for articles, authors, comments
- **File Upload**: Multer for image handling
- **Deployment**: Netlify with GitHub integration

## Project Structure

```
kblog/
├── index.html                 # Homepage
├── articles/                  # Articles section
├── assets/                    # Static assets
│   ├── js/                   # JavaScript files
│   ├── css/                  # Stylesheets
│   └── images/               # Images and media
├── data/                     # JSON data files
├── docs/                     # Documentation
├── netlify.toml              # Netlify configuration
└── README.md                 # This file
```

## Documentation

- [Environment Configuration](docs/ENVIRONMENT_CONFIGURATION.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in both development and production environments
5. Submit a pull request

## License

This project is proprietary to Kerv Talks-Data.

## Contact

For questions or support, please contact the development team.