import pdfplumber
from docx import Document
from io import BytesIO

def extract_text(content: bytes, filename: str) -> str:
    if filename.lower().endswith('.pdf'):
        return extract_pdf(content)
    elif filename.lower().endswith('.docx'):
        return extract_docx(content)
    else:
        raise ValueError("Unsupported file format")

def extract_pdf(content: bytes) -> str:
    text_parts = []
    with pdfplumber.open(BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)

def extract_docx(content: bytes) -> str:
    doc = Document(BytesIO(content))
    text_parts = []
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            text_parts.append(paragraph.text)
    return "\n".join(text_parts)
