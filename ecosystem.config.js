const path = require('path');

module.exports = {
    apps: [
        {
            name: "CRM-Backend",
            cwd: path.resolve(__dirname, "leadify-backend-main"),
            script: "npm.cmd",
            interpreter: "none",
            args: "run dev",
            env: {
                NODE_ENV: "development",
                PORT: 5000
            }
        },
        {
            name: "CRM-Frontend",
            cwd: path.resolve(__dirname, "leadify-frontend-main"),
            script: "npm.cmd",
            interpreter: "none",
            args: "run dev",
            env: {
                NODE_ENV: "development",
                PORT: 3060,
                // Inject 4GB RAM Limit here to prevent OOM
                NODE_OPTIONS: "--max-old-space-size=4096"
            }
        },
        {
            name: "CRM-Proposal",
            cwd: path.resolve(__dirname, "React proposal"),
            script: "npm.cmd",
            interpreter: "none",
            args: "run dev -- --host 0.0.0.0 --port 3001",
            env: {
                PORT: 3001
            }
        },
        {
            name: "CRM-Health-Dash",
            cwd: path.resolve(__dirname, "leadify-frontend-main"),
            script: "npm.cmd",
            interpreter: "none",
            args: "run health:ui",
            env: {
                PORT: 8888
            }
        }
    ]
};
