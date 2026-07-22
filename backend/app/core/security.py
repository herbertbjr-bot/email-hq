"""Credential encryption and token helpers.

Mail account passwords/app-passwords are never stored in plaintext. They are
encrypted at rest with Fernet (symmetric AES-128-CBC + HMAC) using a key that
must be supplied via the CREDENTIAL_ENCRYPTION_KEY environment variable and
never committed to source control.
"""

from datetime import datetime, timedelta, timezone
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken
from jose import JWTError, jwt

from app.config import get_settings


class CredentialCipherError(Exception):
    pass


@lru_cache
def _fernet() -> Fernet:
    settings = get_settings()
    key = settings.credential_encryption_key
    if not key or key == "changeme-generate-a-real-fernet-key":
        raise CredentialCipherError(
            "CREDENTIAL_ENCRYPTION_KEY is not configured. Generate one with "
            "`python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"` "
            "and set it in your environment before storing account credentials."
        )
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except ValueError as exc:
        raise CredentialCipherError("CREDENTIAL_ENCRYPTION_KEY is not a valid Fernet key.") from exc


def encrypt_secret(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_secret(ciphertext: str) -> str:
    try:
        return _fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise CredentialCipherError("Stored credential could not be decrypted.") from exc


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str | None:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except JWTError:
        return None
