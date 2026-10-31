# Ascent LMS — project report

## Abstract

Ascent connects structured learning with hands-on campus challenges. Students move from course enrollment through lessons, practice quizzes and assignments, then form teams and submit projects for judging. Instructors manage curriculum and feedback; administrators manage account access and campus notices. The same functional contract is implemented independently in Python, Java and MERN, giving juniors a practical way to compare backend ecosystems.

## Objectives

- Keep learning, assessment and project collaboration in one coherent workflow.
- Enforce role permissions and scoring on the server.
- Preserve durable progress and avoid duplicate records under concurrent requests.
- Provide a polished, understandable project that a college team can run, explain and extend.

## Functional requirements

See the README module matrix and API.md. The main actors are student, instructor and administrator. Every account has one current role. Instructors own their courses and challenges; admins can manage all. The interface includes catalog search, a reading workspace, quiz review, assignment review, discussions, announcements, team management, judging, rankings, reports and certificates.

## Nonfunctional requirements

Passwords must be hashed, sessions revocable, errors readable, data persistent, updates transactionally consistent, and source reproducible from pinned dependencies. The interface includes labels, keyboard focus, native modal dialogs, reduced-motion support, print styles and responsive breakpoints. A frontend production build and a common HTTP acceptance suite verify behavior; browser visual and container-runtime checks are separately disclosed.

## Implementation

The client is React/Vite with plain CSS and Lucide icons. Each backend uses a request layer, a domain service and a persistence layer. Shared schema documentation does not replace native database storage. Unique relationships prevent duplicate enrollment, completion, membership, submission and certificate records. Course assessments become immutable once the first student enrolls. This makes later completion calculations stable and explainable.

## Evaluation

The included acceptance suite drives actual HTTP servers and databases. It tests success, denial, invalid data, content privacy, scoring integrity, deadline checks, state transitions, session revocation and concurrent mutations. See TEST_REPORT.md for the measured check count and the exact verification scope. No benchmark, adoption or performance claims are made.

## Future development

Add email verification/recovery, object storage, institution-specific enrollment, audit logs, granular transactions, paginated APIs and controlled load tests. Introduce integrations only when a real campus need supports them.
