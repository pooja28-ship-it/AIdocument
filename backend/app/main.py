from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI

from app.routes.auth import router as auth_router
from app.routes import documents

app = FastAPI()

app.include_router(auth_router)
app.include_router(documents.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Document Intelligence Platform API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}

