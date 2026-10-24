# Ocean Literacy Platform — Deployment Guide & Operator Runbook

```
===================================================================================
  OCEAN LITERACY PLATFORM — PRODUCTION DEPLOYMENT & OPERATIONS MANUAL (PHASE 2)
===================================================================================
```

## 1. System Requirements & Prerequisites

| Component | Minimum Specification | Recommended Production Specification |
| :--- | :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS / Debian 12 / macOS | Ubuntu 24.04 LTS Server |
| **Node.js Engine** | Node.js v20.x LTS | Node.js v20.x or v22.x LTS |
| **PostgreSQL Database**| PostgreSQL 15 | PostgreSQL 16 Alpine with SSL enabled |
| **Memory (RAM)** | 2 GB | 4 GB+ (for database buffer pool and API workers) |
| **Disk Storage** | 10 GB SSD | 50 GB+ NVMe SSD (Persistent volume) |
| **Network** | Port 3000 (HTTP) or 443 (HTTPS) | Reverse proxy (NGINX / Caddy / Cloudflare) |

---

## 2. Deployment Method A: Containerized Deployment (Docker Compose)

The fastest and most isolated method to run the production stack.

### Step 1: Clone Repository & Create Environment Configuration
```bash
git clone https://github.com/sahilshingate01/Ocean-Literacy.git
cd Ocean-Literacy
cp server/.env.example server/.env
```
Edit `server/.env` with production secrets:
```ini
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://ocean_admin:STRONG_SECURE_PASSWORD@postgres:5432/ocean_literacy_prod?schema=public
JWT_SECRET=GENERATE_64_BYTE_RANDOM_SECRET_HEX_HERE
JWT_REFRESH_SECRET=GENERATE_ANOTHER_64_BYTE_RANDOM_SECRET_HEX_HERE
CORS_ORIGIN=https://oceanliteracy.incois.gov.in,app://-
LEADERBOARD_TIMEZONE=Asia/Kolkata
```

### Step 2: Build & Start Container Services
```bash
docker compose up -d --build
```
This automatically:
1. Spins up PostgreSQL 16 on port 5432 with a persistent Docker volume (`postgres_data`).
2. Waits for database healthchecks to report `READY`.
3. Executes `prisma migrate deploy` to ensure the latest schema is applied.
4. Executes `prisma/seed.js` to seed the 5 roles, 15 scenarios, and achievements.
5. Launches the Node.js API server on port 3000 running as unprivileged `node` user.

### Step 3: Bootstrap First Administrator Account
```bash
docker compose exec server node src/scripts/bootstrap-admin.js admin@incois.gov.in "StrongAdminPass2026!" "Director INCOIS"
```

---

## 3. Deployment Method B: Standalone Node.js on Linux Host

### Step 1: Install Dependencies & Build Backend
```bash
cd server
npm ci --production=false
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js
npm prune --production
```

### Step 2: Bootstrap Admin Account
```bash
npm run bootstrap:admin -- admin@oceanliteracy.org "InitialAdminPass123!" "Chief Warden"
```

### Step 3: Configure Systemd Service (`/etc/systemd/system/ocean-literacy.service`)
```ini
[Unit]
Description=Ocean Literacy Full-Stack Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ocean-literacy/server
EnvironmentFile=/var/www/ocean-literacy/server/.env
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```
Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ocean-literacy
```

### Step 4: Configure NGINX Reverse Proxy with SSL (Let's Encrypt)
```nginx
server {
    server_name oceanliteracy.incois.gov.in;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/ocean-literacy/src/renderer;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4. Operator Runbook

### 4.1 Routine Database Backups
Create an automated daily cron job (`/etc/cron.daily/ocean-backup.sh`):
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/ocean_literacy"
mkdir -p "$BACKUP_DIR"

pg_dump -U ocean_admin -d ocean_literacy_prod -Fc > "$BACKUP_DIR/ocean_backup_$TIMESTAMP.dump"
# Retain last 30 daily backups
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +30 -delete
```

### 4.2 Database Restoration Procedure
In the event of database failure or migration recovery:
```bash
# 1. Stop backend service
sudo systemctl stop ocean-literacy

# 2. Restore PostgreSQL database dump
pg_restore -U ocean_admin -d ocean_literacy_prod --clean --if-exists /var/backups/ocean_literacy/ocean_backup_YYYYMMDD.dump

# 3. Verify database health
curl -f http://localhost:3000/api/v1/health/readiness

# 4. Restart backend service
sudo systemctl start ocean-literacy
```

### 4.3 Health & Diagnostic Monitoring
The platform provides native health probes:
- **Liveness**: `curl -f http://localhost:3000/api/v1/health/liveness`
  - Returns `{"status":"UP"}`. If it fails, restart the process container.
- **Readiness**: `curl -f http://localhost:3000/api/v1/health/readiness`
  - Returns `{"status":"READY","database":"CONNECTED"}`.
- **Sanitized Diagnostic**: `curl -s http://localhost:3000/api/v1/health/diagnostic`
  - Returns uptime, heap usage, and current version without exposing secrets.

### 4.4 Credential & Secret Rotation Procedure
1. Generate new 64-byte random hex keys:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Update `JWT_SECRET` and `JWT_REFRESH_SECRET` in `.env`.
3. Restart application service (`docker compose restart server` or `systemctl restart ocean-literacy`).
4. All existing refresh tokens will safely trigger renewal or re-authentication without data loss.

### 4.5 Scenario Publishing Workflow (No Redeploy Required)
Non-technical administrators and educators can publish missions without touching code:
1. Log in to the application with an `ADMIN` or `CONTENT_EDITOR` account.
2. Click **Admin Console** in the top navigation bar.
3. In the **Mission CMS & Versioning** tab, select **Draft New Mission**.
4. Fill in Title, Region, Topic, Objective, Situation Briefing, and at least 2 options with educational feedback and scientific takeaways.
5. Click **Publish Mission**. The mission immediately becomes playable to all online learners globally.
