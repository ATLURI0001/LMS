# Ascent LMS

**Learn. Build. Rise.** A full-stack campus learning and hackathon platform for students, instructors and administrators.

**MERN edition:** MongoDB, Express, React and Node.js, with Mongoose schemas and replica-set transactions.

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

## MERN API development

Prerequisites: **Node.js 24**, **MongoDB 8 replica set** (or MongoDB Atlas), and Python 3.12 only if running the common acceptance suite.

The simplest complete local setup is `docker compose up --build` above. For separate API/frontend development, start your own MongoDB replica set or use an Atlas development database. Multi-document transactions require a replica set: a plain standalone `mongod` is insufficient. If using a single local MongoDB node, start it with `--replSet rs0` and run `rs.initiate()` once in `mongosh`.

```powershell
cd backend
Copy-Item .env.example .env
npm ci
# Edit .env with your development MONGO_URI before starting.
npm run dev
```

On macOS/Linux, use `cp .env.example .env`. The API listens on port 8000. The backend loads `.env` with dotenv. `MONGO_URI` must point to a replica set and include the desired database name. The bundled example uses `mongodb://127.0.0.1:27017/ascent?replicaSet=rs0`. Use a dedicated development database; never put database credentials in frontend variables.

For a new non-demo database, set `DEMO_MODE=false`, set `ADMIN_PASSWORD` temporarily in your environment, run `npm run admin` from `backend`, enter the admin email/name, and clear `ADMIN_PASSWORD`. The script does not echo the password. Atlas credentials belong only in backend secrets.


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
cd backend
npm ci
npm test
```

The runner uses a **real temporary MongoDB replica set** supplied by `mongodb-memory-server` and starts the Express API. Python must be available as `python`, or set `PYTHON` to its executable path. The first test run downloads a MongoDB binary, so network access and a compatible OS are required. It never uses your configured application database.


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
