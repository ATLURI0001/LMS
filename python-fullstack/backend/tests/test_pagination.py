import pytest

from pagination import (
    CursorExpiredError,
    InvalidCursorError,
    KeysetCursorCodec,
    RBACPolicyEvaluator,
)


def test_keyset_cursor_hmac_signing_tamper_detection_and_expiry():
    now = [1_700_000_000.0]
    codec = KeysetCursorCodec(
        secret_key="super-secret-lms-signing-key-256",
        allowed_sort_fields=("created_at", "id"),
        default_ttl_seconds=60,
        clock=lambda: now[0],
    )

    token = codec.encode(sort_field="created_at", sort_value="2026-11-18T10:00:00Z", record_id=42, direction="desc")
    decoded = codec.decode(token)
    assert decoded.sort_field == "created_at"
    assert decoded.record_id == 42
    assert decoded.direction == "desc"

    # Tampering a single character in payload or signature must fail constant-time HMAC check
    payload, sig = token.split(".")
    tampered = f"{payload[:-1]}{'A' if payload[-1] != 'A' else 'B'}.{sig}"
    with pytest.raises(InvalidCursorError):
        codec.decode(tampered)

    # Disallowed SQL sort field injection rejected at encode time
    with pytest.raises(InvalidCursorError):
        codec.encode(sort_field="id; DROP TABLE users", sort_value=1, record_id=1)

    # TTL expiration enforced deterministically
    now[0] += 61.0
    with pytest.raises(CursorExpiredError):
        codec.decode(token)


def test_keyset_pagination_handles_ties_and_stable_traversal():
    codec = KeysetCursorCodec(secret_key="super-secret-lms-signing-key-256", allowed_sort_fields=("created_at", "id"))
    rows = [
        {"id": 1, "created_at": "2026-01-01"},
        {"id": 2, "created_at": "2026-01-02"},
        {"id": 3, "created_at": "2026-01-02"},  # tie on created_at broken by id
        {"id": 4, "created_at": "2026-01-03"},
        {"id": 5, "created_at": "2026-01-04"},
    ]

    p1 = codec.paginate_records(rows, sort_field="created_at", direction="asc", limit=2)
    assert [r["id"] for r in p1["items"]] == [1, 2]
    assert p1["has_more"] is True and p1["next_cursor"] is not None

    p2 = codec.paginate_records(rows, sort_field="created_at", direction="asc", limit=2, cursor=p1["next_cursor"])
    assert [r["id"] for r in p2["items"]] == [3, 4]
    assert p2["has_more"] is True

    p3 = codec.paginate_records(rows, sort_field="created_at", direction="asc", limit=2, cursor=p2["next_cursor"])
    assert [r["id"] for r in p3["items"]] == [5]
    assert p3["has_more"] is False and p3["next_cursor"] is None

    # Mismatched direction cursor rejected
    with pytest.raises(InvalidCursorError):
        codec.paginate_records(rows, sort_field="created_at", direction="desc", limit=2, cursor=p1["next_cursor"])


def test_rbac_policy_evaluator_inheritance_wildcards_ownership_and_explicit_deny():
    rbac = RBACPolicyEvaluator(
        role_permissions={
            "student": {"courses:read"},
            "ta": {"submissions:grade"},
            "instructor": {"courses:*"},
            "admin": {"*"},
        },
        role_hierarchy={
            "ta": {"student"},
            "instructor": {"ta"},
            "admin": {"instructor"},
        },
        role_denies={
            "suspended": {"courses:write", "submissions:*"},
        },
    )

    # Inheritance: instructor inherits ta -> student
    assert rbac.is_allowed(["instructor"], "courses:delete") is True
    assert rbac.is_allowed(["instructor"], "submissions:grade") is True
    assert rbac.is_allowed(["instructor"], "courses:read") is True
    assert rbac.is_allowed(["student"], "submissions:grade") is False

    # Ownership override
    assert rbac.is_allowed(["student"], "enrollment:update", actor_id=9, resource_owner_id=9, allow_owner=True) is True
    assert rbac.is_allowed(["student"], "enrollment:update", actor_id=9, resource_owner_id=10, allow_owner=True) is False

    # Explicit deny overrides allow and wildcard grants
    assert rbac.is_allowed(["instructor", "suspended"], "courses:write") is False
    assert rbac.is_allowed(["admin", "suspended"], "submissions:grade") is False
