import os 
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import(InvalidHash, VerificationError, VerifyMismatchError)
from jose import JWTError, jwt

JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM = os.environ["JWT_ALGORITHM"]
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"])

password_hasher = PasswordHasher()

def hash_password(password: str) -> str:
    return password_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_hasher.verify(hashed_password, plain_password)
        return True
    except (VerifyMismatchError, VerificationError, InvalidHash):
        return False

def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "exp": expire
    }
    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=JWT_ALGORITHM,
        )
    except JWTError:
        raise ValueError("Invalid or expired token")