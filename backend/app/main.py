from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes import documents

app = FastAPI()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
print(f"CORS allow_origins = [{FRONTEND_URL}]")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(documents.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Document Intelligence Platform API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}

