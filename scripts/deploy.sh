#!/bin/bash

# =============================================================================
# AI Business Developer - Production Deployment Script
# =============================================================================

set -e  # Exit on any error

# Configuration
APP_DIR="/var/www/ai_business_developer"
APP_NAME="ai-business-dev"
BACKUP_DIR="/home/deploy/backups"
LOG_FILE="/var/log/deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a $LOG_FILE
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a $LOG_FILE
}

# Check if running as deploy user
if [ "$USER" != "deploy" ]; then
    log_error "This script must be run as the 'deploy' user"
    exit 1
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    log_error "Application directory $APP_DIR does not exist"
    exit 1
fi

log "Starting deployment process..."

# =============================================================================
# STEP 1: PRE-DEPLOYMENT CHECKS
# =============================================================================

log "Step 1: Running pre-deployment checks..."

# Check if PM2 is running
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 is not installed or not in PATH"
    exit 1
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    log_warning "Nginx is not running. Starting Nginx..."
    sudo systemctl start nginx
fi

# Check if database is accessible
if [ -f "$APP_DIR/.env.production" ]; then
    source $APP_DIR/.env.production
    if [[ $DATABASE_URL == postgresql* ]]; then
        log "Checking PostgreSQL connection..."
        if ! pg_isready -q; then
            log_error "PostgreSQL is not accessible"
            exit 1
        fi
    fi
fi

log_success "Pre-deployment checks completed"

# =============================================================================
# STEP 2: CREATE BACKUP
# =============================================================================

log "Step 2: Creating backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
if [[ $DATABASE_URL == postgresql* ]]; then
    log "Backing up PostgreSQL database..."
    pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$TIMESTAMP.sql
    log_success "Database backup created: db_backup_$TIMESTAMP.sql"
else
    log "Backing up SQLite database..."
    if [ -f "$APP_DIR/prisma/dev.db" ]; then
        cp $APP_DIR/prisma/dev.db $BACKUP_DIR/db_backup_$TIMESTAMP.db
        log_success "Database backup created: db_backup_$TIMESTAMP.db"
    fi
fi

# Backup application files
log "Backing up application files..."
tar -czf $BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz -C $(dirname $APP_DIR) $(basename $APP_DIR)
log_success "Application backup created: app_backup_$TIMESTAMP.tar.gz"

# =============================================================================
# STEP 3: PULL LATEST CODE
# =============================================================================

log "Step 3: Pulling latest code from repository..."

cd $APP_DIR

# Stash any local changes
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Local changes detected. Stashing..."
    git stash
fi

# Pull latest changes
git fetch origin
git pull origin main

log_success "Latest code pulled successfully"

# =============================================================================
# STEP 4: INSTALL DEPENDENCIES
# =============================================================================

log "Step 4: Installing dependencies..."

# Install/update npm dependencies
npm ci --production

log_success "Dependencies installed successfully"

# =============================================================================
# STEP 5: DATABASE MIGRATIONS
# =============================================================================

log "Step 5: Running database migrations..."

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

log_success "Database migrations completed"

# =============================================================================
# STEP 6: BUILD APPLICATION
# =============================================================================

log "Step 6: Building application..."

# Build the Next.js application
npm run build

log_success "Application built successfully"

# =============================================================================
# STEP 7: RESTART APPLICATION
# =============================================================================

log "Step 7: Restarting application..."

# Restart PM2 application
pm2 restart $APP_NAME

# Wait for application to start
sleep 5

# Check if application is running
if pm2 describe $APP_NAME | grep -q "online"; then
    log_success "Application restarted successfully"
else
    log_error "Application failed to start. Check PM2 logs."
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

# =============================================================================
# STEP 8: HEALTH CHECK
# =============================================================================

log "Step 8: Running health checks..."

# Wait for application to be fully ready
sleep 10

# Check if application responds
if curl -f -s http://localhost:3000 > /dev/null; then
    log_success "Application health check passed"
else
    log_error "Application health check failed"
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
    log_success "Nginx is running"
else
    log_error "Nginx is not running"
    exit 1
fi

# =============================================================================
# STEP 9: CLEANUP
# =============================================================================

log "Step 9: Cleaning up..."

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "*backup*" -mtime +7 -delete

# Clear npm cache
npm cache clean --force

# Reload PM2 logs
pm2 reloadLogs

log_success "Cleanup completed"

# =============================================================================
# DEPLOYMENT SUMMARY
# =============================================================================

log_success "=============================================================================="
log_success "DEPLOYMENT COMPLETED SUCCESSFULLY!"
log_success "=============================================================================="
log_success "Timestamp: $(date)"
log_success "Application: $APP_NAME"
log_success "Directory: $APP_DIR"
log_success "Backup created: $TIMESTAMP"
log_success "=============================================================================="

# Show application status
log "Current application status:"
pm2 describe $APP_NAME

log "Recent application logs:"
pm2 logs $APP_NAME --lines 10

log_success "Deployment script completed successfully!"

# =============================================================================
# ROLLBACK FUNCTION (for manual use)
# =============================================================================

# Uncomment and modify this function if you need rollback capability
# rollback() {
#     log "Starting rollback process..."
#     
#     # Stop current application
#     pm2 stop $APP_NAME
#     
#     # Restore from backup
#     LATEST_BACKUP=$(ls -t $BACKUP_DIR/app_backup_*.tar.gz | head -1)
#     if [ -n "$LATEST_BACKUP" ]; then
#         log "Restoring from backup: $LATEST_BACKUP"
#         tar -xzf $LATEST_BACKUP -C $(dirname $APP_DIR)
#         
#         # Restore database if needed
#         LATEST_DB_BACKUP=$(ls -t $BACKUP_DIR/db_backup_*.sql | head -1)
#         if [ -n "$LATEST_DB_BACKUP" ]; then
#             psql $DATABASE_URL < $LATEST_DB_BACKUP
#         fi
#         
#         # Restart application
#         pm2 start $APP_NAME
#         
#         log_success "Rollback completed"
#     else
#         log_error "No backup found for rollback"
#     fi
# }