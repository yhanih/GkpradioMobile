module.exports = {
  apps: [
    {
      name: 'gkp-radio',
      script: 'dist/index.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // Environment variables - PM2 will load from .env file automatically
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // These will be loaded from .env file by PM2
        AZURACAST_BASE_URL: 'http://74.208.102.89:8080',
        AZURACAST_STATION_ID: '1'
      },
      
      // Development environment
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
        watch: true,
        ignore_watch: ['node_modules', 'logs', '.git', 'dist', 'hls', 'media']
      },
      
      // Staging environment
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5001,
        instances: 1
      },
      
      // Logging configuration
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced PM2 features
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // Auto-restart cron pattern (daily at 3 AM)
      cron_restart: '0 3 * * *'
    }
  ],
  
};
