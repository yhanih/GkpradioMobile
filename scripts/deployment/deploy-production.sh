#!/bin/bash
set -e

# GKP Radio Production Deployment Script with Health Checks
# This script performs safe deployment with rollback capability

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/srv/gkpradio"
BACKUP_DIR="/srv/gkpradio/backups"
LOG_DIR="/srv/gkpradio/logs"
APP_NAME="gkp-radio"
HEALTH_CHECK_URL="http://localhost:5000/api/health"
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=3

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_DIR/deploy.log"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_DIR/deploy.log"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_DIR/deploy.log"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_DIR/deploy.log"
}

# Check if running as correct user
if [ "$USER" != "gkpradio" ] && [ "$EUID" -ne 0 ]; then
    error "This script must be run as 'gkpradio' user or with sudo"
fi

# Function to create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/deploy_backup_$timestamp"
    
    log "Creating backup at $backup_path..."
    mkdir -p "$backup_path"
    
    # Backup application files
    cp -r "$APP_DIR" "$backup_path/" 2>/dev/null || true
    
    # Backup database
    pg_dump gkp_radio > "$backup_path/database.sql" 2>/dev/null || warning "Database backup failed"
    
    # Compress backup
    tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "deploy_backup_$timestamp"
    rm -rf "$backup_path"
    
    # Store backup path for potential rollback
    echo "$backup_path.tar.gz" > "$APP_DIR/.last_backup"
    
    # Clean old backups (keep last 10)
    ls -t "$BACKUP_DIR"/deploy_backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
    
    log "Backup completed: $backup_path.tar.gz"
}

# Function to perform health check
health_check() {
    local retries=$HEALTH_CHECK_RETRIES
    local interval=$HEALTH_CHECK_INTERVAL
    
    log "Performing health check..."
    
    while [ $retries -gt 0 ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log "✅ Health check passed!"
            return 0
        fi
        
        retries=$((retries - 1))
        if [ $retries -gt 0 ]; then
            info "Health check failed. Retrying in ${interval}s... ($retries retries left)"
            sleep $interval
        fi
    done
    
    error "❌ Health check failed after $HEALTH_CHECK_RETRIES attempts"
}

# Function to check system resources
check_resources() {
    log "Checking system resources..."
    
    # Check disk space
    local disk_usage=$(df "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $disk_usage -gt 90 ]; then
        error "Insufficient disk space: ${disk_usage}% used"
    fi
    
    # Check memory
    local mem_available=$(free -m | awk 'NR==2 {print $7}')
    if [ $mem_available -lt 500 ]; then
        warning "Low memory available: ${mem_available}MB"
    fi
    
    log "System resources check passed"
}

# Function to validate environment
validate_environment() {
    log "Validating environment..."
    
    # Check if .env file exists
    if [ ! -f "$APP_DIR/.env" ]; then
        error ".env file not found. Please configure environment variables."
    fi
    
    # Check required services
    for service in postgresql redis-server nginx; do
        if ! systemctl is-active --quiet $service; then
            warning "$service is not running. Attempting to start..."
            sudo systemctl start $service || error "Failed to start $service"
        fi
    done
    
    # Check Node.js version
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ $node_version -lt 18 ]; then
        error "Node.js version 18 or higher is required. Current version: $(node -v)"
    fi
    
    log "Environment validation passed"
}

# Function to perform deployment
deploy() {
    log "Starting deployment process..."
    
    # Navigate to application directory
    cd "$APP_DIR"
    
    # Store current git commit for rollback
    local current_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    echo "$current_commit" > "$APP_DIR/.last_commit"
    
    # Fetch latest changes
    log "Fetching latest changes from repository..."
    git fetch origin || error "Failed to fetch from repository"
    
    # Check if there are updates
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/main)
    
    if [ "$local_commit" = "$remote_commit" ]; then
        info "Already up to date. No deployment needed."
        return 0
    fi
    
    # Pull latest changes
    log "Pulling latest changes..."
    git reset --hard origin/main || error "Failed to pull latest changes"
    
    # Check if dependencies changed
    if git diff "$current_commit" HEAD --name-only | grep -q "package.*json"; then
        log "Dependencies changed, installing packages..."
        npm ci --production=false || error "Failed to install dependencies"
    else
        info "Dependencies unchanged, skipping install"
    fi
    
    # Build application
    log "Building application..."
    npm run build || error "Failed to build application"
    
    # Run database migrations
    if [ -f "drizzle.config.ts" ]; then
        log "Running database migrations..."
        npm run db:push || warning "Database migration failed or not needed"
    fi
    
    # Reload application with zero downtime
    log "Reloading application with zero downtime..."
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 reload ecosystem.config.js --update-env || error "Failed to reload application"
    else
        pm2 start ecosystem.config.js || error "Failed to start application"
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Restart dependent services
    if systemctl list-units --full -all | grep -q "mediamtx.service"; then
        log "Restarting MediaMTX service..."
        sudo systemctl restart mediamtx || warning "Failed to restart MediaMTX"
    fi
    
    # Clear caches
    if [ -d "$APP_DIR/cache" ]; then
        rm -rf "$APP_DIR/cache/*"
        log "Cache cleared"
    fi
    
    # Reload nginx configuration
    log "Reloading Nginx configuration..."
    sudo nginx -t && sudo systemctl reload nginx || warning "Failed to reload Nginx"
    
    log "Deployment steps completed"
}

# Function to rollback deployment
rollback() {
    error "Deployment failed! Starting rollback..."
    
    cd "$APP_DIR"
    
    # Get last commit
    if [ -f "$APP_DIR/.last_commit" ]; then
        local last_commit=$(cat "$APP_DIR/.last_commit")
        log "Rolling back to commit: $last_commit"
        git reset --hard "$last_commit"
    fi
    
    # Restore from backup if available
    if [ -f "$APP_DIR/.last_backup" ]; then
        local backup_file=$(cat "$APP_DIR/.last_backup")
        if [ -f "$backup_file" ]; then
            log "Restoring from backup: $backup_file"
            tar -xzf "$backup_file" -C "$BACKUP_DIR"
            # Additional restoration steps would go here
        fi
    fi
    
    # Rebuild and restart
    npm ci --production=false
    npm run build
    pm2 reload ecosystem.config.js --update-env
    
    warning "Rollback completed. Please investigate the deployment failure."
}

# Function to send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    # Log the status
    echo "[$status] $message" >> "$LOG_DIR/deployment_history.log"
    
    # You can add email/Slack/Discord notifications here
    # Example: curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"Deployment $status: $message\"}" \
    #   YOUR_WEBHOOK_URL
}

# Function to display deployment summary
display_summary() {
    log "========================================"
    log "Deployment Summary"
    log "========================================"
    pm2 status "$APP_NAME"
    
    info "Application URL: http://$(hostname -I | awk '{print $1}'):5000"
    info "Logs: pm2 logs $APP_NAME"
    info "Monitoring: pm2 monit"
    
    # Show recent errors if any
    if pm2 logs --nostream --lines 10 --err "$APP_NAME" 2>/dev/null | grep -q "ERROR"; then
        warning "Recent errors detected in application logs"
    fi
    
    log "========================================"
}

# Main deployment flow
main() {
    log "========================================"
    log "GKP Radio Production Deployment"
    log "========================================"
    
    # Pre-deployment checks
    check_resources
    validate_environment
    
    # Create backup before deployment
    create_backup
    
    # Perform deployment
    if deploy; then
        # Verify deployment with health check
        if health_check; then
            send_notification "SUCCESS" "Deployment completed successfully"
            display_summary
            log "✅ Deployment completed successfully!"
            exit 0
        else
            send_notification "FAILED" "Health check failed after deployment"
            rollback
            exit 1
        fi
    else
        send_notification "FAILED" "Deployment process failed"
        rollback
        exit 1
    fi
}

# Handle script interruption
trap 'error "Deployment interrupted!"' INT TERM

# Create necessary directories
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# Run main deployment
main