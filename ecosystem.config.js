module.exports = {
  apps: [
    {
      name: "clothstore-backend",
      cwd: "./server",
      script: "npx",
      args: "tsx src/index.ts",
      env: {
        PORT: 5000,
        MONGODB_URI: "mongodb://localhost:27017/clothstore",
        JWT_ACCESS_SECRET: "change-in-production-min-32-chars",
        JWT_REFRESH_SECRET: "change-in-production-min-32-chars",
        NODE_ENV: "production",
      },
      max_restarts: 10,
    },
    {
      name: "clothstore-frontend",
      cwd: "./client",
      script: "npx",
      args: "vite --host 0.0.0.0 --port 5173",
      env: { PORT: 5173 },
      max_restarts: 10,
    },
  ],
};
