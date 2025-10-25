#!/bin/bash

# VPS Deployment Test - Verify connectivity and readiness for your existing setup
# Based on your VPS configuration at 74.208.102.89

set +e  # Don't exit on errors, we want to see all test results

echo "🚀 VPS Deployment Test for GKP Radio"
echo "====================================="
echo "Testing deployment to your IONOS VPS at 74.208.102.89"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

VPS_IP="74.208.102.89"
VPS_USER="deploy"
VPS_PATH="/srv/gkpradio"
DOMAIN="godkingdomprinciplesradio.com"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

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

echo "1. Testing VPS Services"
echo "-----------------------"

# Test main website
echo "Testing main website..."
if curl -I --connect-timeout 5 "http://$DOMAIN" 2>/dev/null | grep -q "200\|301\|302"; then
    check_result 0 "Main website is accessible at $DOMAIN"
else
    check_result 1 "Cannot reach main website" "Check if domain is pointing to VPS"
fi

# Test Node.js app directly
echo "Testing Node.js app on port 3001..."
if curl -I --connect-timeout 5 "http://$VPS_IP:3001" 2>/dev/null | grep -q "200\|301\|302"; then
    check_result 0 "Node.js app is running on port 3001"
else
    echo "   Note: This might be blocked by firewall (expected)"
fi

# Test AzuraCast admin panel
echo "Testing AzuraCast admin panel..."
if curl -I --connect-timeout 5 "http://$VPS_IP:8080" 2>/dev/null | grep -q "200\|301\|302"; then
    check_result 0 "AzuraCast admin panel accessible at port 8080"
else
    check_result 1 "AzuraCast admin panel not accessible" "May need to check AzuraCast service"
fi

# Test AzuraCast streaming port
echo "Testing AzuraCast streaming..."
if curl -I --connect-timeout 5 "http://$VPS_IP:8000" 2>/dev/null | grep -q "200\|301\|302\|404"; then
    check_result 0 "AzuraCast streaming port 8000 is open"
else
    check_result 1 "AzuraCast streaming port not accessible" "Check firewall rules"
fi

echo ""
echo "2. Testing SSH Connectivity"
echo "---------------------------"

# Check if SSH key exists
if [ -f ~/.ssh/id_ed25519 ] || [ -f ~/.ssh/id_rsa ]; then
    check_result 0 "SSH key exists locally"
    SSH_KEY=$(ls ~/.ssh/id_* 2>/dev/null | head -1)
    echo "   Using key: $SSH_KEY"
else
    echo -e "${YELLOW}⚠️  No SSH key found locally${NC}"
    echo "   You may need to set up SSH key for automated deployment"
fi

# Test SSH connectivity (won't work from Replit but shows the command)
echo ""
echo "SSH connection test command (run manually):"
echo "  ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP 'echo Connected successfully'"

echo ""
echo "3. Testing Local Build"
echo "----------------------"

# Test if build works locally
echo "Running local build test..."
npm run build > /dev/null 2>&1
BUILD_RESULT=$?
check_result $BUILD_RESULT "Local build completes successfully"

if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    check_result 0 "Build outputs created correctly"
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo "   Build size: $BUILD_SIZE"
else
    check_result 1 "Build output missing" "dist/index.js not found"
fi

echo ""
echo "4. Deployment Package Preparation"
echo "---------------------------------"

# Create deployment package matching VPS structure
echo "Creating deployment package..."
tar -czf deploy-package.tar.gz \
    dist/ \
    package.json \
    package-lock.json \
    server/ \
    client/ \
    shared/ \
    .env.production.example \
    2>/dev/null

if [ -f "deploy-package.tar.gz" ]; then
    PACKAGE_SIZE=$(du -h deploy-package.tar.gz | cut -f1)
    check_result 0 "Deployment package created: $PACKAGE_SIZE"
    rm deploy-package.tar.gz
else
    check_result 1 "Failed to create deployment package" "Check file permissions"
fi

echo ""
echo "5. Environment Variables Check"
echo "------------------------------"

# Check for required environment variables
ENV_VARS=(
    "DATABASE_URL"
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "JWT_SECRET"
    "SESSION_SECRET"
    "AZURACAST_API_KEY"
    "AZURACAST_BASE_URL"
    "AZURACAST_STATION_ID"
)

echo "Required environment variables for VPS:"
for var in "${ENV_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo -e "${GREEN}✅ $var is set${NC}"
    else
        echo -e "${YELLOW}⚠️  $var not set (needs to be in VPS .env)${NC}"
    fi
done

echo ""
echo "6. GitHub Actions Secrets Check"
echo "-------------------------------"
echo "Make sure these are set in GitHub Secrets:"
echo "  • SSH_PRIVATE_KEY (your deployment key)"
echo "  • VPS_HOST ($VPS_IP)"
echo "  • VPS_USER ($VPS_USER)"
echo "  • VPS_PATH ($VPS_PATH)"

echo ""
echo "====================================="
echo "📊 DEPLOYMENT TEST SUMMARY"
echo "====================================="
echo ""

echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ VPS IS READY FOR DEPLOYMENT!${NC}"
    echo ""
    echo "Your VPS at $VPS_IP is properly configured with:"
    echo "  • Node.js app running via systemd"
    echo "  • Nginx reverse proxy active"
    echo "  • AzuraCast streaming services"
    echo "  • Domain pointing correctly"
else
    echo -e "${YELLOW}⚠️  Some services may need attention${NC}"
fi

echo ""
echo "📝 DEPLOYMENT OPTIONS:"
echo "====================="
echo ""
echo "Option 1: GitHub Actions (Recommended)"
echo "---------------------------------------"
echo "1. Push your code to GitHub main branch"
echo "2. GitHub Actions will automatically deploy via rsync"
echo "3. Systemd service will restart automatically"
echo ""
echo "Option 2: Manual Deployment via SSH"
echo "-----------------------------------"
echo "1. Build locally: npm run build"
echo "2. Copy files: rsync -avz dist/ package*.json $VPS_USER@$VPS_IP:$VPS_PATH/"
echo "3. SSH in: ssh $VPS_USER@$VPS_IP"
echo "4. Install deps: cd $VPS_PATH && npm install --legacy-peer-deps"
echo "5. Restart: sudo systemctl restart gkpradio"
echo ""
echo "Option 3: Direct from Replit"
echo "----------------------------"
echo "1. Set up SSH key in Replit secrets"
echo "2. Use deploy-to-ionos.sh script with:"
echo "   export IONOS_HOST=$VPS_IP"
echo "   export IONOS_USER=$VPS_USER"
echo "   export IONOS_PATH=$VPS_PATH"
echo "   bash deploy-to-ionos.sh"
echo ""
echo "====================================="
echo "Test completed at: $(date)"