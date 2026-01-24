module.exports = {
    apps: [
        {
            name: "CRM-Backend",
            cwd: "./leadify-backend-main",
            script: "npm",
            args: "run dev",
            env: {
                NODE_ENV: "development",
                PORT: 5000
            }
        },
        {
            name: "CRM-Frontend",
            cwd: "./leadify-frontend-main",
            script: "npm",
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
            cwd: "./React proposal",
            script: "npm",
            args: "run dev -- --host 0.0.0.0 --port 3001",
            env: {
                PORT: 3001
            }
        },
        {
            name: "CRM-Health-Dash",
            cwd: "./leadify-frontend-main",
            script: "npm",
            args: "run health:ui",
            env: {
                PORT: 8888
            }
        }
    ]
};
