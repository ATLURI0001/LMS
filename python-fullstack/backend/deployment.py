"""Fail closed when a deployment explicitly selects production mode."""

import re


def validate_environment(env):
    if env.get("APP_ENV", "development").lower() != "production":
        return
    origins = env.get("ALLOWED_ORIGINS", "").split(",")
    valid = (
        env.get("DEMO_MODE", "false").lower() == "false"
        and env.get("COOKIE_SECURE", "false").lower() == "true"
        and all(
            re.fullmatch(r"https://[A-Za-z0-9.-]+(?::[0-9]{1,5})?", origin)
            for origin in origins
        )
    )
    if not valid:
        raise RuntimeError(
            "Unsafe production configuration: disable DEMO_MODE, enable COOKIE_SECURE, and set exact HTTPS ALLOWED_ORIGINS (DNS hostnames, no paths or wildcards)"
        )
