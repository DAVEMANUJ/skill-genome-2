# SkillGenome (Career Architect)

SkillGenome is a full-stack Career Architect platform that turns a user's resume and GitHub activity into a living skill profile, computes role-based gaps, and produces an explainable learning roadmap.

## Tech Stack

### Backend
- Python + Flask
- SQLite
- NLP/AI: spaCy, KeyBERT, Sentence Transformers
- Parsing: pdfplumber, python-docx

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Framer Motion

## Local Setup

### Prerequisites
- Python 3.x
- Node.js 20+

### 1) Backend

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python start_server.py
```

Notes:
- `start_server.py` now always runs idempotent DB initialization and baseline seeding.
- Default backend URL: `http://localhost:5000`
- Health: `http://localhost:5000/health`

Optional DB path override:

```bash
# Windows PowerShell
$env:SKILLGENOME_DB_PATH = "D:\path\to\skillgenome.db"
python start_server.py
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL (Vite default): `http://localhost:5173`

### 3) Frontend API base URL (optional)

If backend is not on `http://localhost:5000`, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Environment Variables

```env
# Optional custom DB file location
SKILLGENOME_DB_PATH=D:\path\to\skillgenome.db

# Optional GitHub token for higher API limits
GITHUB_TOKEN=ghp_your_token_here
```

## Troubleshooting

### Port 5000 already in use (Windows)

```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Reset local DB

```bash
# Linux/macOS
rm skillgenome.db
# Windows PowerShell
Remove-Item .\skillgenome.db -ErrorAction SilentlyContinue

python start_server.py
```

## Security Note

- No secrets should be committed.
- Keep tokens only in environment variables.

## Deployment

For production deployment on Render + Vercel, follow [DEPLOYMENT.md](DEPLOYMENT.md).


### Python version for Render
Use **Python 3.11** for backend deployment (spaCy/blis wheels).

