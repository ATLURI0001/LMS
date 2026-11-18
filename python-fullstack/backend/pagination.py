"""Cryptographically signed keyset pagination codec and hierarchical RBAC policy evaluator."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Any, Callable, Iterable, Mapping


class CursorError(ValueError):
    """Base error for keyset pagination cursor failures."""


class InvalidCursorError(CursorError):
    """Raised when a cursor is malformed, tampered with, or fails allowlist checks."""


class CursorExpiredError(CursorError):
    """Raised when a signed pagination cursor exceeds its TTL."""


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(token: str) -> bytes:
    padding = "=" * ((4 - len(token) % 4) % 4)
    return base64.urlsafe_b64decode(token + padding)


@dataclass(frozen=True)
class KeysetCursor:
    sort_field: str
    sort_value: Any
    record_id: Any
    direction: str = "asc"
    expires_at: int | None = None


class KeysetCursorCodec:
    """HMAC-SHA256 signed keyset pagination cursor encoder/decoder with SQL field allowlisting."""

    def __init__(
        self,
        secret_key: str | bytes,
        *,
        allowed_sort_fields: Iterable[str] = ("created_at", "id", "title", "updated_at"),
        default_ttl_seconds: int = 3600,
        clock: Callable[[], float] | None = None,
    ) -> None:
        key_bytes = secret_key.encode("utf-8") if isinstance(secret_key, str) else bytes(secret_key)
        if len(key_bytes) < 16:
            raise ValueError("secret_key must be at least 16 bytes for HMAC-SHA256 security")
        self._secret = key_bytes
        self.allowed_sort_fields = frozenset(allowed_sort_fields)
        self.default_ttl_seconds = max(1, int(default_ttl_seconds))
        self._clock = clock if callable(clock) else time.time

    def _sign(self, payload_b64: str) -> str:
        digest = hmac.new(self._secret, payload_b64.encode("ascii"), hashlib.sha256).digest()
        return _b64url_encode(digest)

    def encode(
        self,
        *,
        sort_field: str,
        sort_value: Any,
        record_id: Any,
        direction: str = "asc",
        ttl_seconds: int | None = None,
    ) -> str:
        if sort_field not in self.allowed_sort_fields:
            raise InvalidCursorError(f"Sort field '{sort_field}' is not in allowed fields")
        norm_dir = direction.lower().strip()
        if norm_dir not in ("asc", "desc"):
            raise InvalidCursorError(f"Invalid sort direction '{direction}'")

        ttl = self.default_ttl_seconds if ttl_seconds is None else int(ttl_seconds)
        expires_at = int(self._clock()) + ttl if ttl > 0 else None

        body = {
            "f": sort_field,
            "v": sort_value,
            "id": record_id,
            "d": norm_dir,
            "exp": expires_at,
        }
        raw = json.dumps(body, separators=(",", ":"), sort_keys=True).encode("utf-8")
        payload_b64 = _b64url_encode(raw)
        sig_b64 = self._sign(payload_b64)
        return f"{payload_b64}.{sig_b64}"

    def decode(self, token: str) -> KeysetCursor:
        if not isinstance(token, str) or "." not in token or len(token) > 2048:
            raise InvalidCursorError("Malformed cursor format")

        parts = token.split(".")
        if len(parts) != 2:
            raise InvalidCursorError("Malformed cursor segments")

        payload_b64, provided_sig = parts
        expected_sig = self._sign(payload_b64)
        if not hmac.compare_digest(provided_sig, expected_sig):
            raise InvalidCursorError("Cursor signature verification failed")

        try:
            body = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        except Exception as exc:
            raise InvalidCursorError("Cursor payload decoding failed") from exc

        if not isinstance(body, dict):
            raise InvalidCursorError("Cursor payload must be a JSON object")

        sort_field = body.get("f")
        direction = body.get("d")
        expires_at = body.get("exp")

        if sort_field not in self.allowed_sort_fields:
            raise InvalidCursorError(f"Disallowed sort field '{sort_field}'")
        if direction not in ("asc", "desc"):
            raise InvalidCursorError(f"Invalid sort direction '{direction}'")
        if expires_at is not None and int(self._clock()) > int(expires_at):
            raise CursorExpiredError("Pagination cursor has expired")

        return KeysetCursor(
            sort_field=sort_field,
            sort_value=body.get("v"),
            record_id=body.get("id"),
            direction=direction,
            expires_at=expires_at,
        )

    def paginate_records(
        self,
        records: list[Mapping[str, Any]],
        *,
        sort_field: str = "id",
        direction: str = "asc",
        limit: int = 20,
        cursor: str | None = None,
    ) -> dict[str, Any]:
        """Deterministically slice a keyset page with stable (sort_field, id) tie-breaking."""
        if sort_field not in self.allowed_sort_fields:
            raise InvalidCursorError(f"Sort field '{sort_field}' is not allowed")
        norm_dir = direction.lower().strip()
        if norm_dir not in ("asc", "desc"):
            raise InvalidCursorError(f"Invalid direction '{direction}'")
        page_size = max(1, min(200, int(limit)))

        decoded: KeysetCursor | None = None
        if cursor is not None:
            decoded = self.decode(cursor)
            if decoded.sort_field != sort_field or decoded.direction != norm_dir:
                raise InvalidCursorError("Cursor sort parameters do not match active query")

        reverse = norm_dir == "desc"
        ordered = sorted(records, key=lambda r: (r[sort_field], r["id"]), reverse=reverse)

        if decoded is not None:
            marker = (decoded.sort_value, decoded.record_id)
            if reverse:
                ordered = [r for r in ordered if (r[sort_field], r["id"]) < marker]
            else:
                ordered = [r for r in ordered if (r[sort_field], r["id"]) > marker]

        page = ordered[:page_size]
        has_more = len(ordered) > page_size
        next_cursor = None
        if has_more and page:
            last = page[-1]
            next_cursor = self.encode(
                sort_field=sort_field,
                sort_value=last[sort_field],
                record_id=last["id"],
                direction=norm_dir,
            )

        return {
            "items": page,
            "has_more": has_more,
            "next_cursor": next_cursor,
        }


class RBACPolicyEvaluator:
    """Hierarchical RBAC evaluator with wildcard matching, ownership checks, and explicit deny precedence."""

    def __init__(
        self,
        role_permissions: dict[str, set[str]],
        role_hierarchy: dict[str, set[str]] | None = None,
        role_denies: dict[str, set[str]] | None = None,
    ) -> None:
        self._perms = {r: set(p) for r, p in role_permissions.items()}
        self._hierarchy = {r: set(parents) for r, parents in (role_hierarchy or {}).items()}
        self._denies = {r: set(d) for r, d in (role_denies or {}).items()}

    def _effective_roles(self, roles: Iterable[str]) -> set[str]:
        visited: set[str] = set()
        stack = list(roles)
        while stack:
            role = stack.pop()
            if role in visited:
                continue
            visited.add(role)
            stack.extend(self._hierarchy.get(role, ()))
        return visited

    @staticmethod
    def _matches(grant: str, permission: str) -> bool:
        if grant == "*" or grant == permission:
            return True
        if ":" in grant and ":" in permission:
            g_res, g_act = grant.split(":", 1)
            p_res, p_act = permission.split(":", 1)
            return (g_res == "*" or g_res == p_res) and (g_act == "*" or g_act == p_act)
        return False

    def is_allowed(
        self,
        roles: Iterable[str],
        permission: str,
        *,
        actor_id: Any = None,
        resource_owner_id: Any = None,
        allow_owner: bool = False,
    ) -> bool:
        effective = self._effective_roles(roles)

        # Explicit deny always takes precedence over any allow or ownership rule
        for role in effective:
            for denied in self._denies.get(role, ()):
                if self._matches(denied, permission):
                    return False

        if allow_owner and actor_id is not None and resource_owner_id is not None and actor_id == resource_owner_id:
            return True

        for role in effective:
            for grant in self._perms.get(role, ()):
                if self._matches(grant, permission):
                    return True
        return False
