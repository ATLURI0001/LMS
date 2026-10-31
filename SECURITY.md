# Security policy

## Supported code

Security fixes are maintained on `main` for `python-fullstack/`, `java-fullstack/` and `mern-fullstack/`. The `legacy/` snapshot is historical reference and is not supported or deployed by the new editions. These projects are intended for learning and hackathons; no independent security audit or university-scale capacity certification is claimed.

## Report a vulnerability

Use the repository's **Security → Report a vulnerability** option when available: [private reporting](https://github.com/ATLURI0001/LMS/security/advisories/new). If GitHub reports that private reporting is unavailable, contact [the maintainer](https://github.com/ATLURI0001) privately through a contact method listed on that profile. Do not post credentials, student records, exploit details or sensitive logs in a public issue. Include the affected edition, commit, reproduction steps, impact and a minimal example using synthetic data. No response-time guarantee is offered.

## Implemented controls

- Server-side role, ownership and enrollment checks; registration always creates a student.
- PBKDF2-HMAC-SHA256 password hashes with a unique random salt and 600,000 iterations for new hashes. Existing encoded work factors remain verifiable; changing a password upgrades its hash. The parameter follows [OWASP password-storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- Random opaque sessions, with SHA-256 token hashes stored in the database. Cookies are HttpOnly, SameSite=Strict and scoped to `/api`; production requires Secure. Password and access changes revoke sessions.
- Origin and Fetch Metadata checks on mutations, strict JSON body handling, a 64 KiB body limit, authentication throttling, input validation and HTTP(S)-only resource URLs.
- Transactional checks for enrollment, capacity and grading; server-calculated quiz results; curriculum and graded-work locks.
- Quoted CSV export cells with formula-prefix escaping, including whitespace-hidden formulas. Re-saving CSVs can change spreadsheet interpretation; treat untrusted exports as data.
- Committed example settings only; local secrets, databases, dependencies and generated builds are ignored. Root CI has read-only permissions and action commit pins. Dependabot is configured for supported code.

## Deploying outside a local demonstration

The supplied Compose files are **local demonstrations**: their web port binds to `127.0.0.1`, MongoDB uses an internal unauthenticated replica set, and HTTPS termination is not included. Copying `.env.example` deliberately opts into public demo accounts. Leaving demo flags unset does not seed demo users.

For a separately prepared public deployment:

1. Set `APP_ENV=production`, `DEMO_MODE=false`, `VITE_DEMO_MODE=false`, `COOKIE_SECURE=true` and exact comma-separated HTTPS `ALLOWED_ORIGINS` (DNS hostnames with optional ports; no paths, wildcards or spaces). The backend refuses unsafe production combinations at startup. Rebuild the frontend after changing Vite settings.
2. Use a fresh database and bootstrap an administrator as documented in the chosen edition. Disabling demo mode does **not** delete existing demo users: remove/disable those accounts or reset their credentials and revoke their sessions before exposure.
3. Serve frontend and `/api` behind the same HTTPS origin. Configure request limits, trusted proxies and TLS on your reverse proxy; do not expose development servers or database ports publicly.
4. Use authenticated database access, managed secrets, restricted network access, backups and tested restoration. Replace the example Mongo replica-set configuration before public deployment. Remove one-time bootstrap passwords from the environment after use.
5. Review dependencies and protect the default branch in GitHub settings. Private vulnerability reporting, branch rules, secret scanning and dependency alerts depend on repository settings and are **not enabled merely by these files**.
6. Review rate limiting for your proxy topology. The Python/Java limits are process-local, and an unconfigured reverse proxy can make multiple users share a bucket. Multiple instances require shared rate/session infrastructure and a persistence design suited to that load.

No email password recovery, MFA, SSO, binary uploads, immutable audit trail or malware scanning is provided. Do not use live student records in a hackathon deployment. See each edition's architecture and test report for further limits and checks actually performed.
