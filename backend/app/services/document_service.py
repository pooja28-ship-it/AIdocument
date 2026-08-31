import fitz

def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    document = fitz.open(file_path)

    pages_text = []

    for page in document:
        text = page.get_text()
        pages_text.append(text)

    page_count = len(document)
    document.close()
    extracted_text = "/n/n".join(pages_text).strip()

    return extracted_text, page_count
