import pytest
import json
import os
from io import BytesIO
from app.main import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_root_endpoint(client):
    response = client.get('/')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'ok'

def test_analyze_no_file(client):
    response = client.post('/resume/analyze', data={'target_role': 'data scientist'})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_analyze_no_target_role(client):
    fake_file = (BytesIO(b'fake pdf content'), 'test.pdf')
    response = client.post('/resume/analyze', 
                          data={'file': fake_file})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_analyze_invalid_file_type(client):
    fake_file = (BytesIO(b'fake content'), 'test.txt')
    response = client.post('/resume/analyze',
                          data={'file': fake_file, 'target_role': 'data scientist'})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def create_test_pdf():
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.drawString(100, 750, "John Doe")
    p.drawString(100, 730, "Software Engineer")
    p.drawString(100, 710, "Skills: Python, JavaScript, React, Node.js")
    p.drawString(100, 690, "Experience: Built web applications using Python and React")
    p.drawString(100, 670, "Projects: Developed REST APIs with Flask")
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer

def test_analyze_with_pdf(client):
    try:
        pdf_content = create_test_pdf()
        response = client.post('/resume/analyze',
                              data={'file': (pdf_content, 'test.pdf'),
                                    'target_role': 'software engineer'},
                              content_type='multipart/form-data')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'skills' in data
        assert 'roadmap' in data
        assert 'extracted_skills' in data
        assert isinstance(data['skills'], list)
        assert isinstance(data['roadmap'], list)
    except ImportError:
        pytest.skip("reportlab not installed, skipping PDF test")

def test_analyze_with_manual_skills(client):
    try:
        pdf_content = create_test_pdf()
        manual_skills = json.dumps([
            {"name": "python", "confidence": 0.9},
            {"name": "react", "confidence": 0.8}
        ])
        response = client.post('/resume/analyze',
                              data={'file': (pdf_content, 'test.pdf'),
                                    'target_role': 'frontend developer',
                                    'manual_skills': manual_skills},
                              content_type='multipart/form-data')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'skills' in data
        assert len(data['skills']) > 0
    except ImportError:
        pytest.skip("reportlab not installed, skipping PDF test")

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
