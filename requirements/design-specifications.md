# Design Specifications - Kerv Talks-Data Blog

## Color Palette

### Primary Colors
- **Primary Blue-Gray:** `#6A7B9A`
- **Secondary Blue-Gray:** `#5A6B8A` (for solid colors only)
- **Background:** `#f3f2ef` (light beige)
- **White:** `#ffffff`
- **Black:** `#000000`
- **Text Gray:** `#666666`
- **Border Gray:** `#e0dfdc`

**Important:** No gradients should be used anywhere. All visual elements should use solid colors only.

### Usage Guidelines
- **Primary Blue-Gray (#6A7B9A):** Links, buttons, active states, accents
- **Background (#f3f2ef):** Main page background
- **White (#ffffff):** Card backgrounds, content areas
- **Black (#000000):** Primary text, headings
- **Gray (#666666):** Secondary text, metadata
- **Border Gray (#e0dfdc):** Card borders, dividers

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
```

### Font Sizes & Weights
- **Page Titles:** 32px, font-weight: 600
- **Section Headings:** 24px, font-weight: 600
- **Article Titles:** 18px, font-weight: 600
- **Body Text:** 14px, font-weight: 400
- **Small Text:** 12px, font-weight: 400
- **Navigation:** 14px, font-weight: 500

### Line Heights
- **Headings:** 1.3
- **Body Text:** 1.6
- **Small Text:** 1.4

## Layout Specifications

### Grid System
- **Main Container:** max-width: 1128px
- **Two-Column Layout:** 2fr (main) + 1fr (sidebar)
- **Gap:** 24px between columns
- **Padding:** 24px on container sides

### Spacing Scale
- **XS:** 4px
- **SM:** 8px
- **MD:** 12px
- **LG:** 16px
- **XL:** 20px
- **XXL:** 24px
- **XXXL:** 32px

## Component Specifications

### Header
- **Height:** 52px
- **Background:** White with bottom border
- **Logo:** 34px × 34px square with "KT"
- **Search Bar:** 280px minimum width
- **Navigation:** Horizontal with 8px gaps

### Cards
- **Background:** White (#ffffff)
- **Border:** 1px solid #e0dfdc
- **Border Radius:** 8px
- **Padding:** 16px-32px (varies by content)
- **Shadow:** 0 1px 3px rgba(0, 0, 0, 0.1) on hover

### Buttons
- **Primary:** Blue-gray background, white text
- **Secondary:** White background, blue-gray text, border
- **Border Radius:** 4px-25px (varies by button type)
- **Padding:** 8px-16px vertical, 12px-24px horizontal
- **Hover:** Slight background color change

### Profile Card
- **Banner:** 60px height, solid color background (no gradients)
- **Avatar:** 72px diameter, circular
- **Name:** 16px, font-weight: 600
- **Title:** 14px, gray text
- **Company Link:** 14px, blue-gray color

### Article Cards
- **Image:** 200px height, solid color background (no gradients)
- **Title:** 18px, font-weight: 600, 2-line max
- **Excerpt:** 14px, gray text, 3-line max
- **Metadata:** 12px, gray text
- **Actions:** Horizontal row of buttons

## Interactive States

### Hover Effects
- **Links:** Color change to primary blue-gray
- **Buttons:** Background color change
- **Cards:** Subtle shadow increase
- **Navigation:** Background color change

### Active States
- **Navigation:** Blue-gray color + bottom border
- **Buttons:** Darker background color
- **Form Fields:** Blue-gray border color

### Focus States
- **Form Fields:** Blue-gray border + subtle glow
- **Buttons:** Outline or background change
- **Links:** Underline or color change

## Responsive Breakpoints

### Mobile (≤ 768px)
- **Single column** layout
- **Stacked** sidebar below main content
- **Reduced** padding and margins
- **Hidden** search bar
- **Simplified** navigation

### Tablet (769px - 1024px)
- **Two column** layout maintained
- **Adjusted** spacing
- **Full** navigation visible

### Desktop (≥ 1025px)
- **Full** two-column layout
- **Maximum** container width
- **All** features visible

## Animation & Transitions

### Duration
- **Fast:** 0.2s (hover states)
- **Medium:** 0.3s (general transitions)
- **Slow:** 0.5s (page transitions)

### Easing
- **Default:** ease
- **Hover:** ease-in-out
- **Page:** ease-out

### Properties
- **Color changes**
- **Background changes**
- **Transform (scale, translate)**
- **Opacity changes**
- **Box shadow changes**

## Image Upload Requirements

### Image Upload Functionality
- **File Upload:** Ability to upload images from local drive
- **Supported Formats:** JPG, PNG, WebP, GIF
- **File Size Limit:** Maximum 5MB per image
- **Image Processing:** Automatic resizing and optimization
- **Storage:** Local file system or cloud storage integration

### Image Usage
- **Article Featured Images:** Replace placeholder backgrounds
- **Profile Images:** User avatars and banners
- **Content Images:** Inline images within articles
- **Gallery Support:** Multiple images per article

**Important:** No CSS icons or icon fonts should be used. All visual elements should be uploaded images or simple text/emoji alternatives.

## Form Elements

### Input Fields
- **Border:** 1px solid #e0dfdc
- **Border Radius:** 4px
- **Padding:** 12px 16px
- **Background:** White
- **Focus:** Blue-gray border + glow

### Select Dropdowns
- **Same styling** as input fields
- **Dropdown arrow** on right
- **Hover states** for options

### Textareas
- **Same styling** as input fields
- **Resizable** vertically
- **Minimum height:** 120px

### Submit Buttons
- **Background:** Blue-gray (#6A7B9A)
- **Color:** White
- **Border:** None
- **Border Radius:** 4px
- **Padding:** 12px 24px
- **Font Weight:** 500

## Accessibility Requirements

### Color Contrast
- **Text on white:** Minimum 4.5:1 ratio
- **Text on colored backgrounds:** Minimum 4.5:1 ratio
- **Interactive elements:** Minimum 3:1 ratio

### Focus Indicators
- **Visible** focus outlines
- **High contrast** focus colors
- **Keyboard** navigation support

### Screen Reader Support
- **Semantic** HTML structure
- **Alt text** for images
- **ARIA labels** where needed
- **Proper** heading hierarchy

## Performance Guidelines

### Image Optimization
- **WebP format** preferred
- **Responsive** images with srcset
- **Lazy loading** for below-fold images
- **Optimized** file sizes

### CSS Optimization
- **Minified** production CSS
- **Critical** CSS inlined
- **Unused** CSS removed
- **Efficient** selectors

### JavaScript Optimization
- **Minified** production JS
- **Lazy loading** for non-critical scripts
- **Event delegation** for performance
- **Debounced** scroll/resize handlers
