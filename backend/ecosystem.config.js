/**
 * PM2 Ecosystem Configuration  —  A.E.E Backend
 * ─────────────────────────────────────────────────────────────────────────────
 * Run in cluster mode:   pm2 start ecosystem.config.js --env production
 * Monitor:               pm2 monit
 * Reload (zero-downtime): pm2 reload aee-backend
 * Stop all:              pm2 stop all
 * Delete from PM2:       pm2 delete all
 *
 * Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
  apps: [
    {
      // ── Application identity ─────────────────────────────────────────────
      name:        'aee-backend',
      script:      'server.js',
      cwd:         __dirname,

      // ── Cluster mode: use all available CPU cores ────────────────────────
      // 'max' = one worker per CPU core (e.g. 8 cores → 8 workers)
      // Set to a specific number (e.g. 4) to cap usage
      instances:   'max',
      exec_mode:   'cluster',

      // ── Environment variables ────────────────────────────────────────────
      // Production secrets should be injected via the host's environment
      // or a secrets manager (AWS Secrets Manager, Vault, Doppler).
      // DO NOT hard-code secrets here.
      env: {
        NODE_ENV: 'development',
        PORT:     5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT:     5001,
      },

      // ── Logging ──────────────────────────────────────────────────────────
      out_file:       './logs/pm2-out.log',
      error_file:     './logs/pm2-error.log',
      merge_logs:     true,                    // Combine all worker logs into one file
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_type:       'json',                  // Structured JSON logs for log aggregators

      // ── Auto-restart configuration ────────────────────────────────────────
      watch:          false,                   // Never watch in production (use reload instead)
      autorestart:    true,
      restart_delay:  3000,                    // Wait 3s before restarting a crashed worker
      max_restarts:   10,                      // Give up after 10 consecutive crashes
      min_uptime:     '10s',                   // Process must be alive 10s to be considered stable

      // ── Memory guard: restart if worker exceeds 512MB ─────────────────────
      max_memory_restart: '512M',

      // ── Graceful shutdown ─────────────────────────────────────────────────
      // PM2 sends SIGINT; app should close server + drain connections
      kill_timeout:       5000,                // Force-kill after 5s if not shut down
      listen_timeout:     8000,                // Time to wait for app to go ready

      // ── Source map support (for TypeScript or minified builds) ────────────
      source_map_support: false,

      // ── Node.js flags ─────────────────────────────────────────────────────
      node_args: [
        '--max-old-space-size=512',            // Match max_memory_restart above
      ],

      // ── Cron restart (optional — restart daily at 3am to clear memory leaks)
      // Uncomment to enable:
      // cron_restart: '0 3 * * *',
    },
  ],

  // ── Deploy configuration (for pm2 deploy) ────────────────────────────────
  // Example for DigitalOcean / VPS deployment
  deploy: {
    production: {
      user:         'deploy',
      host:         process.env.DEPLOY_HOST || 'your-server-ip',
      ref:          'origin/main',
      repo:         'git@github.com:your-org/aee-backend.git',
      path:         '/var/www/aee-backend',
      'pre-deploy-local': '',
      'post-deploy':
        'npm ci --only=production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
