#!/bin/bash

# Script to create the astro-ui project structure
# Make sure to run this from your project root directory

echo "Creating astro-ui directory structure..."

# Create directories
mkdir -p components/layout
mkdir -p components/primitives
mkdir -p components/viz
mkdir -p components/tables
mkdir -p components/composed
mkdir -p lib

echo "Created directories ✓"

# Create layout components
touch components/layout/app-shell.tsx
touch components/layout/page-transition.tsx
touch components/layout/topbar.tsx
touch components/layout/sidebar.tsx
touch components/layout/theme-toggle.tsx

echo "Created layout components ✓"

# Create primitive components
touch components/primitives/chart-card.tsx
touch components/primitives/metric-card.tsx
touch components/primitives/now-card.tsx
touch components/primitives/section.tsx

echo "Created primitive components ✓"

# Create visualization components
touch components/viz/rashi-canvas.tsx
touch components/viz/timeline.tsx
touch components/viz/heatmap.tsx
touch components/viz/radar.tsx
touch components/viz/aspect-matrix.tsx

echo "Created visualization components ✓"

# Create table components
touch components/tables/data-table.tsx

echo "Created table components ✓"

# Create composed components
touch components/composed/natal-tabs.tsx
touch components/composed/strengths-grid.tsx
touch components/composed/varsha-annual.tsx

echo "Created composed components ✓"

# Create lib files
touch lib/utils.ts
touch lib/api-client.ts
touch lib/types.ts

echo "Created lib files ✓"

echo ""
echo "🎉 Directory structure created successfully!"
echo ""
echo "Structure created:"
echo "components/"
echo "  ├── layout/"
echo "  │   ├── app-shell.tsx"
echo "  │   ├── page-transition.tsx"
echo "  │   ├── topbar.tsx"
echo "  │   ├── sidebar.tsx"
echo "  │   └── theme-toggle.tsx"
echo "  ├── primitives/"
echo "  │   ├── chart-card.tsx"
echo "  │   ├── metric-card.tsx"
echo "  │   ├── now-card.tsx"
echo "  │   └── section.tsx"
echo "  ├── viz/"
echo "  │   ├── rashi-canvas.tsx"
echo "  │   ├── timeline.tsx"
echo "  │   ├── heatmap.tsx"
echo "  │   ├── radar.tsx"
echo "  │   └── aspect-matrix.tsx"
echo "  ├── tables/"
echo "  │   └── data-table.tsx"
echo "  └── composed/"
echo "      ├── natal-tabs.tsx"
echo "      ├── strengths-grid.tsx"
echo "      └── varsha-annual.tsx"
echo "lib/"
echo "  ├── utils.ts"
echo "  ├── api-client.ts"
echo "  └── types.ts"