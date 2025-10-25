#!/bin/bash

# IONOS Server Setup Script for GKP Radio
# Run this ONCE on your IONOS server to prepare for deployments

echo "🔧 Setting up IONOS server for GKP Radio..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ if not present
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "📥 Installing Git..."
    sudo apt install -y git
fi

# Install PM2 globally
echo "📥 Installing PM2 process manager..."
sudo npm install -g pm2

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /var/www/html
sudo chown -R $USER:$USER /var/www/html
cd /var/www/html

# Clone the repository
echo "📂 Cloning GKP Radio repository..."
git clone https://github.com/yhanih/GKP-radio.git .

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Set up environment file
echo "⚙️ Setting up environment configuration..."
cp .env.production.example .env.production

# Set up log directory for PM2
mkdir -p logs

# Configure firewall (if needed)
echo "🔒 Configuring firewall..."
sudo ufw allow 3000/tcp || echo "Firewall configuration skipped"

# Set up PM2 startup
echo "🚀 Configuring PM2 startup..."
pm2 startup

echo ""
echo "✅ IONOS server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.production with your database credentials"
echo "2. Add GitHub secrets to your repository"
echo "3. Test deployment by pushing changes from Replit"
echo ""
echo "🔗 Your application will be accessible at: http://your-domain.com:3000"
echo ""