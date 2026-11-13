"""Password hashing and opaque, revocable sessions. No tokens in localStorage."""

import hashlib, hmac, secrets

ITERATIONS = 600_000
MIN_ITERATIONS = 100_000
MAX_ITERATIONS = 2_000_000


def hash_password(password):
    if not isinstance(password, str) or not password:
        raise ValueError("password must be a non-empty string")
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), ITERATIONS
    ).hex()
    return f"{ITERATIONS}${salt}${digest}"


def verify_password(password, encoded):
    if not isinstance(password, str) or not isinstance(encoded, str):
        return False
    try:
        parts = encoded.split("$")
        if len(parts) != 3:
            return False
        iter_str, salt, expected = parts
        iterations = int(iter_str)
        if iterations < MIN_ITERATIONS or iterations > MAX_ITERATIONS:
            return False
        if not salt or not expected:
            return False
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations
        ).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def token_hash(token):
    if not isinstance(token, str) or not token:
        raise ValueError("token must be a non-empty string")
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
