# Hackathon and learning guide

## A five-minute demonstration

1. **Problem, 20 seconds:** students learn across disconnected tools; faculty cannot easily connect learning progress to team project outcomes.
2. **Student journey, 90 seconds:** sign in as student, open the existing full-stack course, complete a lesson, take its practice quiz, and submit the assignment with a repository URL.
3. **Instructor workflow, 60 seconds:** sign out, use the instructor account, open Reports & grading, read the submission and grade it. Show the course studio and explain why assessment content locks on enrollment.
4. **Proof of learning, 30 seconds:** sign back in as the student, complete remaining lessons, pass the quiz and claim the certificate. Print/save as PDF through the browser.
5. **Build phase, 60 seconds:** create a hackathon team, submit a repository and demo URL, switch to the instructor, judge the project, then show the derived leaderboard.
6. **Engineering, 40 seconds:** explain the stack, server permissions, database uniqueness, transactions, and one last-seat race test. End with the limitation you would improve first.

Open separate browser profiles or an incognito window for roles when presenting; cookies within the same profile share one signed-in account. Do not advertise made-up adoption, accuracy or performance statistics. Show the acceptance test output as reproducible evidence.

## Suggested team ownership

| Person | Ownership |
|---|---|
| Frontend | Accessible screens, responsive layout, forms and states |
| Backend | Validation, permissions, grading and transactions |
| Data/testing | Schema, seed data, acceptance tests and failure cases |
| Product/demo | Campus interviews, scope, real use case and presentation |

## Four-stage junior learning plan

1. **Trace:** follow login → cookie → `/state`; draw browser, API, service, repository and database.
2. **Explain:** walk through enrollment and certificate eligibility. Explain why a disabled button is not authorization.
3. **Extend:** add one useful feature, such as course bookmarks or assignment rubric criteria, with a server rule, persistence and UI.
4. **Verify:** add a behavior test, run the existing suite, rehearse the demo and document the tradeoff.

Python focus: type validation, context managers, parameterized SQL, transactions and dependency isolation. Java focus: dependency injection, JDBC, transaction boundaries, maps/DTO refactoring and Maven. MERN focus: asynchronous request handling, schemas, unique indexes, replica-set transactions and React state.

## Feature ideas to make the submission your own

- Interview juniors and replace seed content with a real course relevant to your department.
- Add rubric-based feedback with multiple criteria instead of a single score.
- Add an admin-managed mentor matching workflow.
- Add a real email provider for verified email and password recovery.
- Replace the workspace snapshot with paginated resource endpoints and compare query costs.
- Add calendar exports and learner-controlled reminders.

Avoid adding a feature you cannot finish and explain. Credit dependencies and your teammates, and follow your hackathon's rules on prebuilt or AI-assisted code.

## Viva questions with concise answers

**Authentication vs authorization?** Authentication establishes identity; authorization decides whether that identity may perform this action.

**Why server-side scoring?** The browser is editable. The server reads stored answer keys and ignores a client-supplied score.

**Why a unique enrollment constraint?** Two simultaneous requests can pass a client-side check. The database must reject the duplicate.

**Why a MongoDB replica set?** This edition uses multi-document transactions for cross-collection invariants.

**Why cookie sessions?** HttpOnly prevents JavaScript from reading the token; the server can revoke it immediately. SameSite and origin checks reduce cross-site request risk.

**Why PBKDF2 rather than plain SHA-256 for passwords?** A deliberately slow salted password function makes guessing more expensive. SHA-256 is used only to index high-entropy session tokens.

**What is locked after enrollment?** Assessment requirements: lessons, questions and assignments. This preserves consistent completion requirements for enrolled learners.

**Can this handle a whole university unchanged?** It has no validated load capacity. Replace full snapshots and global write serialization with paginated queries and finer concurrency controls before scaling.

**What does a certificate prove?** The application's requirements were met at issuance. It is not an external qualification or a proctored assessment.
