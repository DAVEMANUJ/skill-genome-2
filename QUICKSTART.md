# SkillGenome Quick Start

## 1) Install dependencies

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

## 2) Start backend (canonical)

```bash
python start_server.py
```

This command now:
- creates any missing DB tables
- seeds required baseline reference data (`roles`, `ontology`, `courses`)
- starts Flask on `http://localhost:5000`

Health check:

```bash
curl http://localhost:5000/health
```

## 3) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## 4) Optional DB path override

```powershell
$env:SKILLGENOME_DB_PATH = "D:\path\to\skillgenome.db"
python start_server.py
```
