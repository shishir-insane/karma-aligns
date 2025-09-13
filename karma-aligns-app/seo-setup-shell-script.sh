#!/bin/bash

# SEO Auto-Setup Script for Next.js
# This script automatically provisions complete SEO automation for Next.js projects
# Usage: ./setup-seo.sh [options]

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_SITE_NAME="Your Site Name"
DEFAULT_SITE_URL="https://yoursite.com"
DEFAULT_TITLE="Your Site Name - Default Title"
DEFAULT_DESCRIPTION="Your default site description here"
DEFAULT_TWITTER_HANDLE="@yourhandle"
DEFAULT_AUTHOR="Your Name"
DEFAULT_LOCALE="en_US"
DEFAULT_THEME_COLOR="#000000"

# Variables
SITE_NAME="$DEFAULT_SITE_NAME"
SITE_URL="$DEFAULT_SITE_URL"
TITLE="$DEFAULT_TITLE"
DESCRIPTION="$DEFAULT_DESCRIPTION"
TWITTER_HANDLE="$DEFAULT_TWITTER_HANDLE"
AUTHOR="$DEFAULT_AUTHOR"
LOCALE="$DEFAULT_LOCALE"
THEME_COLOR="$DEFAULT_THEME_COLOR"
ROUTER_TYPE="app"
OVERWRITE=false
SKIP_INSTALL=false
PROJECT_ROOT=$(pwd)

# Arrays to track created files and warnings
CREATED_FILES=()
WARNINGS=()

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print section headers
print_header() {
    echo ""
    print_color $CYAN "========================================="
    print_color $CYAN "$1"
    print_color $CYAN "========================================="
}

# Function to show help
show_help() {
    cat << EOF
SEO Auto-Setup Script for Next.js

USAGE:
    ./setup-seo.sh [OPTIONS]

OPTIONS:
    --site-name "Your Site Name"        Set the site name
    --site-url "https://yoursite.com"   Set the site URL  
    --author "Your Name"                Set the author name
    --twitter "@yourhandle"             Set Twitter handle
    --description "Site description"    Set default description
    --theme-color "#000000"             Set theme color
    --app-router                        Use App Router (default)
    --pages-router                      Use Pages Router
    --overwrite                         Overwrite existing files
    --skip-install                      Skip npm package installation
    --help, -h                          Show this help message

EXAMPLES:
    ./setup-seo.sh --site-name "My Blog" --site-url "https://myblog.com"
    ./setup-seo.sh --overwrite --author "John Doe" --twitter "@johndoe"
    ./setup-seo.sh --pages-router --site-name "My Store"

INTERACTIVE MODE:
    Run without arguments for interactive setup:
    ./setup-seo.sh

EOF
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --site-name)
                SITE_NAME="$2"
                shift 2
                ;;
            --site-url)
                SITE_URL="$2"
                shift 2
                ;;
            --author)
                AUTHOR="$2"
                shift 2
                ;;
            --twitter)
                TWITTER_HANDLE="$2"
                shift 2
                ;;
            --description)
                DESCRIPTION="$2"
                shift 2
                ;;
            --theme-color)
                THEME_COLOR="$2"
                shift 2
                ;;
            --app-router)
                ROUTER_TYPE="app"
                shift
                ;;
            --pages-router)
                ROUTER_TYPE="pages"
                shift
                ;;
            --overwrite)
                OVERWRITE=true
                shift
                ;;
            --skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_color $RED "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Function for interactive setup
interactive_setup() {
    print_header "🚀 Interactive SEO Setup"
    
    echo "Let's configure your SEO settings (press Enter for defaults):"
    echo ""
    
    read -p "Site Name [$DEFAULT_SITE_NAME]: " input
    SITE_NAME=${input:-$DEFAULT_SITE_NAME}
    
    read -p "Site URL [$DEFAULT_SITE_URL]: " input
    SITE_URL=${input:-$DEFAULT_SITE_URL}
    
    read -p "Author Name [$DEFAULT_AUTHOR]: " input
    AUTHOR=${input:-$DEFAULT_AUTHOR}
    
    read -p "Twitter Handle [$DEFAULT_TWITTER_HANDLE]: " input
    TWITTER_HANDLE=${input:-$DEFAULT_TWITTER_HANDLE}
    
    read -p "Default Description [$DEFAULT_DESCRIPTION]: " input
    DESCRIPTION=${input:-$DEFAULT_DESCRIPTION}
    
    read -p "Theme Color [$DEFAULT_THEME_COLOR]: " input
    THEME_COLOR=${input:-$DEFAULT_THEME_COLOR}
    
    echo ""
    echo "Router type:"
    echo "1) App Router (recommended)"
    echo "2) Pages Router"
    read -p "Choose (1-2) [1]: " router_choice
    
    case $router_choice in
        2)
            ROUTER_TYPE="pages"
            ;;
        *)
            ROUTER_TYPE="app"
            ;;
    esac
    
    read -p "Overwrite existing files? (y/N): " overwrite_choice
    case $overwrite_choice in
        [yY]|[yY][eE][sS])
            OVERWRITE=true
            ;;
        *)
            OVERWRITE=false
            ;;
    esac
    
    # Update title to include site name
    TITLE="$SITE_NAME - Default Title"
}

# Function to detect project structure
detect_project() {
    print_header "🔍 Detecting Project Structure"
    
    if [[ ! -f "package.json" ]]; then
        print_color $RED "❌ No package.json found. Please run this script in a Next.js project root."
        exit 1
    fi
    
    # Check if it's a Next.js project
    if ! grep -q "next" package.json; then
        print_color $YELLOW "⚠️  Warning: This doesn't appear to be a Next.js project."
        read -p "Continue anyway? (y/N): " continue_choice
        case $continue_choice in
            [yY]|[yY][eE][sS])
                ;;
            *)
                exit 1
                ;;
        esac
    fi
    
    # Auto-detect router type if not specified
    if [[ -d "app" && "$ROUTER_TYPE" == "auto" ]]; then
        ROUTER_TYPE="app"
    elif [[ -d "pages" && "$ROUTER_TYPE" == "auto" ]]; then
        ROUTER_TYPE="pages"
    fi
    
    print_color $GREEN "✅ Detected Next.js project with $ROUTER_TYPE router"
}

# Function to install dependencies
install_dependencies() {
    if [[ "$SKIP_INSTALL" == "true" ]]; then
        print_color $YELLOW "⏭️  Skipping package installation"
        return
    fi
    
    print_header "📦 Installing Dependencies"
    
    # Check package manager
    if [[ -f "yarn.lock" ]]; then
        PKG_MANAGER="yarn"
        INSTALL_CMD="yarn add"
        DEV_INSTALL_CMD="yarn add -D"
    elif [[ -f "pnpm-lock.yaml" ]]; then
        PKG_MANAGER="pnpm"
        INSTALL_CMD="pnpm add"
        DEV_INSTALL_CMD="pnpm add -D"
    else
        PKG_MANAGER="npm"
        INSTALL_CMD="npm install"
        DEV_INSTALL_CMD="npm install -D"
    fi
    
    print_color $BLUE "Using package manager: $PKG_MANAGER"
    
    # Install production dependencies
    print_color $BLUE "Installing production dependencies..."
    $INSTALL_CMD next-sitemap web-vitals || {
        WARNINGS+=("Failed to install some production dependencies")
    }
    
    # Install development dependencies
    print_color $BLUE "Installing development dependencies..."
    $DEV_INSTALL_CMD @lhci/cli lighthouse || {
        WARNINGS+=("Failed to install some development dependencies")
    }
    
    print_color $GREEN "✅ Dependencies installed"
}

# Function to create directory structure
create_directories() {
    print_header "📁 Creating Directory Structure"
    
    local dirs=("utils" "components" "scripts" ".github/workflows")
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            print_color $GREEN "  Created: $dir/"
        fi
    done
}

# Function to write file with overwrite check
write_file() {
    local file_path="$1"
    local content="$2"
    local dir_path=$(dirname "$file_path")
    
    # Create directory if it doesn't exist
    [[ ! -d "$dir_path" ]] && mkdir -p "$dir_path"
    
    # Check if file exists and overwrite flag
    if [[ -f "$file_path" && "$OVERWRITE" == "false" ]]; then
        WARNINGS+=("File $file_path already exists. Use --overwrite to replace.")
        return
    fi
    
    echo "$content" > "$file_path"
    CREATED_FILES+=("$file_path")
    print_color $GREEN "  Created: $file_path"
}

# Function to create configuration files
create_config_files() {
    print_header "⚙️ Creating Configuration Files"
    
    # utils/constants.js
    local constants_content="export const SEO_CONFIG = {
  siteName: '$SITE_NAME',
  siteUrl: '$SITE_URL',
  defaultTitle: '$TITLE',
  titleTemplate: '%s | $SITE_NAME',
  defaultDescription: '$DESCRIPTION',
  defaultImage: '/default-og-image.jpg',
  twitterHandle: '$TWITTER_HANDLE',
  author: '$AUTHOR',
  locale: '$LOCALE',
  themeColor: '$THEME_COLOR',
}"
    
    write_file "utils/constants.js" "$constants_content"
    
    # next-sitemap.config.js
    local sitemap_config="/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: '$SITE_URL',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
    ],
    additionalSitemaps: [
      '$SITE_URL/sitemap.xml',
    ],
  },
  exclude: ['/admin/*', '/api/*', '/private/*'],
  transform: async (config, path) => {
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      }
    }
    
    if (path.startsWith('/blog/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: new Date().toISOString(),
      }
    }
    
    return {
      loc: path,
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    }
  },
}"
    
    write_file "next-sitemap.config.js" "$sitemap_config"
}

# Function to create utility files
create_utility_files() {
    print_header "🛠️ Creating Utility Files"
    
    # utils/seo.js
    local seo_utils="import { SEO_CONFIG } from './constants'

/**
 * Automatically generates comprehensive SEO metadata
 */
export function generateSEOMetadata({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  tags = [],
  author,
  noIndex = false,
  canonical,
}) {
  const cleanTitle = title ? title.trim() : SEO_CONFIG.defaultTitle
  const finalTitle = cleanTitle === SEO_CONFIG.siteName ? cleanTitle : \`\${cleanTitle} | \${SEO_CONFIG.siteName}\`
  
  const finalDescription = description || SEO_CONFIG.defaultDescription
  
  const finalImage = image?.startsWith('http') ? image : 
                     image ? \`\${SEO_CONFIG.siteUrl}\${image}\` : 
                     \`\${SEO_CONFIG.siteUrl}\${SEO_CONFIG.defaultImage}\`
  
  const finalCanonical = canonical || url || SEO_CONFIG.siteUrl
  const keywords = Array.isArray(tags) ? tags.join(', ') : tags || ''

  return {
    title: finalTitle,
    description: finalDescription,
    keywords,
    authors: author ? [{ name: author }] : [{ name: SEO_CONFIG.author }],
    creator: author || SEO_CONFIG.author,
    publisher: SEO_CONFIG.siteName,
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: finalCanonical,
      siteName: SEO_CONFIG.siteName,
      images: [{
        url: finalImage,
        width: 1200,
        height: 630,
        alt: title || SEO_CONFIG.siteName,
      }],
      locale: SEO_CONFIG.locale,
      type,
      publishedTime,
      modifiedTime,
      authors: author ? [author] : [SEO_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      creator: SEO_CONFIG.twitterHandle,
      images: [finalImage],
    },
    alternates: {
      canonical: finalCanonical,
    },
    other: {
      'theme-color': SEO_CONFIG.themeColor,
    },
  }
}

/**
 * Auto-generates SEO from any CMS/API data structure
 */
export function autoGenerateSEO(data, options = {}) {
  if (!data) {
    return generateSEOMetadata({
      title: 'Content Not Found',
      description: 'The requested content could not be found.',
      noIndex: true,
      ...options,
    })
  }

  const detectedFields = {
    title: data.seoTitle || data.title || data.name || data.headline,
    description: data.seoDescription || data.description || data.excerpt || data.summary || generateExcerpt(data.content || data.body),
    image: data.seoImage || data.featuredImage || data.image || data.thumbnail,
    url: options.url || \`\${SEO_CONFIG.siteUrl}/\${data.slug || data.id}\`,
    publishedTime: data.publishedAt || data.createdAt || data.datePublished,
    modifiedTime: data.updatedAt || data.modifiedAt || data.dateModified,
    author: data.author?.name || data.authorName || data.creator,
    tags: data.tags || data.categories || data.keywords,
    type: options.type || detectContentType(data),
  }

  return generateSEOMetadata({
    ...detectedFields,
    ...options,
  })
}

function detectContentType(data) {
  if (data.price || data.sku) return 'product'
  if (data.author || data.publishedAt) return 'article'
  if (data.jobTitle || data.company) return 'profile'
  return 'website'
}

export function generateExcerpt(content, maxLength = 160) {
  if (!content) return ''
  const text = typeof content === 'string' ? content : content.toString()
  const stripped = text.replace(/<[^>]*>/g, '').replace(/\\s+/g, ' ').trim()
  return stripped.length <= maxLength ? stripped : stripped.slice(0, maxLength) + '...'
}"
    
    write_file "utils/seo.js" "$seo_utils"
    
    # utils/structuredData.js
    local structured_data="import { SEO_CONFIG } from './constants'

export function generateStructuredData(data, type) {
  const baseSchema = {
    '@context': 'https://schema.org',
  }

  switch (type) {
    case 'article':
      return {
        ...baseSchema,
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        author: {
          '@type': 'Person',
          name: data.author || SEO_CONFIG.author,
        },
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime || data.publishedTime,
        image: data.image,
        publisher: {
          '@type': 'Organization',
          name: SEO_CONFIG.siteName,
          logo: {
            '@type': 'ImageObject',
            url: \`\${SEO_CONFIG.siteUrl}/logo.png\`,
          },
        },
      }

    case 'product':
      return {
        ...baseSchema,
        '@type': 'Product',
        name: data.title,
        description: data.description,
        image: Array.isArray(data.images) ? data.images : [data.image],
        offers: data.price ? {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: data.currency || 'USD',
          availability: data.inStock ? 'InStock' : 'OutOfStock',
        } : undefined,
      }

    default:
      return {
        ...baseSchema,
        '@type': 'WebPage',
        name: data.title,
        description: data.description,
        url: data.url,
      }
  }
}

export function StructuredDataScript({ data, type }) {
  if (typeof window !== 'undefined') return null

  const schema = generateStructuredData(data, type)
  
  return (
    <script
      type=\"application/ld+json\"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}"
    
    write_file "utils/structuredData.js" "$structured_data"
}

# Function to create React components
create_components() {
    print_header "🧩 Creating React Components"
    
    local optimized_image="import Image from 'next/image'

export function OptimizedImage({ 
  src, 
  alt, 
  title,
  width, 
  height, 
  priority = false,
  className = '',
  ...props 
}) {
  const autoAlt = alt || title || 
    (typeof src === 'string' ? 
      src.split('/').pop()?.split('.')[0]?.replace(/[-_]/g, ' ') : 
      'Image')

  return (
    <Image
      src={src}
      alt={autoAlt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      sizes=\"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw\"
      {...props}
    />
  )
}"
    
    write_file "components/OptimizedImage.js" "$optimized_image"
}

# Function to create layout files
create_layout_files() {
    print_header "🏗️ Creating Layout Files"
    
    if [[ "$ROUTER_TYPE" == "app" ]]; then
        create_app_router_files
    else
        create_pages_router_files
    fi
}

# Function to create App Router files
create_app_router_files() {
    [[ ! -d "app" ]] && mkdir -p "app"
    
    # app/layout.js
    local layout_content="import { SEO_CONFIG } from '@/utils/constants'
import { generateSEOMetadata } from '@/utils/seo'

export const metadata = generateSEOMetadata({
  title: SEO_CONFIG.defaultTitle,
  description: SEO_CONFIG.defaultDescription,
  url: SEO_CONFIG.siteUrl,
})

export default function RootLayout({ children }) {
  return (
    <html lang=\"en\">
      <head>
        <link rel=\"icon\" href=\"/favicon.ico\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}"
    
    write_file "app/layout.js" "$layout_content"
    
    # app/sitemap.js
    local sitemap_content="import { SEO_CONFIG } from '@/utils/constants'

export default async function sitemap() {
  const staticRoutes = [
    {
      url: SEO_CONFIG.siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: \`\${SEO_CONFIG.siteUrl}/about\`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // TODO: Add your dynamic routes here
  try {
    return [...staticRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticRoutes
  }
}"
    
    write_file "app/sitemap.js" "$sitemap_content"
    
    # app/robots.js
    local robots_content="import { SEO_CONFIG } from '@/utils/constants'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/private/'],
    },
    sitemap: \`\${SEO_CONFIG.siteUrl}/sitemap.xml\`,
  }
}"
    
    write_file "app/robots.js" "$robots_content"
    
    # Example blog page
    create_example_blog_page
}

# Function to create Pages Router files
create_pages_router_files() {
    [[ ! -d "pages" ]] && mkdir -p "pages"
    
    # Only create _app.js if it doesn't exist
    if [[ ! -f "pages/_app.js" ]]; then
        local app_content="import Head from 'next/head'
import { SEO_CONFIG } from '@/utils/constants'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
        <link rel=\"icon\" href=\"/favicon.ico\" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}"
        write_file "pages/_app.js" "$app_content"
    else
        WARNINGS+=("pages/_app.js already exists. Please manually integrate SEO configuration.")
    fi
}

# Function to create example blog page
create_example_blog_page() {
    mkdir -p "app/blog/[slug]"
    
    local blog_page="import { autoGenerateSEO } from '@/utils/seo'
import { StructuredDataScript } from '@/utils/structuredData'

export async function generateMetadata({ params }) {
  const post = await fetchPost(params.slug)
  
  return autoGenerateSEO(post, {
    type: 'article',
    url: \`\${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/\${params.slug}\`,
  })
}

export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug)

  if (!post) {
    return (
      <div>
        <h1>Post not found</h1>
        <p>The requested blog post could not be found.</p>
      </div>
    )
  }

  return (
    <>
      <StructuredDataScript data={post} type=\"article\" />
      <article>
        <h1>{post.title}</h1>
        {post.description && <p>{post.description}</p>}
        <div dangerouslySetInnerHTML={{ __html: post.content || 'Content goes here...' }} />
      </article>
    </>
  )
}

// TODO: Replace with your actual API call
async function fetchPost(slug) {
  // Mock data for now
  return {
    title: \`Blog Post: \${slug}\`,
    description: 'This is a sample blog post description.',
    content: '<p>Replace fetchPost function with your actual API call.</p>',
    author: { name: 'Sample Author' },
    publishedAt: new Date().toISOString(),
    slug: slug,
  }
}"
    
    write_file "app/blog/[slug]/page.js" "$blog_page"
}

# Function to create automation scripts
create_scripts() {
    print_header "🤖 Creating Automation Scripts"
    
    # scripts/seo-monitor.js
    local monitor_script="// SEO Monitoring and Analytics
export function initSEOMonitoring() {
  if (typeof window === 'undefined') return

  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    const sendToAnalytics = (metric) => {
      console.log('SEO Metric:', metric)
      // TODO: Send to your analytics service
    }

    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)
  }).catch(console.error)
}"
    
    write_file "scripts/seo-monitor.js" "$monitor_script"
    
    # scripts/validate-seo.js
    local validate_script="#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateSEOSetup() {
  console.log('🔍 Validating SEO setup...');
  
  const requiredFiles = [
    'utils/constants.js',
    'utils/seo.js',
    'utils/structuredData.js',
    'components/OptimizedImage.js',
    'next-sitemap.config.js',
  ];
  
  const missing = [];
  const existing = [];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      existing.push(file);
    } else {
      missing.push(file);
    }
  });
  
  console.log('✅ Existing files:');
  existing.forEach(file => console.log(\`   \${file}\`));
  
  if (missing.length > 0) {
    console.log('\\n❌ Missing files:');
    missing.forEach(file => console.log(\`   \${file}\`));
    process.exit(1);
  }
  
  console.log('\\n🎉 All SEO files are in place!');
}

validateSEOSetup();"
    
    write_file "scripts/validate-seo.js" "$validate_script"
    chmod +x scripts/validate-seo.js
}

# Function to update package.json
update_package_json() {
    print_header "📦 Updating package.json"
    
    # Create a temporary Node.js script to update package.json
    local update_script="const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts = {
  ...packageJson.scripts,
  'seo:generate': 'next-sitemap',
  'seo:validate': 'node scripts/validate-seo.js',
  'seo:build': 'npm run build && npm run seo:generate',
  'lighthouse': 'lhci autorun',
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Added SEO scripts to package.json');"
    
    echo "$update_script" | node
}

# Function to create additional files
create_additional_files() {
    print_header "📄 Creating Additional Files"
    
    # .env.example
    local env_example="# SEO Configuration
NEXT_PUBLIC_SITE_URL=$SITE_URL
NEXT_PUBLIC_SITE_NAME=$SITE_NAME

# Analytics (optional)
GOOGLE_ANALYTICS_ID=
GOOGLE_TAG_MANAGER_ID=

# Lighthouse CI (optional)
LHCI_GITHUB_APP_TOKEN="
    
    write_file ".env.example" "$env_example"
    
    # lighthouserc.js
    local lighthouse_config="module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};"
    
    write_file "lighthouserc.js" "$lighthouse_config"
    
    # GitHub Actions workflow
    local workflow="name: SEO Check and Deploy

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  seo-check:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      