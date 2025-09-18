# AI Business Developer - VPS Deployment Guide

## Overview
This guide covers deploying the AI Business Developer application to a VPS using multiple deployment methods.

## Prerequisites

### VPS Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ storage space
- Root or sudo access
- Domain name (optional but recommended)

### Required Software
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Nginx
- PM2 (for process management)
- Git

## Deployment Methods

### Method 1: Traditional VPS Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2
```

#### 2. Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE ai_business_dev;
CREATE USER deploy WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_business_dev TO deploy;
\q
```

#### 3. Application Deployment
```bash
# Create deploy user
sudo adduser deploy
sudo usermod -aG sudo deploy

# Switch to deploy user
sudo su - deploy

# Clone repository
git clone https://github.com/your-username/ai-business-developer.git
cd ai-business-developer

# Install dependencies
npm ci --production

# Setup environment
cp .env.production .env.local
# Edit .env.local with your production values

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 4. Nginx Configuration
```bash
# Copy nginx config
sudo cp nginx/nginx.conf /etc/nginx/sites-available/ai-business-dev
sudo ln -s /etc/nginx/sites-available/ai-business-dev /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Method 2: Docker Deployment

#### 1. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Deploy with Docker Compose
```bash
# Clone repository
git clone https://github.com/your-username/ai-business-developer.git
cd ai-business-developer

# Setup environment
cp .env.production .env.production
# Edit .env.production with your values

# Deploy
docker-compose up -d

# Check status
docker-compose ps
```

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://deploy:password@localhost:5432/ai_business_dev"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# AI APIs
OPENROUTER_API_KEY="your-openrouter-key"

# App Settings
NEXT_PUBLIC_APP_URL="https://your-domain.com"
COMPANY_NAME="Your Company"
```

## SSL Certificate Setup

### Using Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs ai-business-dev

# Restart application
pm2 restart ai-business-dev

# Monitor resources
pm2 monit
```

### Database Backup
```bash
# Create backup
pg_dump ai_business_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql ai_business_dev < backup_file.sql
```

### Log Management
```bash
# Application logs
tail -f /var/log/pm2/ai-business-dev.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Automated Deployment

### Using the Deploy Script
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### CI/CD with GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/ai_business_developer
            ./scripts/deploy.sh
```

## Security Considerations

1. **Firewall Setup**
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **SSH Key Authentication**
   - Disable password authentication
   - Use SSH keys only
   - Change default SSH port

3. **Database Security**
   - Use strong passwords
   - Restrict database access
   - Regular backups

4. **Application Security**
   - Keep dependencies updated
   - Use HTTPS only
   - Implement rate limiting
   - Regular security audits

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Check PM2 logs: `pm2 logs ai-business-dev`
   - Verify environment variables
   - Check database connection

2. **Database connection errors**
   - Verify PostgreSQL is running
   - Check connection string
   - Ensure database exists

3. **Nginx 502 errors**
   - Check if application is running
   - Verify upstream configuration
   - Check Nginx error logs

4. **SSL certificate issues**
   - Verify domain DNS settings
   - Check certificate expiration
   - Renew certificates if needed

## Performance Optimization

1. **Database Optimization**
   - Add database indexes
   - Optimize queries
   - Connection pooling

2. **Caching**
   - Enable Redis caching
   - Configure Nginx caching
   - Use CDN for static assets

3. **Application Optimization**
   - Enable gzip compression
   - Optimize images
   - Code splitting

## Support

For deployment issues:
1. Check logs first
2. Review this documentation
3. Check GitHub issues
4. Contact support team

---

**Note**: Replace placeholder values (your-domain.com, passwords, etc.) with your actual production values before deployment.