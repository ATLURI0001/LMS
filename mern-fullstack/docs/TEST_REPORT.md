# Verification report

Generated 31 October 2026. This report describes checks actually completed; it is not a security certification or performance benchmark.

| Check | Result |
|---|---|
| Native API end-to-end acceptance | **PASS — 115 checks** |
| Production configuration and password-hash unit tests | PASS — 2 tests |
| CSV escaping unit tests | PASS — 2 tests |
| Unsupported media and oversized JSON requests | PASS — HTTP 415 / 413 |
| Updated client production bundle | PASS — all three editions rebuilt after security fixes |
| Persistent database behavior during API tests | PASS — actual MongoDB replica set |
| Duplicate-enrollment concurrent requests | PASS — one success, one conflict |
| Two requests racing for the last team seat | PASS — capacity preserved |
| Password whitespace round-trip and session revocation | PASS |
| Standalone frontend `npm ci` + production bundle | PASS — clean install and build in this edition |
| npm advisory audit (including development dependencies) | PASS — zero reported advisories for the shared client lock and MERN backend lock on 31 October 2026 |
| Docker Compose and GitHub Actions YAML parsing | PASS |
| Docker image build / Compose runtime | **Not executed** — Docker unavailable in the build environment |
| Browser visual, mobile and print verification | **Not completed** — the managed preview could not run MongoDB's native runtime |
| Windows/macOS native startup | Instructions provided; not executed on those operating systems |

Backend validation environment: Node.js 24.22.1; Express 5.3.0; Mongoose 9.11.4; real MongoDB 8.0.17 replica set.

Frontend: React 19.3.1, Vite 8.3.5, Node.js 24.22.1. Every edition carries the same verified client source and its own dependency lock. Dependency licenses remain with their authors.

## Covered behavior

Authentication, student-only registration, admin roles, instructor ownership, private course visibility, curriculum editing/locking, enrollment, idempotent completion, quiz answer privacy and score integrity, assignment submission/locking/grading, certificate eligibility/idempotency, discussion permissions, announcements, challenge deadlines, team membership/capacity/captain rules, roster locking, project judging, best-score leaderboard aggregation, profile updates, password changes, disabled users, logout/session invalidation, origin-based CSRF denial, invalid URL schemes and malformed field types.

Tests exercise real HTTP endpoints and real database engines. Test databases are temporary. Source and fresh fixture databases are used; no mock persistence is substituted for API acceptance. The MERN test runner uses mongodb-memory-server to launch a real mongod binary; the name does not imply a JavaScript database mock.

## Reproduce

Follow the README test commands. The checked-in `acceptance-results.json` contains the last successful run summary. To add a module, add a behavior assertion to `tests/acceptance.py` and rerun the native runner for this stack. An existing successful result does not certify later changes.

## Manual browser checklist before presenting

1. Run the app using Compose or the native development instructions.
2. Open student, instructor and admin roles in separate browser profiles.
3. Check desktop and phone-width layouts, keyboard navigation, form errors and modal closing.
4. Complete an enrollment → lesson → quiz → assignment → grading → certificate flow.
5. Print a certificate to PDF and check page fit.
6. Create/join a team, submit a repository and judge it; verify rankings.
7. Export a CSV and inspect it in your spreadsheet application.
8. Restart the application and confirm persisted data remains.

Before public hosting, separately review HTTPS, origins, cookies, database credentials, demo accounts, backups and rate-limit/proxy behavior. Load capacity has not been benchmarked.
