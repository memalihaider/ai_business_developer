module.exports = {
  apps: [
    {
      name: 'ai-business-dev',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/ai_business_developer',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logging
      log_file: '/var/log/pm2/ai-business-dev.log',
      out_file: '/var/log/pm2/ai-business-dev-out.log',
      error_file: '/var/log/pm2/ai-business-dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Health monitoring
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs'],
      
      // Auto restart on file changes (disable in production)
      autorestart: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      
      // Environment variables file
      env_file: '.env.production'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-vps-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/ai-business-developer.git',
      path: '/var/www/ai_business_developer',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    }
  }
};