module.exports = {
  apps: [
    {
      name: 'cpp-learning-server',
      cwd: '/home/admin/C-Learning/server',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'cpp-learning-webhook',
      cwd: '/home/admin/C-Learning',
      script: 'webhook-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        WEBHOOK_SECRET: 'your-webhook-secret-here',
        PORT: 9000
      }
    }
  ]
};
