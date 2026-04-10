# Deployment Guide (Render + Vercel)

Recommended setup:
- Backend (Flask): Render
- Frontend (Vite/React): Vercel

## 1) Push latest code to GitHub

```bash
git add .
git commit -m "deploy: render + vercel settings"
git push origin main
```

## 2) Deploy backend on Render

1. Open Render dashboard -> **New +** -> **Web Service**.
2. Connect repo: `DAVEMANUJ/skill-genome-2`.
3. Configure service:
   - **Runtime**: Python
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt && python app/init_db.py`
   - **Start Command**: `gunicorn wsgi:app --bind 0.0.0.0:$PORT`
4. Set environment variables:
   - `FLASK_SECRET_KEY=<strong-random-secret>`
   - `JWT_SECRET_KEY=<strong-random-secret>`
   - `SKILLGENOME_DB_PATH=/tmp/skillgenome.db` (free tier)
   - `CORS_ORIGINS=https://<your-vercel-domain>` (no trailing slash)
   - Optional: `GITHUB_TOKEN`, `GITHUB_PROJECT_LIMIT`, `GITHUB_LANGUAGE_CALL_LIMIT`
5. Deploy and verify health endpoint:
   - `https://<render-service>.onrender.com/health`

### Free-tier persistence note
- `/tmp` DB is ephemeral and may reset on restart/redeploy/spin-down.

### Paid persistent option
- Attach Render disk and switch:
  - `SKILLGENOME_DB_PATH=/var/data/skillgenome.db`

## 3) Deploy frontend on Vercel

1. Open Vercel dashboard -> import same repo.
2. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Install Command**: `npm ci` (no quotes)
   - **Build Command**: `npm run build` (no quotes)
   - **Output Directory**: `dist`
3. Add env var:
   - `VITE_API_BASE_URL=https://<render-service>.onrender.com`
4. Deploy.

`frontend/vercel.json` handles SPA route rewrites for `/dashboard/*`.

## 4) Final CORS sync

After frontend domain is final:
1. Update Render `CORS_ORIGINS` to exact Vercel origin(s), comma-separated, no trailing slash.
2. Redeploy backend.

## 5) Smoke test checklist

- `GET /health` returns healthy.
- Signup/login from Vercel frontend works.
- Resume upload API works.
- GitHub import works.
