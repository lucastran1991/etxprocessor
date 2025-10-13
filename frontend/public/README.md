# Favicon Files

This directory contains the favicon files for ETX Processor.

## Current Files

- `favicon.svg` - Modern SVG favicon (works in most browsers)
- `create-favicons.html` - Helper tool to generate PNG favicons

## Generating PNG/ICO Favicons (Optional)

Modern browsers support SVG favicons, but if you need PNG or ICO formats:

### Option 1: Use the HTML Generator
1. Open `create-favicons.html` in your browser
2. Right-click each canvas and save as PNG
3. Save as: `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`

### Option 2: Use Online Tools
1. Go to https://realfavicongenerator.net/
2. Upload the `favicon.svg` file
3. Download the generated favicon package
4. Place the files in this directory

### Option 3: Use ImageMagick (Command Line)
```bash
# Install ImageMagick first
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Ubuntu/Debian

# Convert SVG to various formats
convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 180x180 apple-touch-icon.png
convert favicon.svg -resize 32x32 favicon.ico
```

## Favicon Specifications

- **SVG**: Scalable, works in modern browsers
- **16x16**: Standard favicon size for browser tabs
- **32x32**: High-DPI displays
- **180x180**: Apple Touch Icon for iOS devices
- **ICO**: Legacy browsers (IE11 and older)

## Current Implementation

The app currently uses:
1. `favicon.svg` as the primary icon (modern browsers)
2. `favicon.ico` as fallback (if created)

All modern browsers (Chrome, Firefox, Safari, Edge) support SVG favicons natively.

