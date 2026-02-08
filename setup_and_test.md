# Testing Instructions

## 1. Install Dependencies

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

## 2. Start the Server

```bash
uvicorn app.main:app --reload
```

Server will run at: `http://localhost:8000`

## 3. Test Methods

### Method 1: Using the Test Script

```bash
python test_api.py <resume_file.pdf> "data scientist"
```

Example:
```bash
python test_api.py resume.pdf "data scientist"
```

### Method 2: Using curl

```bash
curl -X POST "http://localhost:8000/resume/analyze" \
  -F "file=@resume.pdf" \
  -F "target_role=data scientist"
```

### Method 3: Using Python requests

```python
import requests

url = "http://localhost:8000/resume/analyze"
with open("resume.pdf", "rb") as f:
    files = {"file": ("resume.pdf", f, "application/pdf")}
    data = {"target_role": "data scientist"}
    response = requests.post(url, files=files, data=data)
    print(response.json())
```

### Method 4: Using Flask Docs

1. Start the server
2. Open browser: `http://localhost:8000/docs`
3. Click on `/resume/analyze` endpoint
4. Click "Try it out"
5. Upload a file and enter target_role
6. Click "Execute"

## 4. Available Target Roles

- "data scientist"
- "software engineer"
- "ml engineer"
- "backend developer"
- "frontend developer"

## 5. Test Root Endpoint

```bash
curl http://localhost:8000/
```

Or visit: `http://localhost:8000/` in browser
