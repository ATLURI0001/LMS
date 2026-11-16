# Role-Based Access Control (RBAC) & JWT Lifecycle Guide

## Role Hierarchy
- **Admin**: System-wide tenant provisioning, audit log inspection, course approval.
- **Instructor**: Curriculum management, assignment grading, roster management.
- **Teaching Assistant (TA)**: Submission review, forum moderation, office hour scheduling.
- **Student**: Course enrollment, assignment submission, discussion participation.

## Token Specifications
- Access Token TTL: 15 minutes (RS256 signed JWT)
- Refresh Token TTL: 7 days (opaque token stored in encrypted Redis store)
