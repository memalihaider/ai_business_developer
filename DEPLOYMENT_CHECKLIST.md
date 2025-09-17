# Hostinger VPS Deployment Checklist

## Pre-Deployment Checklist
- [ ] Hostinger VPS account active
- [ ] Domain name configured (optional)
- [ ] SSH access to VPS confirmed
- [ ] Local development environment working
- [ ] All environment variables documented

## Server Setup (Steps 1-2)
- [ ] Connect to VPS via SSH
- [ ] Update system packages
- [ ] Create non-root user (deploy)
- [ ] Setup SSH key authentication
- [ ] Configure firewall (UFW)
- [ ] Install Node.js 18.x LTS
- [ ] Install PM2 globally
- [ ] Verify Node.js and npm versions

## Database Setup (Step 3)
### PostgreSQL Option
- [ ] Install PostgreSQL
- [ ] Start and enable PostgreSQL service
- [ ] Create database: `ai_business_dev`
- [ ] Create database user: `deploy`
- [ ] Grant privileges to user

### SQLite Option
- [ ] Confirm SQLite support (no installation needed)

## Web Server Setup (Step 4)
- [ ] Install Nginx
- [ ] Start and enable Nginx service
- [ ] Create Nginx site configuration
- [ ] Enable the site
- [ ] Remove default site
- [ ] Test Nginx configuration
- [ ] Reload Nginx

## Application Deployment (Step 5)
- [ ] Clone repository to `/var/www/`
- [ ] Change ownership to deploy user
- [ ] Install npm dependencies
- [ ] Install Prisma CLI (if using Prisma)
- [ ] Create `.env.production` file
- [ ] Configure all environment variables
- [ ] Generate Prisma client
- [ ] Run database migrations
- [ ] Seed database (if applicable)
- [ ] Build Next.js application

## Process Management (Step 6)
- [ ] Create PM2 ecosystem configuration
- [ ] Create logs directory
- [ ] Start application with PM2
- [ ] Save PM2 configuration
- [ ] Setup PM2 startup script
- [ ] Verify application is running
- [ ] Check PM2 logs

## SSL Certificate (Step 7)
- [ ] Install Certbot
- [ ] Obtain SSL certificate for domain
- [ ] Test automatic renewal
- [ ] Verify HTTPS is working

## Final Testing (Step 8)
- [ ] Test application locally (curl localhost:3000)
- [ ] Test application via domain
- [ ] Check Nginx status
- [ ] Check PM2 status
- [ ] Review application logs
- [ ] Test all major features

## Monitoring & Maintenance (Step 9)
- [ ] Setup log rotation
- [ ] Create backup script
- [ ] Schedule automated backups
- [ ] Test backup restoration

## Deployment Automation (Step 10)
- [ ] Create deployment script
- [ ] Test deployment script
- [ ] Document deployment process

## Post-Deployment Verification
- [ ] Application loads correctly
- [ ] Database connections working
- [ ] Authentication system functional
- [ ] API endpoints responding
- [ ] Static files serving correctly
- [ ] SSL certificate valid
- [ ] Performance acceptable
- [ ] Error logging working

## Security Checklist
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Firewall configured properly
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Regular security updates scheduled

## Troubleshooting Commands

```bash
# Check application status
pm2 status
pm2 logs ai-business-dev

# Check services
sudo systemctl status nginx
sudo systemctl status postgresql

# Check ports
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Check logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test configuration
sudo nginx -t
pm2 describe ai-business-dev

# Restart services
pm2 restart ai-business-dev
sudo systemctl restart nginx
```

## Emergency Contacts & Resources
- Hostinger Support: [Support Portal]
- Domain Registrar: [Your Domain Provider]
- SSL Certificate: Let's Encrypt
- Monitoring: PM2 Dashboard

---

**Note**: Complete each section before moving to the next. If any step fails, refer to the troubleshooting section in the main deployment guide.