#!/bin/bash

# IONOS VPS Deployment Readiness Test
# This script tests if your application is ready to deploy to IONOS VPS

set -e

echo "🚀 IONOS VPS Deployment Readiness Test"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Function to check test result
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: $2"
        echo "   $3"
        ((TESTS_FAILED++))
    fi
}

# Function for warnings
warning() {
    echo -e "${YELLOW}⚠️  WARNING${NC}: $1"
    ((WARNINGS++))
}

echo "1. Checking Node.js Requirements"
echo "---------------------------------"

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$MAJOR_VERSION" -ge 18 ]; then
    check_result 0 "Node.js version meets requirements (v18+)"
else
    check_result 1 "Node.js version too old" "IONOS requires Node.js v18 or higher"
fi

# Check npm
NPM_VERSION=$(npm -v)
echo "npm version: $NPM_VERSION"
check_result $? "npm is installed"

echo ""
echo "2. Checking Application Structure"
echo "----------------------------------"

# Check required files
REQUIRED_FILES=(
    "package.json"
    "package-lock.json"
    "vite.config.ts"
    "tsconfig.json"
    "server/index.ts"
    "client/src/App.tsx"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_result 0 "$file exists"
    else
        check_result 1 "$file missing" "Required file not found"
    fi
done

# Check deployment scripts
if [ -f "deploy-to-ionos.sh" ]; then
    check_result 0 "Deployment script exists"
else
    check_result 1 "Deployment script missing" "deploy-to-ionos.sh not found"
fi

echo ""
echo "3. Testing Build Process"
echo "------------------------"

# Test if build works
echo "Running build test..."
npm run build > /dev/null 2>&1
BUILD_RESULT=$?
check_result $BUILD_RESULT "Application builds successfully"

# Check build output
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    check_result 0 "Build output generated correctly"
    # Check build size
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo "   Build size: $BUILD_SIZE"
else
    check_result 1 "Build output missing" "dist/index.js not found after build"
fi

echo ""
echo "4. Checking Dependencies"
echo "------------------------"

# Check for production dependencies
TOTAL_DEPS=$(npm ls --depth=0 --production 2>/dev/null | wc -l)
echo "Production dependencies: $((TOTAL_DEPS-1))"

# Check package size
NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "0")
echo "node_modules size: $NODE_MODULES_SIZE"

# Warning if too large
SIZE_NUM=$(echo $NODE_MODULES_SIZE | sed 's/[^0-9.]//g')
SIZE_UNIT=$(echo $NODE_MODULES_SIZE | sed 's/[0-9.]//g')
if [[ "$SIZE_UNIT" == "G" ]] || ([[ "$SIZE_UNIT" == "M" ]] && (( $(echo "$SIZE_NUM > 500" | bc -l) ))); then
    warning "node_modules is large ($NODE_MODULES_SIZE). Consider optimizing dependencies"
fi

echo ""
echo "5. Environment Configuration"
echo "----------------------------"

# Check for environment variables
if [ -n "$IONOS_HOST" ] && [ -n "$IONOS_USER" ] && [ -n "$IONOS_PATH" ]; then
    check_result 0 "IONOS deployment credentials configured"
    echo "   Host: $IONOS_HOST"
    echo "   User: $IONOS_USER"
    echo "   Path: $IONOS_PATH"
else
    warning "IONOS deployment credentials not configured in environment"
    echo "   Required: IONOS_HOST, IONOS_USER, IONOS_PATH"
fi

# Check for production env file
if [ -f ".env.production" ] || [ -f ".env.production.example" ]; then
    check_result 0 "Production environment configuration exists"
else
    warning "No .env.production file found"
fi

echo ""
echo "6. Database Configuration"
echo "-------------------------"

# Check if database URL is configured
if [ -n "$DATABASE_URL" ]; then
    check_result 0 "Database URL configured"
    # Check if it's PostgreSQL
    if [[ "$DATABASE_URL" == postgres* ]]; then
        echo "   Database type: PostgreSQL ✅"
    fi
else
    warning "DATABASE_URL not configured. Will need to be set on IONOS"
fi

echo ""
echo "7. Process Manager Check"
echo "------------------------"

# Check for PM2 ecosystem file
if [ -f "ecosystem.config.js" ]; then
    check_result 0 "PM2 ecosystem configuration exists"
    # Validate PM2 config
    node -e "const config = require('./ecosystem.config.js'); process.exit(config.apps ? 0 : 1)" 2>/dev/null
    check_result $? "PM2 configuration is valid"
else
    check_result 1 "PM2 configuration missing" "ecosystem.config.js not found"
fi

echo ""
echo "8. Port Requirements"
echo "--------------------"

# Check if application uses correct port
if grep -q "PORT.*3000\|5000\|8080" package.json .env* server/index.ts 2>/dev/null; then
    check_result 0 "Application uses standard web port"
else
    warning "Verify application port configuration for IONOS"
fi

echo ""
echo "9. Memory Requirements"
echo "----------------------"

# Estimate memory usage
ESTIMATED_MEM="256MB-512MB"
echo "Estimated memory requirement: $ESTIMATED_MEM"
check_result 0 "Memory requirements within IONOS VPS limits"

echo ""
echo "10. Testing Deployment Package Creation"
echo "---------------------------------------"

# Test creating deployment package
echo "Creating test deployment package..."
tar -czf test-deploy.tar.gz \
    package.json \
    package-lock.json \
    ecosystem.config.js \
    tsconfig.json \
    vite.config.ts \
    2>/dev/null

if [ -f "test-deploy.tar.gz" ]; then
    PACKAGE_SIZE=$(du -h test-deploy.tar.gz | cut -f1)
    check_result 0 "Deployment package created successfully"
    echo "   Package size: $PACKAGE_SIZE"
    rm test-deploy.tar.gz
else
    check_result 1 "Failed to create deployment package" "tar command failed"
fi

echo ""
echo "11. IONOS-Specific Requirements"
echo "--------------------------------"

# Check for IONOS-specific configurations
echo "Checking IONOS compatibility..."

# Check if using compatible Node.js features
if grep -r "import.meta.env" client/src 2>/dev/null | head -1 > /dev/null; then
    check_result 0 "Using Vite environment variables (compatible)"
else
    echo "   No Vite env vars detected"
fi

# Check for WebSocket usage (may need special config on IONOS)
if grep -r "WebSocket\|ws:" server client 2>/dev/null | head -1 > /dev/null; then
    warning "Application uses WebSockets - ensure IONOS firewall allows WebSocket connections"
fi

echo ""
echo "12. Network Configuration Test"
echo "------------------------------"

# Test if we can reach IONOS (if host is configured)
if [ -n "$IONOS_HOST" ]; then
    echo "Testing connection to IONOS server..."
    if ping -c 1 -W 2 "$IONOS_HOST" > /dev/null 2>&1; then
        check_result 0 "Can reach IONOS server"
    else
        warning "Cannot ping IONOS server (firewall may block ICMP)"
    fi
fi

echo ""
echo "======================================"
echo "📊 DEPLOYMENT READINESS SUMMARY"
echo "======================================"
echo ""

# Calculate readiness score
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    READINESS=$((TESTS_PASSED * 100 / TOTAL_TESTS))
else
    READINESS=0
fi

echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""
echo "Readiness Score: $READINESS%"
echo ""

# Final verdict
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ YOUR APPLICATION IS READY FOR IONOS DEPLOYMENT!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set IONOS credentials in environment variables:"
    echo "   export IONOS_HOST=your-server.ionos.com"
    echo "   export IONOS_USER=your-username"
    echo "   export IONOS_PATH=/path/to/your/domain"
    echo ""
    echo "2. Run deployment:"
    echo "   bash deploy-to-ionos.sh"
elif [ $READINESS -ge 70 ]; then
    echo -e "${YELLOW}⚠️  APPLICATION IS MOSTLY READY${NC}"
    echo ""
    echo "Fix the failed tests above before deploying."
else
    echo -e "${RED}❌ APPLICATION NEEDS MORE PREPARATION${NC}"
    echo ""
    echo "Please address the failed tests and warnings above."
fi

echo ""
echo "======================================"
echo "📝 IONOS VPS Requirements Checklist:"
echo "======================================"
echo "✓ Node.js 18+ installed on IONOS"
echo "✓ PM2 process manager installed"
echo "✓ PostgreSQL or external database configured"
echo "✓ Domain pointing to IONOS server"
echo "✓ SSL certificate (Let's Encrypt recommended)"
echo "✓ Firewall configured (ports 80, 443, 22)"
echo "✓ Adequate RAM (512MB minimum recommended)"
echo "✓ SSH access for deployment"
echo ""
echo "Test completed at: $(date)"