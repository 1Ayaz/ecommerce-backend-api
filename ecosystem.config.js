module.exports = {
    apps: [{
        name: 'mubarak-backend',
        script: 'server.js',
        cwd: './backend',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 5000,
            MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/mubarak_db',
            CLIENT_URL: process.env.CLIENT_URL || 'http://localhost',
        },
        error_file: './logs/backend-error.log',
        out_file: './logs/backend-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true
    }]
};
