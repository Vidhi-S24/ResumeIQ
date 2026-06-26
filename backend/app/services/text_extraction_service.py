import fitz
from docx import Document


def extract_pdf_text(file_path):
    pdf = fitz.open(file_path)

    text = ""

    for page in pdf:
        text += page.get_text()

    pdf.close()

    return text


def extract_docx_text(file_path):
    doc = Document(file_path)

    text = ""

    for para in doc.paragraphs:
        text += para.text + "\n"

    return text