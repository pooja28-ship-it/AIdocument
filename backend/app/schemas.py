import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None=None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    storage_path: str
    file_type: str | None
    file_size_bytes: int | None
    status: str
    page_count: int | None
    extracted_text: str | None
    summary: str | None
    word_count: int | None
    character_count: int | None
    created_at: datetime
    uploaded_at: datetime

class SummaryRequest(BaseModel):
    summary_type: Literal["brief", "detailed", "key_points"] = "brief"
    