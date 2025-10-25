#!/bin/bash

# IONOS VPS Deployment Check - Simplified Version
echo "🚀 IONOS VPS Deployment Readiness Check"
echo "======================================="
echo ""

# Don't exit on errors
set +e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

READY=true

echo "📋 Basic Requirements Check"
echo "------------------------"

# 1. Node.js version
NODE_VERSION=$(node -v)
echo -e "Node.js: ${GREEN}$NODE_VERSION${NC} ✅"

# 2. npm version
NPM_VERSION=$(npm -v)
echo -e "npm: ${GREEN}$NPM_VERSION${NC} ✅"

# 3. Check build
echo ""
echo "🔨 Testing Build Process..."
echo "------------------------"
npm run build 2>&1 | tail -5

if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo "   Build size: $BUILD_SIZE"
else
    echo -e "${RED}❌ Build failed or output missing${NC}"
    READY=false
fi

# 4. Check required files
echo ""
echo "📁 Required Files Check"
echo "------------------------"
FILES=(
    "package.json"
    "ecosystem.config.js"
    "server/index.ts"
    "client/src/App.tsx"
    "vite.config.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "✅ $file"
    else
        echo -e "${RED}❌ $file missing${NC}"
        READY=false
    fi
done

# 5. Check deployment package
echo ""
echo "📦 Deployment Package Test"
echo "------------------------"
tar -czf test-deploy.tar.gz \
    package.json \
    package-lock.json \
    ecosystem.config.js \
    2>/dev/null

if [ -f "test-deploy.tar.gz" ]; then
    SIZE=$(du -h test-deploy.tar.gz | cut -f1)
    echo -e "${GREEN}✅ Package created: $SIZE${NC}"
    rm test-deploy.tar.gz
else
    echo -e "${RED}❌ Failed to create package${NC}"
    READY=false
fi

# 6. Environment variables
echo ""
echo "🔧 Environment Configuration"
echo "------------------------"

if [ -n "$IONOS_HOST" ]; then
    echo -e "${GREEN}✅ IONOS_HOST: $IONOS_HOST${NC}"
else
    echo -e "${YELLOW}⚠️  IONOS_HOST not set${NC}"
fi

if [ -n "$IONOS_USER" ]; then
    echo -e "${GREEN}✅ IONOS_USER: $IONOS_USER${NC}"
else
    echo -e "${YELLOW}⚠️  IONOS_USER not set${NC}"
fi

if [ -n "$IONOS_PATH" ]; then
    echo -e "${GREEN}✅ IONOS_PATH: $IONOS_PATH${NC}"
else
    echo -e "${YELLOW}⚠️  IONOS_PATH not set${NC}"
fi

# 7. Dependencies check
echo ""
echo "📚 Dependencies"
echo "------------------------"
TOTAL_DEPS=$(npm ls --depth=0 --production 2>/dev/null | wc -l)
echo "Production dependencies: ~$((TOTAL_DEPS-1))"
NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "N/A")
echo "node_modules size: $NODE_MODULES_SIZE"

# Summary
echo ""
echo "======================================="
echo "📊 DEPLOYMENT READINESS"
echo "======================================="

if [ "$READY" = true ]; then
    echo -e "${GREEN}✅ APPLICATION IS READY FOR DEPLOYMENT!${NC}"
    echo ""
    echo "To deploy to IONOS VPS:"
    echo "------------------------"
    echo "1. Set environment variables (if not set):"
    echo "   export IONOS_HOST=your-server.ionos.com"
    echo "   export IONOS_USER=your-username"
    echo "   export IONOS_PATH=/path/to/your/domain"
    echo ""
    echo "2. Run deployment script:"
    echo "   bash deploy-to-ionos.sh"
else
    echo -e "${YELLOW}⚠️  Some issues need attention${NC}"
    echo ""
    echo "Please fix the items marked with ❌ above"
fi

echo ""
echo "📝 IONOS VPS Requirements:"
echo "------------------------"
echo "• Node.js 18+ on server"
echo "• PM2 for process management"
echo "• PostgreSQL database"
echo "• 512MB+ RAM"
echo "• Ports 80, 443 open"
echo "• SSL certificate (Let's Encrypt)"
echo ""
echo "Test completed: $(date)"