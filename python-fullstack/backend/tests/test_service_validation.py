import pytest
from service import ApiError, boolean, choice, date, integer, text, url


def test_text_validator():
    # Valid text
    assert text({"name": "Algorithms"}, "name") == "Algorithms"
    assert text({"name": "  Data Structures  "}, "name") == "Data Structures"

    # Optional text with min_len=0
    assert text({}, "desc", min_len=0) == ""
    assert text({"desc": None}, "desc", min_len=0) == ""
    assert text({"desc": ""}, "desc", min_len=0) == ""

    # Missing key with min_len >= 1
    with pytest.raises(ApiError) as exc:
        text({}, "name")
    assert exc.value.status == 422

    # Non-string type
    with pytest.raises(ApiError) as exc:
        text({"name": 123}, "name")
    assert exc.value.status == 422

    # Length violation
    with pytest.raises(ApiError) as exc:
        text({"name": "ab"}, "name", min_len=3, max_len=10)
    assert exc.value.status == 422


def test_integer_validator():
    assert integer({"count": 5}, "count", 1, 10) == 5
    assert integer({"count": 1}, "count", 1, 10) == 1
    assert integer({"count": 10}, "count", 1, 10) == 10

    # Range errors
    with pytest.raises(ApiError):
        integer({"count": 0}, "count", 1, 10)
    with pytest.raises(ApiError):
        integer({"count": 11}, "count", 1, 10)

    # Boolean should not pass as int
    with pytest.raises(ApiError):
        integer({"count": True}, "count", 0, 1)

    # String should not pass as int
    with pytest.raises(ApiError):
        integer({"count": "5"}, "count", 1, 10)


def test_boolean_validator():
    assert boolean({"active": True}, "active") is True
    assert boolean({"active": False}, "active") is False
    assert boolean({"active": "true"}, "active") is True
    assert boolean({"active": "1"}, "active") is True
    assert boolean({"active": "yes"}, "active") is True
    assert boolean({"active": "on"}, "active") is True
    assert boolean({"active": "false"}, "active") is False
    assert boolean({"active": "0"}, "active") is False
    assert boolean({}, "active", default=True) is True
    assert boolean({"active": None}, "active", default=False) is False

    with pytest.raises(ApiError):
        boolean({"active": "invalid_bool"}, "active")
    with pytest.raises(ApiError):
        boolean({"active": [1, 2]}, "active")


def test_choice_validator():
    assert choice({"role": "student"}, "role", ("admin", "student")) == "student"

    with pytest.raises(ApiError) as exc:
        choice({"role": "guest"}, "role", ("admin", "student"))
    assert exc.value.status == 422


def test_url_validator():
    assert url({"link": "https://example.com/course"}, "link") == "https://example.com/course"
    assert url({"link": "http://localhost:8080/api"}, "link") == "http://localhost:8080/api"

    # Optional url
    assert url({}, "link", required=False) == ""
    assert url({"link": None}, "link", required=False) == ""
    assert url({"link": ""}, "link", required=False) == ""

    # Required missing
    with pytest.raises(ApiError):
        url({}, "link", required=True)

    # Disallowed protocols
    with pytest.raises(ApiError):
        url({"link": "javascript:alert(1)"}, "link")
    with pytest.raises(ApiError):
        url({"link": "ftp://files.example.com"}, "link")

    # Embedded credentials
    with pytest.raises(ApiError):
        url({"link": "https://user:pass@example.com"}, "link")

    # Invalid port range (throws ValueError in urlparse)
    with pytest.raises(ApiError):
        url({"link": "https://example.com:99999999/path"}, "link")


def test_date_validator():
    assert date({"due": "2026-12-31T23:59:59Z"}, "due") == "2026-12-31T23:59:59Z"
    assert date({"due": "2026-12-31T18:59:59-05:00"}, "due") == "2026-12-31T23:59:59Z"

    # Missing timezone
    with pytest.raises(ApiError):
        date({"due": "2026-12-31T23:59:59"}, "due")

    # Invalid date format
    with pytest.raises(ApiError):
        date({"due": "invalid-date-string"}, "due")
