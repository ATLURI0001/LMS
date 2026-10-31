# Architecture and data model

## Layers

1. React renders the role-specific workspace and submits JSON. It does not own authorization or scoring.
2. Vite (development) or Nginx (Docker) keeps browser API traffic on the same origin.
3. Native backend request handling checks session, active account, request origin and field types.
4. The domain service applies ownership, deadlines, grading, enrollment and certificate rules.
5. The repository persists normalized entities and database uniqueness constraints.

Python uses FastAPI, stdlib SQLite, parameterized SQL and per-request transactions. Java uses Spring Boot, Spring JDBC, parameterized SQL, H2 file storage and Spring transaction management. MERN uses Express, Mongoose schemas/unique indexes and MongoDB multi-document transactions on a replica set. The Java edition deliberately uses JDBC rather than JPA so learners can see SQL and transaction boundaries directly.

## Relationships

| Entity | Relationship / purpose |
|---|---|
| users | Role, active status, PBKDF2 password hash |
| sessions | Hashed opaque token → user; one-day expiry |
| courses | Instructor owner; draft/published/archived status |
| lessons / questions / assignments | Belong to one course |
| enrollments | User ↔ course, unique pair |
| completions | User ↔ lesson, unique pair |
| attempts | User + course; answers and server-computed score |
| submissions | User ↔ assignment, unique pair; -1 means awaiting grade |
| discussions | User + enrolled course |
| announcements | Author + course, or campus-wide |
| challenges | Owner, deadline, team-size limit |
| teams | Challenge + captain |
| memberships | User ↔ challenge unique; links team |
| projects | One per team; repository/demo URLs and judge score |
| certificates | User ↔ course unique; immutable name/title snapshot at issuance |

The checked-in `schema.json` describes native relational columns or Mongoose field types. `constraints.json` defines business uniqueness. It is not a JSON-file database: records are stored in individual SQL tables or MongoDB collections. Relational editions also enforce foreign keys; MongoDB references are checked by the service inside transactions.

## Consistency choices

- Python starts write requests with `BEGIN IMMEDIATE` and uses a read transaction for snapshots.
- Java locks the single `app_lock` row within write transactions.
- MERN increments an internal application-lock document inside a transaction; conflicts retry with a fresh snapshot.

These intentionally serialize mutations to make cross-record rules, duplicate enrollment and last-seat races easy to reason about. That is appropriate for a hackathon/small teaching deployment. It is a throughput tradeoff: use granular locks, atomic counters, targeted queries, pagination and load tests before supporting a large university. MERN's repository currently loads the small workspace into a transaction-local unit of work and flushes only changed records.

SQLite/H2 data and MongoDB data survive application restarts via local files or named Docker volumes. Demo data is seeded only when `DEMO_MODE=true` **and the users collection/table is empty**. Turning demo mode off does not delete existing demo accounts.

## Security and deployment boundary

Passwords use PBKDF2-HMAC-SHA256 with 310,000 iterations and a random 16-byte salt. Random 32-byte session tokens are HttpOnly cookies; only token hashes are persisted. Tokens are revoked on logout, password changes and access changes. The app uses server-side authorization, URL scheme validation, typed/length-limited input, parameterized SQL or schema-backed queries, uniqueness constraints, origin checks and a modest auth rate limiter.

The Docker sample binds the website to localhost and keeps the backend/database on the internal network. It is a local demonstration configuration: MongoDB has no credentials and H2 uses its local default account, neither is exposed by a published port. For public hosting, use HTTPS, secure cookies, exact origins, secrets, authenticated database access, backups, a shared rate limiter with trusted proxy configuration, monitoring, and a deployment review. Run one project at a time on the default ports; the three apps share the cookie name `ascent_session` on localhost.

Content is rendered as plain text by React. Assignment and project submissions store text and URLs, not uploaded binaries; the server never fetches arbitrary URLs. CSV export guards leading spreadsheet formula characters. Certificates record application completion and are not accredited credentials.

## Deliberate scope

Included: the complete workflows in the README feature matrix. External email/password recovery, SSO, payments, live classroom/video hosting, file uploads/object storage, proctored exams, SCORM/xAPI, audit-log administration and multi-college tenancy are future integrations, not hidden placeholders. Course resources and demos link out to external sites. All included controls connect to implemented behavior.

Native desktop/mobile browser visual QA and the Docker Compose runtime were not available in the generation environment. The native backends, real databases, HTTP contract suites, Node syntax checks and frontend production build were verified; see TEST_REPORT.md.
