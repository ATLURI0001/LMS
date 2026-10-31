import test from "node:test";
import assert from "node:assert/strict";
import { validateEnvironment } from "../src/deployment.js";
import { hashPassword, verifyPassword } from "../src/security.js";

test("production rejects demo accounts, insecure cookies and unsafe origins", () => {
  const safe = {
    APP_ENV: "production",
    DEMO_MODE: "false",
    COOKIE_SECURE: "true",
    ALLOWED_ORIGINS: "https://lms.example.edu,https://staff.example.edu:8443",
  };
  validateEnvironment({});
  validateEnvironment(safe);
  for (const override of [
    { DEMO_MODE: "true" },
    { COOKIE_SECURE: "false" },
    ...[
      "",
      "http://lms.example.edu",
      "https://*.example.edu",
      "https://user@lms.example.edu",
      "https://lms.example.edu/path",
    ].map((ALLOWED_ORIGINS) => ({ ALLOWED_ORIGINS })),
  ]) {
    assert.throws(
      () => validateEnvironment({ ...safe, ...override }),
      /Unsafe production/,
    );
  }
});
test("passwords use random salts and preserve meaningful whitespace", () => {
  const first = hashPassword(" whitespace password ");
  assert.ok(first.startsWith("600000$"));
  assert.notEqual(first, hashPassword(" whitespace password "));
  assert.ok(verifyPassword(" whitespace password ", first));
  assert.equal(verifyPassword("whitespace password", first), false);
  assert.equal(verifyPassword("anything", "malformed"), false);
});
