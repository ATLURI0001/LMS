import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from deployment import validate_environment
from security import hash_password, verify_password


class SecurityTests(unittest.TestCase):
    def test_production_configuration(self):
        safe = {
            "APP_ENV": "production",
            "DEMO_MODE": "false",
            "COOKIE_SECURE": "true",
            "ALLOWED_ORIGINS": "https://lms.example.edu,https://staff.example.edu:8443",
        }
        validate_environment({})
        validate_environment(safe)
        for override in (
            {"DEMO_MODE": "true"},
            {"COOKIE_SECURE": "false"},
            {"ALLOWED_ORIGINS": ""},
            {"ALLOWED_ORIGINS": "http://lms.example.edu"},
            {"ALLOWED_ORIGINS": "https://*.example.edu"},
            {"ALLOWED_ORIGINS": "https://user@lms.example.edu"},
            {"ALLOWED_ORIGINS": "https://lms.example.edu/path"},
        ):
            with self.subTest(override=override), self.assertRaisesRegex(
                RuntimeError, "Unsafe production"
            ):
                validate_environment({**safe, **override})

    def test_password_salt_and_verification(self):
        first, second = hash_password(" whitespace password "), hash_password(
            " whitespace password "
        )
        self.assertTrue(first.startswith("600000$"))
        self.assertNotEqual(first, second)
        self.assertTrue(verify_password(" whitespace password ", first))
        self.assertFalse(verify_password("whitespace password", first))
        self.assertFalse(verify_password("anything", "malformed"))

    def test_verify_password_bounds_and_malformed(self):
        self.assertFalse(verify_password("pass", None))
        self.assertFalse(verify_password(None, "600000$salt$digest"))
        self.assertFalse(verify_password("pass", 12345))
        # Iterations out of safe range
        self.assertFalse(verify_password("pass", "50000$salt$digest"))
        self.assertFalse(verify_password("pass", "10000000$salt$digest"))
        self.assertFalse(verify_password("pass", "-100$salt$digest"))
        self.assertFalse(verify_password("pass", "notanint$salt$digest"))
        self.assertFalse(verify_password("pass", "600000$$"))

    def test_hash_password_validation(self):
        with self.assertRaises(ValueError):
            hash_password("")
        with self.assertRaises(ValueError):
            hash_password(None)

    def test_token_hash_validation(self):
        from security import token_hash
        th = token_hash("session_token_123")
        self.assertIsInstance(th, str)
        self.assertEqual(len(th), 64)
        with self.assertRaises(ValueError):
            token_hash("")
        with self.assertRaises(ValueError):
            token_hash(None)
