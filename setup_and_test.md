# Setup And Smoke Test

## 1) Install dependencies

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

## 2) Start backend

```bash
python start_server.py
```

Backend URL: `http://localhost:5000`

Health check:

```bash
curl http://localhost:5000/health
```

## 3) API smoke checks

### Create profile

```bash
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","target_sector":"Healthcare","target_role":"data scientist"}'
```

### Get pathways tree

```bash
curl "http://localhost:5000/api/pathways/tree?role=data%20scientist"
```

### Analyze resume

```bash
curl -X POST http://localhost:5000/api/resume/analyze \
  -F "file=@resume.pdf" \
  -F "target_role=data scientist"
```

## 4) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`
