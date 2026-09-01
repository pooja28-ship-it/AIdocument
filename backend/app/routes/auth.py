import uuid 

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
        token:str = Depends(oauth2_scheme),
        db: Session=Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail = "Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = decode_access_token(token)
    except ValueError:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception

    user = db.get(User, user_uuid)

    if user is None:
        raise credentials_exception

    return user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED,)
def register(payload: UserRegisterRequest, db: Session=Depends(get_db),):
    normalized_email = payload.email.strip().lower()
    existing_user=(
        db.query(User).filter(
            User.email == normalized_email
        ).first()
    )
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this rmail already exists",
        )
    user = User(
        email=normalized_email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user 

@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    invalid_credentials_exceptions = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password"
    )
    normalized_email = form_data.username.strip().lower()
    user = (
        db.query(User).filter(
            User.email==normalized_email
        ).first()
    )
    if user is None:
        raise invalid_credentials_exceptions
    if not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise invalid_credentials_exceptions
    access_token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=access_token
    )

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user