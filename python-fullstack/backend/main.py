"""Run: uvicorn main:app --host 0.0.0.0 --port 8000 (one worker for this starter)."""

import os, re, secrets, sqlite3, time, threading
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from database import Store, now
from deployment import validate_environment
from security import hash_password, verify_password, token_hash
from service import Service, ApiError, need, text, password, public

ALLOWED = set(
    os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:8080,http://localhost:3000",
    ).split(",")
)
COOKIE = "ascent_session"
SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
rate = {}
rate_lock = threading.Lock()


@asynccontextmanager
async def lifespan(app):
    validate_environment(os.environ)
    db = Store()
    db.initialize()
    db.conn.close()
    yield


app = FastAPI(title="Ascent LMS Python API", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["X-Frame-Options"] = "DENY"
    return response


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PATCH", "DELETE"])
def endpoint(path: str, request: Request):
    # Body is loaded by the ASGI wrapper below; DB operations stay on one worker thread.
    return handle(path, request, request.state.json_data)


@app.middleware("http")
async def json_body(request, call_next):
    try:
        raw = bytearray()
        async for chunk in request.stream():
            need(len(raw) + len(chunk) <= 65536, "Request too large", 413)
            raw.extend(chunk)
        if raw:
            need(
                request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
                == "application/json",
                "Content-Type must be application/json",
                415,
            )
            import json

            try:
                data = json.loads(raw)
            except ValueError:
                raise ApiError(400, "Invalid JSON")
            need(isinstance(data, dict), "JSON object required", 422)
        else:
            data = {}
        request.state.json_data = data
        return await call_next(request)
    except ApiError as e:
        return JSONResponse({"error": e.message}, status_code=e.status)


def handle(path, request, data):
    db = None
    try:
        if request.method != "GET":
            origin = request.headers.get("origin")
            need(
                (not origin or origin in ALLOWED)
                and request.headers.get("sec-fetch-site") != "cross-site",
                "Untrusted origin",
                403,
            )
        if path == "health" and request.method == "GET":
            return {"status": "ok", "stack": "python"}
        db = Store()
        db.conn.execute("BEGIN IMMEDIATE" if request.method != "GET" else "BEGIN")
        svc = Service(db)
        if path in ("auth/login", "auth/register") and request.method == "POST":
            ip = request.client.host if request.client else "unknown"
            with rate_lock:
                timestamp = time.monotonic()
                for key in list(rate):
                    if timestamp - rate[key][0] > 900:
                        del rate[key]
                start, count = rate.get(ip, (timestamp, 0))
                need(count < 40, "Too many attempts. Try again in 15 minutes.", 429)
                rate[ip] = (start, count + 1)
            email = text(data, "email", 3, 254).lower()
            need(
                bool(re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email)),
                "Invalid email",
                422,
            )
            users = svc.rows("users", email=email)
            if path == "auth/register":
                need(not users, "Email already registered", 409)
                user = db.insert(
                    "users",
                    {
                        "name": text(data, "name", 2, 80),
                        "email": email,
                        "password_hash": hash_password(password(data)),
                        "role": "student",
                        "active": True,
                    },
                )
            else:
                supplied = data.get("password", "")
                need(
                    isinstance(supplied, str) and 1 <= len(supplied) <= 128,
                    "Invalid password",
                    422,
                )
                need(
                    bool(users)
                    and users[0]["active"]
                    and verify_password(supplied, users[0]["password_hash"]),
                    "Incorrect email or password",
                    401,
                )
                user = users[0]
            token = secrets.token_urlsafe(32)
            # Remove expired records during login; token values themselves are never stored.
            for session in db.all("sessions"):
                if session["expires_at"] <= now():
                    db.delete("sessions", session["id"])
            db.insert(
                "sessions",
                {
                    "id": token_hash(token),
                    "user_id": user["id"],
                    "expires_at": (datetime.now(timezone.utc) + timedelta(days=1))
                    .isoformat(timespec="seconds")
                    .replace("+00:00", "Z"),
                },
            )
            response = JSONResponse(
                {"user": public(user)},
                status_code=201 if path == "auth/register" else 200,
            )
            response.set_cookie(
                COOKIE,
                token,
                max_age=86400,
                httponly=True,
                secure=SECURE,
                samesite="strict",
                path="/api",
            )
        else:
            token = request.cookies.get(COOKIE, "")
            session = db.get("sessions", token_hash(token))
            need(
                session is not None and session["expires_at"] > now(),
                "Sign in to continue",
                401,
            )
            user = db.get("users", session["user_id"])
            need(user is not None and user["active"], "Account unavailable", 401)
            svc.user = user
            if path == "auth/logout" and request.method == "POST":
                db.delete("sessions", session["id"])
                response = JSONResponse({"message": "Signed out"})
                response.delete_cookie(COOKIE, path="/api")
            elif path == "auth/me" and request.method == "GET":
                response = {"user": public(user)}
            else:
                response = svc.dispatch(request.method, path, data)
        db.conn.commit()
        return response
    except ApiError as e:
        if db:
            db.conn.rollback()
        return JSONResponse({"error": e.message}, status_code=e.status)
    except sqlite3.IntegrityError:
        if db:
            db.conn.rollback()
        return JSONResponse(
            {"error": "This record already exists or references unavailable data"},
            status_code=409,
        )
    except Exception:
        if db:
            db.conn.rollback()
        import logging

        logging.exception("Request failed")
        return JSONResponse({"error": "Unexpected server error"}, status_code=500)
    finally:
        if db:
            db.conn.close()
