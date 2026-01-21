#!/bin/bash

# Script to update version across package.json, Helm values.yaml, and Chart.yaml
# Usage: ./set-version.sh <major.minor.patch>

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if version argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version argument required${NC}"
    echo "Usage: $0 <major.minor.patch>"
    echo "Example: $0 1.9.0"
    exit 1
fi

VERSION="$1"

# Validate version format (major.minor.patch)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}Error: Invalid version format${NC}"
    echo "Version must be in format: major.minor.patch (e.g., 1.9.0)"
    exit 1
fi

# Define file paths relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_JSON="$SCRIPT_DIR/package.json"
VALUES_YAML="$SCRIPT_DIR/helm/realtime-chat/values.yaml"
CHART_YAML="$SCRIPT_DIR/helm/realtime-chat/Chart.yaml"

# Check if files exist
for file in "$PACKAGE_JSON" "$VALUES_YAML" "$CHART_YAML"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: File not found: $file${NC}"
        exit 1
    fi
done

# Update package.json version
echo "Updating package.json..."
sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/" "$PACKAGE_JSON"

# Update values.yaml image tag
echo "Updating values.yaml..."
sed -i '' "s/tag: \"[0-9]*\.[0-9]*\.[0-9]*\"/tag: \"$VERSION\"/" "$VALUES_YAML"

# Update Chart.yaml appVersion
echo "Updating Chart.yaml appVersion..."
sed -i '' "s/appVersion: \"[0-9]*\.[0-9]*\.[0-9]*\"/appVersion: \"$VERSION\"/" "$CHART_YAML"

# Get current Chart.yaml version and increment patch
CURRENT_CHART_VERSION=$(grep "^version:" "$CHART_YAML" | sed 's/version: //')
CHART_MAJOR=$(echo "$CURRENT_CHART_VERSION" | cut -d. -f1)
CHART_MINOR=$(echo "$CURRENT_CHART_VERSION" | cut -d. -f2)
CHART_PATCH=$(echo "$CURRENT_CHART_VERSION" | cut -d. -f3)
NEW_CHART_PATCH=$((CHART_PATCH + 1))
NEW_CHART_VERSION="$CHART_MAJOR.$CHART_MINOR.$NEW_CHART_PATCH"

echo "Updating Chart.yaml version..."
sed -i '' "s/^version: [0-9]*\.[0-9]*\.[0-9]*/version: $NEW_CHART_VERSION/" "$CHART_YAML"

# Print summary
echo ""
echo -e "${GREEN}Version update complete!${NC}"
echo "================================"
echo "App version set to: $VERSION"
echo "  - package.json: $VERSION"
echo "  - values.yaml image tag: $VERSION"
echo "  - Chart.yaml appVersion: $VERSION"
echo "  - Chart.yaml version: $CURRENT_CHART_VERSION -> $NEW_CHART_VERSION"