# REST API reference

Every edition implements the same JSON contract under `/api`. Browser requests use same-origin `/api` paths through Vite or Nginx. Error bodies have `{ "error": "human readable message" }` with an appropriate HTTP status. All business actions return HTTP 200; registration returns 201.

## Authentication

| Method | Route | JSON body / response |
|---|---|---|
| GET | `/health` | Public `{status, stack}` |
| POST | `/auth/register` | `{name, email, password}` → `{user}` + session cookie |
| POST | `/auth/login` | `{email, password}` → `{user}` + session cookie |
| GET | `/auth/me` | `{user}` |
| POST | `/auth/logout` | `{}`; revokes current session |
| PATCH | `/profile` | `{name}` |
| POST | `/auth/password` | `{current, password}`; revokes all sessions |
| PATCH | `/users/:id` | Admin only: `{role: "student|instructor|admin", active: boolean}` |

Passwords are 12–128 characters and whitespace is significant. Sessions last one day and use an HttpOnly, SameSite=Strict cookie scoped to `/api`. Only a SHA-256 hash of the random session token is stored. `COOKIE_SECURE=true` is required behind HTTPS. Writes reject an untrusted Origin or `Sec-Fetch-Site: cross-site`. Nonbrowser clients may omit Origin. Login/register attempts are limited to 40 per address per 15 minutes per application process. Configure trusted proxy handling and a shared limiter before scaling.

## Courses and assessment

| Method | Route | JSON body |
|---|---|---|
| GET | `/state` | Role-filtered workspace snapshot; see below |
| POST | `/courses` | Course payload |
| PATCH | `/courses/:id` | Complete course payload |
| POST | `/courses/:id/enroll` | `{}` |
| POST | `/courses/:id/lessons` | Lesson payload |
| PATCH | `/lessons/:id` | Complete lesson payload |
| DELETE | `/lessons/:id` | `{}` |
| POST | `/lessons/:id/complete` | `{}` |
| POST | `/courses/:id/questions` | Question payload |
| PATCH | `/questions/:id` | Complete question payload |
| DELETE | `/questions/:id` | `{}` |
| POST | `/courses/:id/quiz` | `{answers: {"question-id": 0}}` with every question answered |
| POST | `/courses/:id/assignments` | Assignment payload |
| PATCH | `/assignments/:id` | Complete assignment payload |
| DELETE | `/assignments/:id` | `{}` |
| POST | `/assignments/:id/submit` | `{body, url}`; URL may be empty |
| POST | `/submissions/:id/grade` | `{score, feedback}` |
| POST | `/courses/:id/certificate` | `{}`; returns existing certificate if already issued |

Course: `{title, description, category, level, color, status}`. Levels: `Beginner`, `Intermediate`, `Advanced`. Colors: `violet`, `mint`, `peach`, `blue`. Status: `draft`, `published`, `archived`.

Lesson: `{title, body, resource_url, position, minutes}`. Body is plain text, not executable HTML. Resource URL is optional and must be HTTP(S). Position: 1–1000, minutes: 1–600.

Question: `{prompt, options: ["A", "B", "C", "D"], correct: 0, explanation}`. Exactly four nonempty options; correct index 0–3. Quiz responses return `{attempt, review}`, with score and explanations computed by the server.

Assignment: `{title, description, due_at, max_score}`. Dates are ISO 8601 with a timezone; stored in UTC. Maximum score 1–1000. Submission score is `-1` until graded. A zero score is a real grade, never “pending.”

## Collaboration

| Method | Route | JSON body |
|---|---|---|
| POST | `/courses/:id/discussions` | `{body}` |
| DELETE | `/discussions/:id` | `{}`; author or course manager |
| POST | `/announcements` | `{course_id, title, body}`; blank course ID means campus-wide, admin only |
| DELETE | `/announcements/:id` | `{}`; author or admin |
| POST | `/challenges` | `{title, description, max_members, deadline, status}` |
| PATCH | `/challenges/:id` | Complete challenge payload |
| POST | `/challenges/:id/teams` | `{name}` |
| POST | `/teams/:id/join` | `{}` |
| POST | `/teams/:id/leave` | `{}`; noncaptain, before submission |
| POST | `/teams/:id/project` | `{title, description, repo_url, demo_url}`; captain only |
| POST | `/projects/:id/grade` | `{score, feedback}`; score 0–100 |

Challenges use `open` or `closed` and allow 1–10 members. Deadlines are enforced regardless of the visible status. Team projects and judging feedback are visible to signed-in campus members. Do not submit private repository credentials or sensitive material.

## Workspace snapshot

`/state` returns `user`, `users`, `courses`, `lessons`, `questions`, `assignments`, `enrollments`, `completions`, `attempts`, `submissions`, `discussions`, `announcements`, `challenges`, `teams`, `memberships`, `projects`, `certificates`, and `leaderboard`.

- Other users' emails and active status are admin-only; public campus name/role/ID remain visible.
- Password hashes and session records are never returned.
- Unenrolled students receive a course outline, without lesson bodies/resources or quiz questions.
- Quiz answer keys are available to the owning instructor/admin and returned to a student only in the post-attempt review.
- Students receive their own submissions and attempts. Course managers receive records for courses they manage.
- Certificates are private to the learner. Archived courses remain accessible to existing learners, but cannot accept new enrollment.

The snapshot API is intentionally simple for a small campus demo. Add pagination and targeted resource queries before large-scale use. IDs are UUID strings; timestamps are UTC. `PATCH` endpoints require the complete editable payload as documented above, not arbitrary JSON merge patches.

## Error codes

400: malformed JSON or wrong current password. 401: unauthenticated/expired/disabled account or incorrect login. 403: permission or origin denied. 404: missing resource/route. 409: duplicate record, locked curriculum, full team, past deadline, or certificate requirements not met. 413: body above 64 KiB. 422: invalid field. 429: auth rate limit. 500: unexpected internal failure with details kept in server logs.
