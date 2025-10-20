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

1. Clone the repository:
   ```bash
   git clone https://github.com/denizen-star/kblog.git
   cd kblog
   ```

2. Start the development server:
   ```bash
   python3 -m http.server 1978
   ```

3. Open your browser to `http://localhost:1978`

### Production Deployment

The site is automatically deployed to `kblog.kervinapps.com` via Netlify when changes are pushed to the main branch.

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Data**: JSON files for articles, authors, comments
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