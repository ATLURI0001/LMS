import pytest
from service import ApiError, boolean, choice, date, email, hex_color, integer, iso_date_only, number, phone_number, semver, slug, string_list, text, url, uuid


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


def test_email_validator():
    assert email({"mail": "Student@Example.Com"}, "mail") == "student@example.com"
    assert email({"mail": "admin+test@domain.co.uk"}, "mail") == "admin+test@domain.co.uk"

    # Optional email
    assert email({}, "mail", required=False) == ""
    assert email({"mail": ""}, "mail", required=False) == ""

    # Required missing
    with pytest.raises(ApiError):
        email({}, "mail", required=True)

    # Invalid formats
    with pytest.raises(ApiError):
        email({"mail": "not-an-email"}, "mail")
    with pytest.raises(ApiError):
        email({"mail": "missing-domain@"}, "mail")
    with pytest.raises(ApiError):
        email({"mail": "user..name@example.com"}, "mail")


def test_number_validator():
    assert number({"grade": 95.5}, "grade") == 95.5
    assert number({"grade": 100}, "grade", low=0, high=100) == 100.0
    assert number({"grade": 0}, "grade", low=0, high=100) == 0.0

    # Bounds
    with pytest.raises(ApiError):
        number({"grade": -0.1}, "grade", low=0)
    with pytest.raises(ApiError):
        number({"grade": 100.1}, "grade", high=100)

    # Non-numbers / booleans / NaN
    with pytest.raises(ApiError):
        number({"grade": True}, "grade")
    with pytest.raises(ApiError):
        number({"grade": float("nan")}, "grade")
    with pytest.raises(ApiError):
        number({"grade": "95.5"}, "grade")


def test_string_list_validator():
    assert string_list({"tags": ["python", "algorithms"]}, "tags") == ["python", "algorithms"]
    assert string_list({"tags": ["  spaced  "]}, "tags") == ["spaced"]
    assert string_list({}, "tags", min_items=0) == []

    # Item length / min items
    with pytest.raises(ApiError):
        string_list({"tags": []}, "tags", min_items=1)
    with pytest.raises(ApiError):
        string_list({"tags": [""]}, "tags", item_min_len=1)
    with pytest.raises(ApiError):
        string_list({"tags": [123]}, "tags")
    with pytest.raises(ApiError):
        string_list({"tags": "not-a-list"}, "tags")


def test_uuid_validator():
    valid = "123e4567-e89b-12d3-a456-426614174000"
    assert uuid({"id": valid}, "id") == valid
    assert uuid({"id": valid.upper()}, "id") == valid  # lowercase normalization

    # Optional UUID
    assert uuid({}, "id", required=False) == ""
    assert uuid({"id": ""}, "id", required=False) == ""

    # Required missing
    with pytest.raises(ApiError):
        uuid({}, "id", required=True)

    # Malformed UUIDs
    with pytest.raises(ApiError):
        uuid({"id": "not-a-uuid"}, "id")
    with pytest.raises(ApiError):
        uuid({"id": "123e4567-e89b-12d3-a456-42661417400"}, "id")  # too short


def test_slug_validator():
    assert slug({"s": "intro-to-algorithms"}, "s") == "intro-to-algorithms"
    assert slug({"s": "cs101"}, "s") == "cs101"

    # Optional slug
    assert slug({}, "s", required=False) == ""
    assert slug({"s": ""}, "s", required=False) == ""

    # Required missing
    with pytest.raises(ApiError):
        slug({}, "s", required=True)

    # Invalid characters / consecutive hyphens
    with pytest.raises(ApiError):
        slug({"s": "Intro_to_Algorithms"}, "s")
    with pytest.raises(ApiError):
        slug({"s": "-leading-hyphen"}, "s")
    with pytest.raises(ApiError):
        slug({"s": "trailing-hyphen-"}, "s")
    with pytest.raises(ApiError):
        slug({"s": "double--hyphen"}, "s")


def test_hex_color_validator():
    # Valid hex colors
    assert hex_color({"c": "#fff"}, "c") == "#fff"
    assert hex_color({"c": "#FFFFFF"}, "c") == "#ffffff"
    assert hex_color({"c": "#336699"}, "c") == "#336699"
    assert hex_color({"c": "#aabbcc88"}, "c") == "#aabbcc88"

    # Optional color
    assert hex_color({}, "c", required=False) == ""
    assert hex_color({"c": ""}, "c", required=False) == ""

    # Required missing
    with pytest.raises(ApiError):
        hex_color({}, "c", required=True)

    # Invalid formats
    with pytest.raises(ApiError):
        hex_color({"c": "ffffff"}, "c")  # missing hash
    with pytest.raises(ApiError):
        hex_color({"c": "#ggg"}, "c")  # non-hex chars
    with pytest.raises(ApiError):
        hex_color({"c": "#12345"}, "c")  # 5 digits invalid length


def test_iso_date_only_validator():
    # Valid dates
    assert iso_date_only({"d": "2026-11-16"}, "d") == "2026-11-16"
    assert iso_date_only({"d": "2000-01-01"}, "d") == "2000-01-01"

    # Optional date
    assert iso_date_only({}, "d", required=False) == ""
    assert iso_date_only({"d": ""}, "d", required=False) == ""

    # Required missing
    with pytest.raises(ApiError):
        iso_date_only({}, "d", required=True)

    # Invalid syntax or calendar dates
    with pytest.raises(ApiError):
        iso_date_only({"d": "2026/11/16"}, "d")
    with pytest.raises(ApiError):
        iso_date_only({"d": "2026-02-31"}, "d")  # invalid day
    with pytest.raises(ApiError):
        iso_date_only({"d": "2026-13-01"}, "d")  # invalid month


def test_semver_validator():
    # Valid semantic versions
    assert semver({"v": "1.0.0"}, "v") == "1.0.0"
    assert semver({"v": "0.1.2-alpha.1"}, "v") == "0.1.2-alpha.1"
    assert semver({"v": "2.3.4+build.2026"}, "v") == "2.3.4+build.2026"

    # Optional semver
    assert semver({}, "v", required=False) == ""
    assert semver({"v": ""}, "v", required=False) == ""

    # Required missing
    with pytest.raises(ApiError):
        semver({}, "v", required=True)

    # Invalid formats
    with pytest.raises(ApiError):
        semver({"v": "1.0"}, "v")
    with pytest.raises(ApiError):
        semver({"v": "01.0.0"}, "v")
    with pytest.raises(ApiError):
        semver({"v": "v1.0.0"}, "v")


def test_phone_number_validator():
    # Valid E.164 phone numbers
    assert phone_number({"p": "+14155552671"}, "p") == "+14155552671"
    assert phone_number({"p": "+442071838750"}, "p") == "+442071838750"

    # Optional phone number
    assert phone_number({}, "p", required=False) == ""
    assert phone_number({"p": ""}, "p", required=False) == ""

    # Required missing
    with pytest.raises(ApiError):
        phone_number({}, "p", required=True)

    # Invalid formats
    with pytest.raises(ApiError):
        phone_number({"p": "4155552671"}, "p")  # missing leading plus
    with pytest.raises(ApiError):
        phone_number({"p": "+012345678"}, "p")  # country code cannot start with 0
    with pytest.raises(ApiError):
        phone_number({"p": "+1-415-555-2671"}, "p")  # dashes not permitted in E.164
    with pytest.raises(ApiError):
        phone_number({"p": "+14155552671890123456"}, "p")  # exceeds 15 digits


