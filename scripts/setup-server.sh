#!/bin/bash

# =============================================================================
# AI Business Developer - Hostinger VPS Setup Script
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="18"
APP_DIR="/var/www/ai_business_developer"
DOMAIN=""  # Will be prompted
EMAIL=""   # Will be prompted

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root (use sudo)"
    exit 1
fi

log "=============================================================================="
log "AI Business Developer - Hostinger VPS Setup Script"
log "=============================================================================="
log "This script will set up your VPS for deploying the AI Business Developer app"
log "=============================================================================="

# Prompt for configuration
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN
read -p "Enter your email address for SSL certificate: " EMAIL
read -p "Enter GitHub repository URL: " REPO_URL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ] || [ -z "$REPO_URL" ]; then
    log_error "Domain, email, and repository URL are required"
    exit 1
fi

log "Configuration:"
log "Domain: $DOMAIN"
log "Email: $EMAIL"
log "Repository: $REPO_URL"
log "Node.js Version: $NODE_VERSION"
log "App Directory: $APP_DIR"

read -p "Continue with setup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Setup cancelled"
    exit 1
fi

# =============================================================================
# STEP 1: SYSTEM UPDATE AND BASIC PACKAGES
# =============================================================================

log "Step 1: Updating system and installing basic packages..."

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

log_success "System updated and basic packages installed"

# =============================================================================
# STEP 2: CREATE DEPLOY USER
# =============================================================================

log "Step 2: Creating deploy user..."

# Create deploy user if it doesn't exist
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    log_success "Deploy user created"
else
    log_warning "Deploy user already exists"
fi

# Create SSH directory for deploy user
sudo -u deploy mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chown deploy:deploy /home/deploy/.ssh

log_success "Deploy user configured"

# =============================================================================
# STEP 3: CONFIGURE FIREWALL
# =============================================================================

log "Step 3: Configuring firewall..."

# Enable UFW and configure rules
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000  # For development/testing

log_success "Firewall configured"

# =============================================================================
# STEP 4: INSTALL NODE.JS AND NPM
# =============================================================================

log "Step 4: Installing Node.js $NODE_VERSION..."

# Install Node.js via NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

# Verify installation
NODE_INSTALLED_VERSION=$(node --version)
NPM_INSTALLED_VERSION=$(npm --version)

log_success "Node.js installed: $NODE_INSTALLED_VERSION"
log_success "npm installed: $NPM_INSTALLED_VERSION"

# Install PM2 globally
npm install -g pm2

log_success "PM2 installed: $(pm2 --version)"

# =============================================================================
# STEP 5: INSTALL AND CONFIGURE POSTGRESQL
# =============================================================================

log "Step 5: Installing PostgreSQL..."

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE ai_business_dev;
CREATE USER deploy WITH ENCRYPTED PASSWORD 'deploy123';
GRANT ALL PRIVILEGES ON DATABASE ai_business_dev TO deploy;
\q
EOF

log_success "PostgreSQL installed and configured"
log_warning "Default database password is 'deploy123' - please change it in production!"

# =============================================================================
# STEP 6: INSTALL AND CONFIGURE NGINX
# =============================================================================

log "Step 6: Installing and configuring Nginx..."

# Install Nginx
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Create Nginx configuration for the app
cat > /etc/nginx/sites-available/ai-business-dev << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/ai-business-dev /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

log_success "Nginx installed and configured"

# =============================================================================
# STEP 7: INSTALL CERTBOT FOR SSL
# =============================================================================

log "Step 7: Installing Certbot for SSL certificates..."

# Install Certbot
apt install -y certbot python3-certbot-nginx

log_success "Certbot installed"

# =============================================================================
# STEP 8: CLONE APPLICATION REPOSITORY
# =============================================================================

log "Step 8: Cloning application repository..."

# Create web directory
mkdir -p /var/www
cd /var/www

# Clone repository
git clone $REPO_URL ai_business_developer

# Change ownership to deploy user
chown -R deploy:deploy ai_business_developer

log_success "Repository cloned to $APP_DIR"

# =============================================================================
# STEP 9: INSTALL APPLICATION DEPENDENCIES
# =============================================================================

log "Step 9: Installing application dependencies..."

# Switch to deploy user and install dependencies
sudo -u deploy bash << EOF
cd $APP_DIR
npm install
npm install -g prisma
EOF

log_success "Application dependencies installed"

# =============================================================================
# STEP 10: CREATE ENVIRONMENT FILE TEMPLATE
# =============================================================================

log "Step 10: Creating environment file template..."

# Create .env.production template
sudo -u deploy cat > $APP_DIR/.env.production << EOF
# Database Configuration
DATABASE_URL="postgresql://deploy:deploy123@localhost:5432/ai_business_dev"

# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Node Environment
NODE_ENV=production
PORT=3000

# Add your API keys and other configuration here
# OPENAI_API_KEY=your-openai-api-key
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF

chown deploy:deploy $APP_DIR/.env.production
chmod 600 $APP_DIR/.env.production

log_success "Environment file template created"
log_warning "Please edit $APP_DIR/.env.production and add your API keys"

# =============================================================================
# STEP 11: SETUP DATABASE
# =============================================================================

log "Step 11: Setting up database..."

# Setup database as deploy user
sudo -u deploy bash << EOF
cd $APP_DIR
npx prisma generate
npx prisma migrate deploy
EOF

log_success "Database setup completed"

# =============================================================================
# STEP 12: CREATE PM2 ECOSYSTEM FILE
# =============================================================================

log "Step 12: Creating PM2 ecosystem file..."

# Create PM2 ecosystem file
sudo -u deploy cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ai-business-dev',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

chown deploy:deploy $APP_DIR/ecosystem.config.js

# Create logs directory
sudo -u deploy mkdir -p $APP_DIR/logs

log_success "PM2 ecosystem file created"

# =============================================================================
# STEP 13: BUILD AND START APPLICATION
# =============================================================================

log "Step 13: Building and starting application..."

# Build and start application as deploy user
sudo -u deploy bash << EOF
cd $APP_DIR
npm run build
pm2 start ecosystem.config.js
pm2 save
EOF

# Setup PM2 to start on boot
sudo -u deploy pm2 startup | grep "sudo env" | bash

log_success "Application built and started"

# =============================================================================
# STEP 14: OBTAIN SSL CERTIFICATE
# =============================================================================

log "Step 14: Obtaining SSL certificate..."

# Get SSL certificate
certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

log_success "SSL certificate obtained"

# =============================================================================
# STEP 15: SETUP MONITORING AND BACKUPS
# =============================================================================

log "Step 15: Setting up monitoring and backups..."

# Make scripts executable
chmod +x $APP_DIR/scripts/*.sh

# Create backup directory
sudo -u deploy mkdir -p /home/deploy/backups

# Setup cron jobs for deploy user
sudo -u deploy crontab << EOF
# Daily backup at 2 AM
0 2 * * * $APP_DIR/scripts/deploy.sh backup

# Monitor every 5 minutes
*/5 * * * * $APP_DIR/scripts/monitor.sh >> /var/log/monitoring.log 2>&1

# SSL certificate renewal check (twice daily)
0 12 * * * /usr/bin/certbot renew --quiet
EOF

log_success "Monitoring and backups configured"

# =============================================================================
# SETUP COMPLETE
# =============================================================================

log_success "=============================================================================="
log_success "SETUP COMPLETED SUCCESSFULLY!"
log_success "=============================================================================="
log_success "Your AI Business Developer application is now deployed and running!"
log_success ""
log_success "Application URL: https://$DOMAIN"
log_success "Application Directory: $APP_DIR"
log_success "Database: PostgreSQL (ai_business_dev)"
log_success "Web Server: Nginx with SSL"
log_success "Process Manager: PM2"
log_success ""
log_success "Next Steps:"
log_success "1. Edit $APP_DIR/.env.production and add your API keys"
log_success "2. Restart the application: sudo -u deploy pm2 restart ai-business-dev"
log_success "3. Test your application at https://$DOMAIN"
log_success "4. Setup your DNS to point to this server's IP address"
log_success ""
log_success "Useful Commands:"
log_success "- Check app status: sudo -u deploy pm2 status"
log_success "- View app logs: sudo -u deploy pm2 logs ai-business-dev"
log_success "- Deploy updates: sudo -u deploy $APP_DIR/scripts/deploy.sh"
log_success "- Monitor system: $APP_DIR/scripts/monitor.sh status"
log_success ""
log_success "Security Notes:"
log_success "- Change the default database password (deploy123)"
log_success "- Add your SSH public key to /home/deploy/.ssh/authorized_keys"
log_success "- Disable root SSH login after testing"
log_success "=============================================================================="

# Show current status
log "Current System Status:"
echo "Node.js: $(node --version)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(systemctl is-active nginx)"
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "Application: $(sudo -u deploy pm2 describe ai-business-dev | grep 'status' | awk '{print $4}' || echo 'Not running')"

log_success "Setup script completed! Your server is ready for production."