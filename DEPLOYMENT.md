# Deployment Guide (Render + Vercel)

This project deploys best as:
- Backend (Flask): Render
- Frontend (Vite/React): Vercel

## 1) Push latest code to GitHub

From project root:

```bash
git add .
git commit -m "deploy: vercel + render production config"
git push origin main
```

## 2) Deploy backend on Render

1. Go to Render Dashboard -> **New +** -> **Web Service**.
2. Connect repo: `DAVEMANUJ/skill-genome-2`.
3. Configure:
   - **Root Directory**: project root
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app/init_db.py && gunicorn wsgi:app --bind 0.0.0.0:$PORT`
4. Add a persistent disk:
   - **Mount Path**: `/var/data`
   - **Size**: 1 GB (or more)
5. Set environment variables:
   - `SKILLGENOME_DB_PATH=/var/data/skillgenome.db`
   - `FLASK_SECRET_KEY=<strong-random-secret>`
   - `JWT_SECRET_KEY=<strong-random-secret>`
   - `CORS_ORIGINS=https://<your-vercel-domain>`
   - Optional: `GITHUB_TOKEN`, `GITHUB_PROJECT_LIMIT`, `GITHUB_LANGUAGE_CALL_LIMIT`
6. Deploy and verify backend health:
   - `https://<render-service>/health`

## 3) Deploy frontend on Vercel

1. Go to Vercel Dashboard -> **Add New...** -> **Project**.
2. Import repo: `DAVEMANUJ/skill-genome-2`.
3. Set project options:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_BASE_URL=https://<your-render-service>`
5. Deploy.

`frontend/vercel.json` is already added for SPA rewrites so `/dashboard/*` routes work after refresh.

## 4) Final CORS sync

After Vercel gives final domain:
1. Copy exact Vercel URL.
2. In Render, update `CORS_ORIGINS` to that exact URL.
3. Redeploy backend.

## 5) Smoke test checklist

- Open frontend URL and login/register.
- Refresh a deep route (for example `/dashboard/profile`) and ensure it still loads.
- Upload a resume and confirm analysis succeeds.
- Run GitHub import and verify projects/skills appear.
- Open `https://<render-service>/health` and ensure status is healthy.
