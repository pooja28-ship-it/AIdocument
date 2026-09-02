import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.models import Document, User
from app.routes.auth import get_current_user
from app.schemas import DocumentResponse, SummaryRequest
from app.services.document_service import extract_text_from_pdf
from app.services.summary_service import generate_summary, generate_long_summary

router = APIRouter(prefix="/documents", tags=["documents"])

# backend/app/routes/documents.py -> parents: routes, app, backend
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPE = "application/pdf"


def process_document(document_id: uuid.UUID):
    db = SessionLocal()

    try:
        document = (
            db.query(Document)
            .filter(Document.id == document_id)
            .first()
        )

        if document is None:
            return

        document.status = "processing"
        db.commit()

        extracted_text, page_count = extract_text_from_pdf(
            document.storage_path
        )

        extracted_text = extracted_text.strip()

        document.extracted_text = extracted_text
        document.page_count = page_count
        document.word_count = len(extracted_text.split())
        document.character_count = len(extracted_text)
        document.status = "done"

        db.commit()

    except Exception:
        db.rollback()

        document = (
            db.query(Document)
            .filter(Document.id == document_id)
            .first()
        )

        if document:
            document.status = "failed"
            db.commit()

    finally:
        db.close()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type != ALLOWED_CONTENT_TYPE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )

    generated_filename = f"{uuid.uuid4()}.pdf"
    destination_path = UPLOAD_DIR / generated_filename

    try:
        with destination_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file.file.close()

        file_size_bytes = destination_path.stat().st_size

        document = Document(
            user_id=current_user.id,
            filename=file.filename,
            storage_path=str(destination_path),
            file_type=file.content_type,
            file_size_bytes=file_size_bytes,
            status="processing",
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        background_tasks.add_task(
            process_document,
            document.id,
        )

        return document

    except Exception:
        db.rollback()

        if destination_path.exists():
            destination_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document",
        )

@router.get("/{document_id}/text")
def get_document_text(document_id: uuid.UUID, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    document = (db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    )).first()

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return {
        "document_id": document.id,
        "filename": document.filename,
        "page_count": document.page_count,
        "text": document.extracted_text,
        }

@router.get("/", response_model=list[DocumentResponse])
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )

    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: uuid.UUID, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    document=(db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first())

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return document

@router.post("/{document_id}/summarize", response_model=DocumentResponse)
def summarize_document(document_id: uuid.UUID, payload: SummaryRequest, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    document = (db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first())

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if not document.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document text is not available",
        )

    try:
        if document.character_count and document.character_count > 12000:
            summary = generate_long_summary(
                document.extracted_text,
                payload.summary_type,
            )
        else:
            summary = generate_summary(
                document.extracted_text,
                payload.summary_type,
            )
        document.summary = summary
        db.commit()
        db.refresh(document)

        return document

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Summary generation failed"
        )