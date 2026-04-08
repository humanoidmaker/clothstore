#!/bin/bash
set -e
echo "[deploy.sh] Starting deployment of $APP_NAME..."

# Detect backend/server directory
BACKEND_DIR=""
[ -d "$APP_DIR/server" ] && BACKEND_DIR="server"
[ -d "$APP_DIR/backend" ] && BACKEND_DIR="backend"

# Detect frontend/client directory
FRONTEND_DIRS=""
for dir in "$APP_DIR"/frontend* "$APP_DIR"/client*; do
  [ -d "$dir" ] && FRONTEND_DIRS="$FRONTEND_DIRS $(basename $dir)"
done

# ── Backend (Node.js) ──
if [ -n "$BACKEND_DIR" ]; then
  echo "[deploy.sh] Installing $BACKEND_DIR..."
  cd "$APP_DIR/$BACKEND_DIR"
  npm install -q 2>&1 | tail -3

  # Create .env
  cat > "$APP_DIR/$BACKEND_DIR/.env" << ENVEOF
MONGODB_URI=mongodb://$DB_HOST:27017/$DB_NAME
PORT=$BACKEND_PORT
JWT_ACCESS_SECRET=$(openssl rand -hex 16)
JWT_REFRESH_SECRET=$(openssl rand -hex 16)
NODE_ENV=production
CLIENT_URL=https://$DOMAIN
ALLOWED_ORIGINS=*
ENVEOF
fi

# ── Frontends ──
FPORT=$FRONTEND_PORT
for DIRNAME in $FRONTEND_DIRS; do
  dir="$APP_DIR/$DIRNAME"
  echo "[deploy.sh] Installing $DIRNAME..."
  cd "$dir"
  # Remove known problematic packages
  grep -v 'react-badge' package.json > package.json.tmp 2>/dev/null && mv package.json.tmp package.json || true
  npm install -q 2>&1 | tail -3

  cat > "$dir/vite.config.ts" << VEOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    port: $FPORT,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: { '/api': { target: 'http://localhost:$BACKEND_PORT', changeOrigin: true } },
  },
});
VEOF
  FPORT=$((FPORT + 1))
done

# ── PM2 Ecosystem ──
echo "[deploy.sh] Creating PM2 config..."
cat > "$APP_DIR/ecosystem.config.js" << PMEOF
module.exports = { apps: [
$(if [ -n "$BACKEND_DIR" ]; then
cat << BEND
  {
    name: "${PM2_PREFIX}-backend",
    cwd: "$APP_DIR/$BACKEND_DIR",
    script: "npx",
    args: "tsx src/index.ts",
    env: {
      PORT: "$BACKEND_PORT",
      MONGODB_URI: "mongodb://$DB_HOST:27017/$DB_NAME",
      NODE_ENV: "production",
      ALLOWED_ORIGINS: "*",
    },
    max_restarts: 10,
  },
BEND
fi)
$(FPORT=$FRONTEND_PORT; for DIRNAME in $FRONTEND_DIRS; do
cat << FEND
  {
    name: "${PM2_PREFIX}-${DIRNAME}",
    cwd: "$APP_DIR/$DIRNAME",
    script: "npx",
    args: "vite",
    env: { VITE_API_URL: "http://localhost:$BACKEND_PORT" },
    max_restarts: 10,
  },
FEND
FPORT=$((FPORT + 1)); done)
]};
PMEOF

# ── Seed ──
if [ -f "$APP_DIR/package.json" ]; then
  if grep -q '"db:seed"' "$APP_DIR/package.json"; then
    echo "[deploy.sh] Running seed..."
    cd "$APP_DIR" && npm run db:seed 2>&1 | tail -5 || true
  elif grep -q '"seed"' "$APP_DIR/package.json"; then
    echo "[deploy.sh] Running seed..."
    cd "$APP_DIR" && npm run seed 2>&1 | tail -5 || true
  fi
fi

# ── Start ──
echo "[deploy.sh] Starting services..."
cd "$APP_DIR"
pm2 start ecosystem.config.js 2>&1
pm2 save 2>/dev/null || true

echo "[deploy.sh] Done!"
