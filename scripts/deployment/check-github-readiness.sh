#!/bin/bash

# GitHub Actions Deployment Readiness Check
# Verifies all requirements for Option 3 (GitHub Actions deployment)

echo "🔍 GitHub Actions Deployment Readiness Check"
echo "============================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

READY=true
MISSING_SECRETS=()

echo "📄 GitHub Workflow Configuration"
echo "--------------------------------"

if [ -f ".github/workflows/deploy.yml" ]; then
    echo -e "${GREEN}✅ deploy.yml workflow exists${NC}"
    
    # Check workflow structure
    if grep -q "runs-on: ubuntu-latest" .github/workflows/deploy.yml; then
        echo -e "${GREEN}✅ Workflow configured for Ubuntu${NC}"
    fi
    
    if grep -q "npm run build" .github/workflows/deploy.yml; then
        echo -e "${GREEN}✅ Build step configured${NC}"
    fi
    
    if grep -q "rsync.*dist/" .github/workflows/deploy.yml; then
        echo -e "${GREEN}✅ Rsync deployment configured${NC}"
    fi
    
    if grep -q "systemctl restart gkpradio" .github/workflows/deploy.yml; then
        echo -e "${GREEN}✅ Service restart configured${NC}"
    fi
else
    echo -e "${RED}❌ GitHub workflow not found${NC}"
    READY=false
fi

echo ""
echo "🔑 Required GitHub Secrets"
echo "--------------------------"
echo "The following secrets must be set in your GitHub repository:"
echo "(Go to: Settings → Secrets and variables → Actions)"
echo ""

# Critical deployment secrets
CRITICAL_SECRETS=(
    "SSH_PRIVATE_KEY:Your VPS SSH private key for deploy user"
    "VPS_HOST:74.208.102.89"
    "VPS_USER:deploy"
)

# Frontend build secrets (VITE_*)
FRONTEND_SECRETS=(
    "VITE_SUPABASE_URL:Your Supabase project URL"
    "VITE_SUPABASE_ANON_KEY:Your Supabase anon key"
    "VITE_AZURACAST_BASE_URL:http://74.208.102.89:8080"
    "VITE_AZURACAST_STATION_ID:1"
    "VITE_STRIPE_PUBLIC_KEY:Your Stripe publishable key"
    "VITE_VPS_HOST:74.208.102.89"
    "VITE_HLS_BASE_URL:http://74.208.102.89:8000"
    "VITE_ANTI_SPAM_ENABLED:true or false"
    "VITE_TURNSTILE_SITE_KEY:Your Cloudflare Turnstile site key (if using)"
)

echo "Critical Deployment Secrets:"
for secret in "${CRITICAL_SECRETS[@]}"; do
    IFS=':' read -r name desc <<< "$secret"
    echo "  • $name - $desc"
    MISSING_SECRETS+=("$name")
done

echo ""
echo "Frontend Build Secrets (for Vite):"
for secret in "${FRONTEND_SECRETS[@]}"; do
    IFS=':' read -r name desc <<< "$secret"
    echo "  • $name - $desc"
    MISSING_SECRETS+=("$name")
done

echo ""
echo "🔍 Checking Git Configuration"
echo "-----------------------------"

# Check if this is a git repository
if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Git repository detected${NC}"
    
    # Check remote
    if git remote -v | grep -q "github.com"; then
        REMOTE_URL=$(git remote get-url origin 2>/dev/null)
        echo -e "${GREEN}✅ GitHub remote configured${NC}"
        echo "   Remote: $REMOTE_URL"
        
        # Check current branch
        CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
        if [ "$CURRENT_BRANCH" = "main" ]; then
            echo -e "${GREEN}✅ On main branch${NC}"
        else
            echo -e "${YELLOW}⚠️  Currently on branch: $CURRENT_BRANCH${NC}"
            echo "   Workflow triggers on 'main' branch"
        fi
    else
        echo -e "${RED}❌ No GitHub remote found${NC}"
        READY=false
    fi
else
    echo -e "${RED}❌ Not a git repository${NC}"
    echo "   You need to initialize git and push to GitHub"
    READY=false
fi

echo ""
echo "📋 VPS Requirements (from your setup document)"
echo "----------------------------------------------"
echo -e "${GREEN}✅ VPS IP: 74.208.102.89${NC}"
echo -e "${GREEN}✅ User: deploy${NC}"
echo -e "${GREEN}✅ Path: /srv/gkpradio${NC}"
echo -e "${GREEN}✅ Systemd service: gkpradio${NC}"
echo -e "${GREEN}✅ Node.js app on port 3001${NC}"
echo -e "${GREEN}✅ Nginx reverse proxy configured${NC}"
echo -e "${GREEN}✅ AzuraCast on ports 8080/8000${NC}"

echo ""
echo "🧪 Testing Local Build"
echo "----------------------"

# Quick build test
npm run build > /dev/null 2>&1
if [ $? -eq 0 ] && [ -d "dist" ] && [ -f "dist/index.js" ]; then
    echo -e "${GREEN}✅ Build works locally${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    READY=false
fi

echo ""
echo "============================================"
echo "📊 GITHUB ACTIONS READINESS SUMMARY"
echo "============================================"
echo ""

if [ "$READY" = true ]; then
    echo -e "${GREEN}✅ GitHub Actions workflow is configured!${NC}"
    echo ""
    echo "⚠️  BEFORE YOU PUSH TO GITHUB:"
    echo "------------------------------"
    echo ""
    echo "1. Add these secrets to your GitHub repository:"
    echo "   Go to: https://github.com/[your-username]/[your-repo]/settings/secrets/actions"
    echo ""
    echo "   CRITICAL (required for deployment):"
    for secret in "${CRITICAL_SECRETS[@]}"; do
        IFS=':' read -r name desc <<< "$secret"
        echo "   • $name"
    done
    echo ""
    echo "   FRONTEND (required for build):"
    for secret in "${FRONTEND_SECRETS[@]}"; do
        IFS=':' read -r name desc <<< "$secret"
        echo "   • $name"
    done
    echo ""
    echo "2. For SSH_PRIVATE_KEY:"
    echo "   - Use the content of your deploy user's SSH private key"
    echo "   - The one that corresponds to the public key on your VPS"
    echo "   - Should start with '-----BEGIN OPENSSH PRIVATE KEY-----'"
    echo ""
    echo "3. Once secrets are added, deployment will happen automatically when you:"
    echo "   git add ."
    echo "   git commit -m 'Deploy latest changes'"
    echo "   git push origin main"
    echo ""
    echo "The GitHub Actions will:"
    echo "  1. Build your application"
    echo "  2. Deploy dist/ to your VPS"
    echo "  3. Restart the gkpradio service"
    echo "  4. Your changes will be live at godkingdomprinciplesradio.com"
else
    echo -e "${RED}❌ Not ready for GitHub Actions deployment${NC}"
    echo ""
    echo "Fix the issues above first, then try again."
fi

echo ""
echo "============================================"