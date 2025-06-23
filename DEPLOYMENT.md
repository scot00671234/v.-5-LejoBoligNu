# LejeBoligNu - VPS Deployment Guide

This guide will help you deploy the LejeBoligNu application on your VPS.

## Prerequisites

- Node.js 20+ installed on your VPS
- PostgreSQL database
- PM2 (optional but recommended)
- Nginx (recommended for production)

## 1. Initial Setup

### Clone and Install Dependencies
```bash
# Upload your project files to the VPS
cd /var/www/leje-bolig-nu  # or your preferred directory

# Install dependencies
npm install

# Or for production-only dependencies:
npm ci --only=production
```

### 2. Environment Configuration

Create a `.env` file in the root directory:
```bash
cp .env.example .env
nano .env
```

Fill in your environment variables:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/leje_bolig_nu

# Server Configuration
PORT=5000
NODE_ENV=production
HOST=0.0.0.0

# JWT Secret (generate a secure random string)
JWT_SECRET=your-very-secure-jwt-secret-key-here

# Session Secret (generate a secure random string)
SESSION_SECRET=your-very-secure-session-secret-key-here

# Optional: Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### 3. Database Setup

```bash
# Push database schema
npm run db:push

# Or if you prefer migrations:
# npm run db:generate
# npm run db:migrate
```

### 4. Build Application

```bash
# Build the frontend and backend
npm run build
```

This will create:
- `dist/public/` - Built frontend files
- `dist/index.js` - Built backend server

### 4a. Quick Deployment (Alternative)

You can use the automated deployment script:
```bash
# Make the script executable and run
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This script will:
- Validate environment variables
- Install dependencies
- Build the application  
- Set up the database
- Provide next steps

### 5. Start Application

#### Option A: Direct Node.js
```bash
npm start
```

#### Option B: PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### PM2 Management Commands
```bash
# View logs
pm2 logs leje-bolig-nu

# Restart application
pm2 restart leje-bolig-nu

# Stop application
pm2 stop leje-bolig-nu

# Monitor processes
pm2 monit

# View process list
pm2 list
```

## 6. Nginx Configuration (Recommended)

### Install Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### Configure Nginx
```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/leje-bolig-nu

# Copy the content from nginx.conf.example and modify:
# - Replace 'your-domain.com' with your actual domain
# - Update SSL certificate paths
# - Adjust any other settings as needed

# Enable the site
sudo ln -s /etc/nginx/sites-available/leje-bolig-nu /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 7. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already setup by certbot)
sudo systemctl status certbot.timer
```

## 8. Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 9. Monitoring and Logs

### Application Logs
```bash
# PM2 logs
pm2 logs leje-bolig-nu

# Or direct log files
tail -f logs/combined.log
tail -f logs/error.log
```

### System Monitoring
```bash
# Check application status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

## 10. Updates and Maintenance

### Application Updates
```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Rebuild application
npm run build

# Restart with PM2
pm2 restart leje-bolig-nu
```

### Database Migrations
```bash
# Run new migrations
npm run db:push
# or
npm run db:migrate
```

## 11. Backup Strategy

### Database Backup
```bash
# Create backup script
nano backup-db.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump leje_bolig_nu > "/backups/leje_bolig_nu_$DATE.sql"

# Make executable
chmod +x backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh
```

## 12. Performance Optimization

### Database
- Enable connection pooling (already configured)
- Add database indexes as needed
- Monitor slow queries

### Application
- PM2 cluster mode (already configured)
- Redis for session store (optional upgrade)
- CDN for static assets (optional)

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U username -d leje_bolig_nu
   ```

3. **Permission Issues**
   ```bash
   # Fix ownership
   sudo chown -R www-data:www-data /var/www/leje-bolig-nu
   ```

4. **Memory Issues**
   ```bash
   # Monitor memory usage
   free -h
   pm2 monit
   ```

### Log Locations
- Application: `./logs/`
- Nginx: `/var/log/nginx/`
- PM2: `~/.pm2/logs/`
- System: `/var/log/syslog`

## Security Checklist

- [ ] Environment variables properly configured
- [ ] Database credentials secure
- [ ] JWT secrets are strong and unique
- [ ] Firewall properly configured
- [ ] SSL certificate installed
- [ ] Regular backups configured
- [ ] Application logs monitored
- [ ] System updates applied

## Support

For issues specific to the application, check:
1. Application logs: `pm2 logs leje-bolig-nu`
2. Database connectivity: Test with your PostgreSQL client
3. Environment variables: Ensure all required variables are set
4. Build process: Run `npm run build` and check for errors

The application should be accessible at your domain once everything is configured correctly.