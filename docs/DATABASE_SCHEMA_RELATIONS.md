# Academic Workflow Schema Relations & Migration Guide

## Key Entities & Constraints
- `Courses`: Unique course code, credits, department ID, active semester flag.
- `Prerequisites`: Self-referential graph preventing circular prerequisite dependencies.
- `Enrollments`: Many-to-many relationship with composite key `(student_id, course_id, semester)`.
- `Submissions`: Immutable submission audit records with cryptographically signed timestamps.
