# Complete Deployment Guide: AI Business Developer on Hostinger VPS

## Prerequisites
- Hostinger VPS account with Ubuntu 20.04+ or CentOS 7+
- Domain name (optional but recommended)
- SSH access to your VPS
- Basic knowledge of Linux commands

## Step 1: Initial VPS Setup and Security

### 1.1 Connect to Your VPS
```bash
ssh root@your-server-ip
```

### 1.2 Update System Packages
```bash
# For Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# For CentOS/RHEL
sudo yum update -y
```

### 1.3 Create a Non-Root User
```bash
# Create new user
adduser deploy
usermod -aG sudo deploy

# Switch to new user
su - deploy
```

### 1.4 Setup SSH Key Authentication (Recommended)
```bash
# On your local machine, generate SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id deploy@your-server-ip
```

### 1.5 Configure Firewall
```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # For development/testing

# Check status
sudo ufw status
```

## Step 2: Install Node.js and npm

### 2.1 Install Node.js via NodeSource Repository
```bash
# Download and install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.2 Install PM2 Process Manager
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 3: Install and Configure Database

### Option A: PostgreSQL (Recommended for Production)

#### 3.1 Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 3.2 Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE ai_business_dev;
CREATE USER deploy WITH ENCRYPTED PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE ai_business_dev TO deploy;
\q
```

### Option B: SQLite (Simpler Setup)
```bash
# SQLite is included with Node.js, no additional installation needed
# Your app will create the database file automatically
```

## Step 4: Install and Configure Nginx

### 4.1 Install Nginx
```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.2 Configure Nginx for Your App
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ai-business-dev
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Enable the Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/ai-business-dev /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 5: Deploy Your Application

### 5.1 Clone Your Repository
```bash
# Navigate to web directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/memalihaider/ai_business_developer.git

# Change ownership
sudo chown -R deploy:deploy ai_business_developer

# Navigate to project directory
cd ai_business_developer
```

### 5.2 Install Dependencies
```bash
# Install npm dependencies
npm install

# Install Prisma CLI globally (if using Prisma)
sudo npm install -g prisma
```

### 5.3 Configure Environment Variables
```bash
# Create environment file
nano .env.production
```

Add your production environment variables:
```env
# Database Configuration
DATABASE_URL="postgresql://deploy:your-strong-password@localhost:5432/ai_business_dev"
# OR for SQLite:
# DATABASE_URL="file:./dev.db"

# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-key

# API Keys (replace with your actual keys)
OPENAI_API_KEY=your-openai-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Other environment variables from your .env.example
```

### 5.4 Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database (if you have seed data)
npx prisma db seed
```

### 5.5 Build the Application
```bash
# Build the Next.js application
npm run build
```

## Step 6: Configure PM2 for Process Management

### 6.1 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

Add the following configuration:
```javascript
module.exports = {
  apps: [{
    name: 'ai-business-dev',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ai_business_developer',
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
```

### 6.2 Start Application with PM2
```bash
# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above

# Check application status
pm2 status
pm2 logs ai-business-dev
```

## Step 7: SSL Certificate Setup (Let's Encrypt)

### 7.1 Install Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2 Obtain SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Step 8: Final Configuration and Testing

### 8.1 Update Nginx Configuration (Post-SSL)
Your Nginx configuration will be automatically updated by Certbot, but verify it includes:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 8.2 Test Your Deployment
```bash
# Check if application is running
curl http://localhost:3000

# Check Nginx status
sudo systemctl status nginx

# Check PM2 status
pm2 status

# View application logs
pm2 logs ai-business-dev
```

## Step 9: Monitoring and Maintenance

### 9.1 Setup Log Rotation
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/ai-business-dev
```

Add:
```
/var/www/ai_business_developer/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0640 deploy deploy
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 9.2 Setup Automated Backups
```bash
# Create backup script
nano ~/backup.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deploy/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database (PostgreSQL)
pg_dump -U deploy ai_business_dev > $BACKUP_DIR/db_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/ai_business_developer

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*backup*" -mtime +7 -delete
```

```bash
# Make script executable
chmod +x ~/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/deploy/backup.sh
```

## Step 10: Deployment Automation (Optional)

### 10.1 Create Deployment Script
```bash
nano ~/deploy.sh
```

Add:
```bash
#!/bin/bash
cd /var/www/ai_business_developer

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build

# Restart PM2
pm2 restart ai-business-dev

echo "Deployment completed successfully!"
```

```bash
# Make script executable
chmod +x ~/deploy.sh
```

## Troubleshooting Common Issues

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs ai-business-dev

# Check if port 3000 is in use
sudo netstat -tlnp | grep :3000

# Restart application
pm2 restart ai-business-dev
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -U deploy -d ai_business_dev -h localhost

# Check database URL in environment
echo $DATABASE_URL
```

### Nginx Issues
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout | grep "Not After"
```

## Performance Optimization Tips

1. **Enable Gzip Compression in Nginx**
2. **Setup Redis for Session Storage**
3. **Configure CDN for Static Assets**
4. **Enable Database Connection Pooling**
5. **Setup Application Monitoring with PM2 Plus**

## Security Best Practices

1. **Regular Security Updates**
2. **Fail2Ban for SSH Protection**
3. **Regular Backup Testing**
4. **Environment Variable Security**
5. **Database Security Hardening**

---

## Quick Commands Reference

```bash
# Check application status
pm2 status

# View logs
pm2 logs ai-business-dev

# Restart application
pm2 restart ai-business-dev

# Deploy updates
~/deploy.sh

# Check Nginx status
sudo systemctl status nginx

# Renew SSL certificate
sudo certbot renew
```

Your AI Business Developer application should now be successfully deployed and running on your Hostinger VPS!