# MU Club Portal — Deployment Guide (Render + Vercel)

## Architecture

```
Frontend (Vercel)  ──HTTPS──►  Backend (Render)  ──►  MongoDB Atlas
artifacts/club-portal          artifacts/api-server     lib/db
```

---

## 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Add a database user (username + password)
3. Whitelist `0.0.0.0/0` in Network Access (for Render)
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mu-clubs?retryWrites=true&w=majority
   ```

---

## 2. Backend — Deploy to Render

### Service Settings

| Field | Value |
|-------|-------|
| **Service Type** | Web Service |
| **Root Directory** | `artifacts/api-server` |
| **Runtime** | Node |
| **Build Command** | `npm install && node ./build.mjs` |
| **Start Command** | `node --enable-source-maps ./dist/index.mjs` |
| **Node Version** | 20 or 22 |

> **Note:** Render sets `PORT` automatically. The server reads it correctly.

### Required Environment Variables (Render Dashboard → Environment)

```
MONGODB_URI        = mongodb+srv://...  (from Atlas)
SESSION_SECRET     = <random 32+ char string>  (openssl rand -hex 32)
CORS_ORIGIN        = https://your-frontend.vercel.app
APP_URL            = https://your-frontend.vercel.app
NODE_ENV           = production
```

### Optional — Email (Forgot Password)

```
SMTP_HOST          = smtp.gmail.com
SMTP_PORT          = 587
SMTP_SECURE        = false
SMTP_USER          = your@gmail.com
SMTP_PASS          = your-gmail-app-password
SMTP_FROM          = noreply@mu.edu
```

> To generate a Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords

### Optional — Cloudinary (Image Uploads)

```
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY    = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

---

## 3. Frontend — Deploy to Vercel

### Service Settings

| Field | Value |
|-------|-------|
| **Root Directory** | `artifacts/club-portal` |
| **Framework Preset** | Vite |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist/public` |

### Required Environment Variables (Vercel Dashboard → Settings → Environment Variables)

```
VITE_API_URL = https://your-backend.onrender.com
BASE_PATH    = /
```

### SPA Routing

The `vercel.json` in `artifacts/club-portal/` already handles SPA routing — all paths redirect to `index.html`. No manual setup needed.

---

## 4. Seed Initial Data (First Deploy)

After the Render service is live, seed the database once:

```bash
# From your local machine with MONGODB_URI set:
cd artifacts/api-server
MONGODB_URI="mongodb+srv://..." SESSION_SECRET="any" PORT=3000 pnpm run seed
```

This creates the 13 official MU clubs and the default overseer account (`admin / admin123`).

---

## 5. Post-Deploy Checklist

- [ ] Backend health check: `https://your-backend.onrender.com/api/healthz` → `{ "status": "ok" }`
- [ ] Login works: `admin / admin123`
- [ ] Club list loads on the homepage
- [ ] Image uploads work (Cloudinary env vars set)
- [ ] Forgot password email received (SMTP env vars set)

---

## Environment Variables Reference

### Backend (`artifacts/api-server/.env.example`)
See `artifacts/api-server/.env.example`

### Frontend (`artifacts/club-portal/.env.example`)
See `artifacts/club-portal/.env.example`
