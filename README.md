# Ascent LMS — Learn. Build. Rise.

A campus learning and hackathon platform in **three complete full-stack editions**, built to help juniors learn through working code and present a coherent college hackathon project.

[![Validate all LMS editions](https://github.com/ATLURI0001/LMS/actions/workflows/ci.yml/badge.svg)](https://github.com/ATLURI0001/LMS/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

| Edition | Frontend | Native backend | Database | Setup |
|---|---|---|---|---|
| Python full stack | React + Vite | FastAPI / Python 3.12 | SQLite | [Python README](python-fullstack/README.md) |
| Java full stack | React + Vite | Spring Boot / Java 17 | H2 | [Java README](java-fullstack/README.md) |
| MERN full stack | React + Vite | Express / Node.js 24 | MongoDB replica set | [MERN README](mern-fullstack/README.md) |

Each edition includes its own API, database schema/seed, React client, Docker configuration, native startup instructions, tests, architecture notes, API reference, project report and hackathon guide. Choose one edition to run; their default ports and session-cookie names are shared.

## Start a local demo

Install Git and Docker with Compose v2. Clone the repository and choose an edition:

```bash
git clone https://github.com/ATLURI0001/LMS.git
cd LMS/python-fullstack
cp .env.example .env
docker compose up --build
```

For Java or MERN, use `java-fullstack` or `mern-fullstack` in the `cd` command. In Windows PowerShell, replace `cp .env.example .env` with `Copy-Item .env.example .env`. Open **http://localhost:8080** after startup. Native development without Docker is documented in each edition's README. For the quickest native setup, use Python with its built-in SQLite database.

The copied example settings deliberately enable demo data:

| Role | Email | Demo password |
|---|---|---|
| Student | `student@ascent.local` | `AscentDemo!2026` |
| Instructor | `instructor@ascent.local` | `AscentDemo!2026` |
| Admin | `admin@ascent.local` | `AscentDemo!2026` |

These credentials are public. Read [SECURITY.md](SECURITY.md) before hosting publicly. Setting `DEMO_MODE=false` does not remove already-created demo users. Production configuration checks require `APP_ENV=production`, secure cookies, disabled demo seeding and exact HTTPS origins. The supplied Compose setup is intended for local demos.

## Included modules

- **Accounts and access:** student registration, login/logout, profile/password updates, instructor/admin roles and account disabling.
- **Courses:** searchable catalog, enrollment, publishing/archiving, lesson content, resource links and completion tracking.
- **Assessment:** practice quizzes with server grading and explanations; text/URL assignments with instructor feedback and scores.
- **Progress:** eligibility-checked certificates with print/PDF support, dashboards and CSV reports.
- **Community:** course discussions, moderation and course/campus announcements.
- **Hackathons:** challenges, deadlines, teams, capacity and captain rules, project submissions, judging and leaderboard scores.

Authorization and business rules are enforced by the server. Curriculum locks after first enrollment; graded work cannot be replaced; repeated completion/certificate requests do not duplicate records. The same feature contract is implemented in each native backend.

## Repository layout

| Path | Purpose |
|---|---|
| `python-fullstack/` | Standalone Python edition |
| `java-fullstack/` | Standalone Java edition |
| `mern-fullstack/` | Standalone MERN edition |
| `legacy/` | Original React prototype, preserved unchanged from the previous repository tree |
| `.github/workflows/ci.yml` | Tests and frontend builds for all three editions |
| `.github/dependabot.yml` | Dependency-update configuration for supported code |
| `SECURITY.md` | Reporting policy, implemented controls and deployment guidance |
| `CONTRIBUTING.md` | Development and test commands |

The earlier repository remains available under `legacy/` and in Git history. It is reference material; new CI and startup commands target the three supported editions.

## Validation and learning resources

Run the test commands in the chosen edition's README or [CONTRIBUTING.md](CONTRIBUTING.md). Root CI builds every React client and runs native API tests against real SQLite, H2 and temporary MongoDB databases. Each edition's `docs/TEST_REPORT.md` records completed checks and remaining manual verification.

For a presentation, start with [the hackathon guide](python-fullstack/docs/HACKATHON_GUIDE.md), [architecture](python-fullstack/docs/ARCHITECTURE.md), [API reference](python-fullstack/docs/API.md) and [project report](python-fullstack/docs/PROJECT_REPORT.md); corresponding documents are included in each edition. Demonstrate a student learning flow followed by instructor grading and a team project judging flow.

These are working learning projects. Binary uploads, live video, email recovery, SSO and payments are future extensions. Aggregate data loading and serialized writes are deliberate simplicity tradeoffs for a small campus demo. Docker startup, browser/mobile layout, certificate printing and university-scale performance still require deployment-specific verification.

## License

The new editions and repository documentation are [MIT licensed](LICENSE), © 2026 Ramprasad Atluri. Third-party dependencies and archived materials retain their original terms; see [NOTICE.md](NOTICE.md).
