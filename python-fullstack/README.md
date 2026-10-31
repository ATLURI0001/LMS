# Ascent LMS

**Learn. Build. Rise.** A full-stack campus learning and hackathon platform for students, instructors and administrators.

**Python edition:** React + Vite frontend, FastAPI backend, SQLite relational database.

## Quick start — Docker Desktop / Docker Engine with Compose v2

From this project's folder:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
docker compose up --build
```

```bash
# macOS / Linux
cp .env.example .env
docker compose up --build
```

Open **http://localhost:8080** after the services have finished starting. The first build downloads dependencies. `start.ps1` and `start.sh` wrap these same commands. Stop with Ctrl+C and `docker compose down`. Data stays in named volumes. Running `docker compose down -v` deletes this project's stored data; use it only for an intentional demo reset.

The default ports and cookie name are shared across editions: run one edition at a time, or use separate browser profiles and change ports/origins deliberately. If port 8080 is occupied, update the Compose port mapping and `ALLOWED_ORIGINS` together.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | `student@ascent.local` | `AscentDemo!2026` |
| Instructor | `instructor@ascent.local` | `AscentDemo!2026` |
| Admin | `admin@ascent.local` | `AscentDemo!2026` |

The demo includes three learning paths, nine lessons, seven quiz questions, three assignments, an announcement and one hackathon challenge. The student starts with one enrollment and one completed lesson. **These are public demonstration credentials.** Demo seeding requires `DEMO_MODE=true` and an empty user table/collection. `VITE_DEMO_MODE=true` shows account shortcuts in the UI. Disable both for a new non-demo installation, and remove or change existing demo accounts before any public deployment. Setting the flag to false does not remove already-seeded users.

## Python API development

Prerequisites: **Python 3.12**, Node.js 24. SQLite is included with Python; no database server is needed.

```powershell
# Windows PowerShell, from the project root
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
$env:DEMO_MODE="true"
cd backend
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

```bash
# macOS / Linux, from the project root
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
cd backend
DEMO_MODE=true ../.venv/bin/python -m uvicorn main:app --reload --port 8000
```

The SQLite database is `backend/data/ascent.db` by default. `DATABASE_PATH` overrides it. Environment variables configure the backend directly; `backend` does not automatically load a `.env` file. The root `.env` is consumed by Compose.

For a new non-demo installation, leave `DEMO_MODE` unset/false and run `python bootstrap_admin.py` from `backend` with the virtual environment interpreter. It prompts for the administrator name, email and password without echoing the password.


## Frontend development (a second terminal)

Prerequisite: **Node.js 24** and npm. From the project root:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

On macOS/Linux, replace `Copy-Item` with `cp`. Open **http://localhost:5173**. The Vite proxy sends `/api` to port 8000. Configure `API_URL` in `frontend/.env` if needed, then restart Vite. It is a development proxy setting, not a browser secret. Run `npm run build` for the production client; Nginx in Compose serves that build and proxies its API.


## Working modules

| Module | Student | Instructor | Admin |
|---|---|---|---|
| Identity | Register, sign in/out, edit name, change password | Same account controls | Manage roles and disable/enable accounts |
| Course catalog | Search by topic, name or level; enroll | Create own courses; edit details; publish/archive | Manage every course |
| Curriculum | Read lessons and resource links; track completion | Add/edit/delete lessons before enrollment | Same for all courses |
| Practice quizzes | Submit answers, see explanations, retry; best score retained | Author four-option questions and inspect attempts | Manage every quiz |
| Assignments | Text + optional HTTP(S) work URL; edit until graded | Review, score, provide feedback | Review every course |
| Progress & certificates | Claim eligible certificates; print/save as PDF | Inspect learning reports | Campus reporting |
| Discussion | Post in enrolled courses; remove own posts | Moderate owned courses | Moderate all courses |
| Announcements | Read enrolled-course and campus messages | Post to owned courses | Post campus-wide notices |
| Hackathons | Create/join teams; captain submits project; join/leave rules | Launch challenges; judge owned challenges | Manage and judge all challenges |
| Leaderboard | Lesson, best-quiz and team-project points | View rankings | View rankings |
| Reporting | Personal progress dashboard | Enrollment/grade dashboard and CSV export | Full reporting and people management |

## Rules worth demonstrating

- The server ignores a `role` sent during registration: new accounts are students.
- Instructor ownership is checked on every course mutation and grade.
- Curriculum is locked after the first enrollment. Create a new course version to change assessment requirements; course descriptions/status and grading remain editable.
- Quiz correct answers are hidden from students until they submit an attempt. These are **practice quizzes**, with unlimited retries and explanations.
- Completion records and certificates are idempotent. Duplicate enrollment is rejected.
- A certificate requires all lessons, a best quiz score of at least 70% when a quiz exists, and at least 50% on every assignment.
- A student can belong to only one team per challenge. Capacity, deadlines and captain-only submissions are enforced in transactions.
- Team rosters lock after a project is submitted; graded work cannot be replaced. Judges cannot grade their own team.
- Learning points = 10 per completed lesson + the best quiz percentage per course + each judged team project's score. Repeated attempts do not stack points. Assignment grades qualify certificates but do not add leaderboard points.
- Password changes revoke all sessions. Admin access changes revoke the affected user's sessions. Admins cannot remove their own access.


## Repository structure

```text
backend/       Native API, domain rules, persistence, seed data and Dockerfile
frontend/      React screens, CSS, Vite proxy and Nginx production configuration
tests/         Stack-neutral HTTP acceptance suite and disposable-server runner
docs/          API, architecture, project report, test report and hackathon guide
.github/       CI workflow for frontend and backend validation
compose.yaml   Local multi-service startup and persistent volumes
.env.example   Safe demonstration configuration
```

## Tests

```powershell
# From project root; the runner starts/stops a disposable SQLite-backed API.
.venv\Scripts\python.exe tests\run_local.py python
```

On macOS/Linux use `.venv/bin/python tests/run_local.py python`. Optional developer dependencies are in `backend/requirements-dev.txt`; the acceptance suite itself uses Python's standard library.


The tests use disposable databases and create unique fixture users/courses. The explicit `acceptance.py URL` mode writes test data to the target: use only a disposable demo deployment. Do not point it at real college data. The frontend build validates JSX imports and production bundling. `npm run preview` only previews built static assets; use the development proxy or Compose to exercise the API.

## Documentation

- [REST API and payloads](docs/API.md)
- [Architecture, relationships and deployment boundary](docs/ARCHITECTURE.md)
- [Verification results](docs/TEST_REPORT.md)
- [Hackathon demo, learning plan and viva](docs/HACKATHON_GUIDE.md)
- [Project report](docs/PROJECT_REPORT.md)
- [Attribution](NOTICE.md)

## Repository and contribution

This edition is maintained in [ATLURI0001/LMS](https://github.com/ATLURI0001/LMS). Clone the repository once, then work inside this edition's folder. Root CI validates all three editions; the nested workflow is retained for users who copy an edition into a standalone repository. See the root [contribution guide](../CONTRIBUTING.md) and [security policy](../SECURITY.md).

The `.gitignore` excludes local secrets, databases, dependencies and build output. Commit `.env.example`, dependency locks, source and documentation. Run `npm test` and `npm run build` in `frontend` after client changes.

## Teaching-project boundary

This is a working hackathon project with the modules listed above, not a claim of production certification or university-scale load capacity. Text/URL submissions are implemented; binary uploads, live video, email recovery, SSO and payments are extension work. The sample Compose setup is local-only, with no published database port. Set `APP_ENV=production` for deployment configuration checks; the API then refuses demo seeding, insecure cookies and missing/non-HTTPS origin lists. This check does not remove already-seeded demo users. Public deployment requires HTTPS, exact allowed origins, secure cookies, authenticated database access, secret management and backup/recovery planning. See architecture documentation for the deliberate performance tradeoffs.

MIT © 2026 Ramprasad Atluri. Third-party dependencies retain their licenses.
