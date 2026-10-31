"""Application rules shared by the REST endpoints; kept independent of FastAPI."""

import re
from datetime import datetime, timezone
from urllib.parse import urlparse
from database import now
from security import hash_password, verify_password


class ApiError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message


def need(condition, message="Forbidden", status=403):
    if not condition:
        raise ApiError(status, message)


def text(data, key, min_len=1, max_len=200):
    value = data.get(key, "")
    need(isinstance(value, str), f"{key} must be text", 422)
    value = value.strip()
    need(
        min_len <= len(value) <= max_len,
        f"{key} must be {min_len}–{max_len} characters",
        422,
    )
    return value


def integer(data, key, low, high):
    value = data.get(key)
    need(
        type(value) == int and low <= value <= high,
        f"{key} must be an integer from {low} to {high}",
        422,
    )
    return value


def choice(data, key, options):
    value = text(data, key)
    need(value in options, f"Invalid {key}", 422)
    return value


def url(data, key, required=False):
    value = text(data, key, 1 if required else 0, 2000)
    if value:
        p = urlparse(value)
        need(
            p.scheme in ("http", "https")
            and bool(p.hostname)
            and not p.username
            and not p.password,
            f"{key} must be an HTTP(S) URL",
            422,
        )
    return value


def date(data, key):
    value = text(data, key, 1, 40)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        need(parsed.tzinfo is not None, f"{key} needs a timezone", 422)
        return (
            parsed.astimezone(timezone.utc)
            .isoformat(timespec="seconds")
            .replace("+00:00", "Z")
        )
    except ValueError:
        raise ApiError(422, f"Invalid {key}")


def public(user):
    return {k: v for k, v in user.items() if k != "password_hash"}


def password(data, key="password"):
    value = data.get(key, "")
    need(
        isinstance(value, str) and 12 <= len(value) <= 128,
        "Password must be 12–128 characters",
        422,
    )
    return value


class Service:
    def __init__(self, db, user=None):
        self.db, self.user = db, user

    def rows(self, table, **query):
        return [
            r
            for r in self.db.all(table)
            if all(r.get(k) == v for k, v in query.items())
        ]

    def get(self, table, id):
        row = self.db.get(table, id)
        need(row is not None, "Not found", 404)
        return row

    def staff(self):
        return self.user["role"] in ("admin", "instructor")

    def manages(self, course):
        return self.user["role"] == "admin" or (
            self.user["role"] == "instructor" and course["owner_id"] == self.user["id"]
        )

    def manage_course(self, id):
        course = self.get("courses", id)
        need(self.manages(course))
        return course

    def enrolled(self, id):
        course = self.get("courses", id)
        need(
            self.manages(course)
            or bool(self.rows("enrollments", course_id=id, user_id=self.user["id"])),
            "Enroll in this course first",
        )
        return course

    def student(self):
        need(self.user["role"] == "student", "This action requires a student account")

    def open_challenge(self, id):
        challenge = self.get("challenges", id)
        need(
            challenge["status"] == "open" and challenge["deadline"] > now(),
            "This challenge is closed",
            409,
        )
        return challenge

    def challenge_owner(self, id):
        c = self.get("challenges", id)
        need(
            self.user["role"] == "admin"
            or (self.user["role"] == "instructor" and c["owner_id"] == self.user["id"])
        )
        return c

    def curriculum(self, cid):
        self.manage_course(cid)
        need(
            not self.rows("enrollments", course_id=cid),
            "Curriculum is locked after the first enrollment. Create a new course version.",
            409,
        )

    def state(self):
        uid = self.user["id"]
        allcourses = self.db.all("courses")
        owned = {c["id"] for c in allcourses if self.manages(c)}
        enrolled = {r["course_id"] for r in self.rows("enrollments", user_id=uid)}
        visible = {
            c["id"]
            for c in allcourses
            if c["status"] == "published" or c["id"] in owned | enrolled
        }
        accessible = owned | enrolled
        data = {
            "user": public(self.user),
            "courses": [c for c in allcourses if c["id"] in visible],
        }
        data["users"] = [
            (
                public(u)
                if self.user["role"] == "admin" or u["id"] == uid
                else {k: u[k] for k in ("id", "name", "role")}
            )
            for u in self.db.all("users")
        ]
        data["lessons"] = [
            (
                l
                if l["course_id"] in accessible
                else {k: v for k, v in l.items() if k not in ("body", "resource_url")}
            )
            for l in self.db.all("lessons")
            if l["course_id"] in visible
        ]
        data["questions"] = [
            (
                q
                if q["course_id"] in owned
                else {k: v for k, v in q.items() if k not in ("correct", "explanation")}
            )
            for q in self.db.all("questions")
            if q["course_id"] in accessible
        ]
        for table in ("assignments", "discussions", "announcements"):
            data[table] = [
                r
                for r in self.db.all(table)
                if r["course_id"] in accessible
                or (table == "announcements" and not r["course_id"])
            ]
        for table in ("enrollments", "completions", "attempts", "submissions"):
            data[table] = [
                r
                for r in self.db.all(table)
                if r["user_id"] == uid or r["course_id"] in owned
            ]
        data["certificates"] = self.rows("certificates", user_id=uid)
        for table in ("challenges", "teams", "memberships", "projects"):
            data[table] = self.db.all(table)
        totals = []
        for u in self.db.all("users"):
            if u["role"] != "student" or not u["active"]:
                continue
            best = {}
            for a in self.rows("attempts", user_id=u["id"]):
                best[a["course_id"]] = max(best.get(a["course_id"], 0), a["score"])
            teamids = {m["team_id"] for m in self.rows("memberships", user_id=u["id"])}
            points = (
                len(self.rows("completions", user_id=u["id"])) * 10
                + sum(best.values())
                + sum(
                    max(0, p["score"])
                    for p in self.db.all("projects")
                    if p["team_id"] in teamids
                )
            )
            totals.append({"id": u["id"], "name": u["name"], "points": points})
        data["leaderboard"] = sorted(totals, key=lambda x: (-x["points"], x["name"]))
        return data

    def dispatch(self, method, path, data):
        parts = path.strip("/").split("/")
        root = parts[0]
        id = parts[1] if len(parts) > 1 else ""
        action = parts[2] if len(parts) > 2 else ""
        uid = self.user["id"]
        if method == "GET" and path == "state":
            return self.state()
        if method == "PATCH" and path == "profile":
            return public(
                self.db.update("users", uid, {"name": text(data, "name", 2, 80)})
            )
        if method == "POST" and path == "auth/password":
            need(
                isinstance(data.get("current"), str)
                and len(data["current"]) <= 128
                and verify_password(data["current"], self.user["password_hash"]),
                "Current password is incorrect",
                400,
            )
            self.db.update(
                "users", uid, {"password_hash": hash_password(password(data))}
            )
            for s in self.rows("sessions", user_id=uid):
                self.db.delete("sessions", s["id"])
            return {"message": "Password changed. Sign in again."}
        if root == "courses":
            if method == "POST" and not id:
                need(self.staff())
                return self.db.insert(
                    "courses", {"owner_id": uid, **self.course_data(data)}
                )
            if method == "PATCH" and id and not action:
                self.manage_course(id)
                return self.db.update("courses", id, self.course_data(data))
            if method == "POST" and action == "enroll":
                self.student()
                course = self.get("courses", id)
                need(
                    course["status"] == "published",
                    "Course is not open for enrollment",
                    409,
                )
                need(
                    not self.rows("enrollments", user_id=uid, course_id=id),
                    "Already enrolled",
                    409,
                )
                return self.db.insert("enrollments", {"course_id": id, "user_id": uid})
            if method == "POST" and action in ("lessons", "questions", "assignments"):
                self.curriculum(id)
                return self.db.insert(
                    action, {"course_id": id, **self.content_data(action, data)}
                )
            if method == "POST" and action == "quiz":
                self.student()
                self.enrolled(id)
                questions = self.rows("questions", course_id=id)
                need(bool(questions), "No quiz available", 409)
                answers = data.get("answers")
                need(
                    isinstance(answers, dict)
                    and set(answers) == {q["id"] for q in questions},
                    "Answer every quiz question",
                    422,
                )
                correct = 0
                for q in questions:
                    v = answers[q["id"]]
                    need(
                        type(v) == int and 0 <= v < len(q["options"]),
                        "Invalid answer",
                        422,
                    )
                    correct += v == q["correct"]
                score = (correct * 100 + len(questions) // 2) // len(questions)
                attempt = self.db.insert(
                    "attempts",
                    {
                        "course_id": id,
                        "user_id": uid,
                        "answers": answers,
                        "score": score,
                    },
                )
                return {
                    "attempt": attempt,
                    "review": [
                        {
                            "id": q["id"],
                            "correct": q["correct"],
                            "explanation": q["explanation"],
                        }
                        for q in questions
                    ],
                }
            if method == "POST" and action == "discussions":
                self.enrolled(id)
                return self.db.insert(
                    "discussions",
                    {
                        "course_id": id,
                        "user_id": uid,
                        "body": text(data, "body", 1, 3000),
                    },
                )
            if method == "POST" and action == "certificate":
                self.student()
                course = self.enrolled(id)
                lessons = self.rows("lessons", course_id=id)
                done = {
                    r["lesson_id"]
                    for r in self.rows("completions", course_id=id, user_id=uid)
                }
                need(
                    bool(lessons) and all(l["id"] in done for l in lessons),
                    "Complete every lesson first",
                    409,
                )
                need(
                    not self.rows("questions", course_id=id)
                    or any(
                        a["score"] >= 70
                        for a in self.rows("attempts", course_id=id, user_id=uid)
                    ),
                    "Pass the quiz with at least 70%",
                    409,
                )
                for a in self.rows("assignments", course_id=id):
                    submissions = self.rows(
                        "submissions", assignment_id=a["id"], user_id=uid
                    )
                    need(
                        bool(submissions)
                        and submissions[0]["score"] >= 0
                        and submissions[0]["score"] * 100 >= a["max_score"] * 50,
                        "Pass every assignment with at least 50%",
                        409,
                    )
                existing = self.rows("certificates", course_id=id, user_id=uid)
                return (
                    existing[0]
                    if existing
                    else self.db.insert(
                        "certificates",
                        {
                            "course_id": id,
                            "user_id": uid,
                            "course_title": course["title"],
                            "learner_name": self.user["name"],
                        },
                    )
                )
        if root in ("lessons", "questions", "assignments") and id:
            row = self.get(root, id)
            if root == "lessons" and method == "POST" and action == "complete":
                self.student()
                self.enrolled(row["course_id"])
                found = self.rows("completions", user_id=uid, lesson_id=id)
                return (
                    found[0]
                    if found
                    else self.db.insert(
                        "completions",
                        {
                            "user_id": uid,
                            "lesson_id": id,
                            "course_id": row["course_id"],
                        },
                    )
                )
            if root == "assignments" and method == "POST" and action == "submit":
                self.student()
                self.enrolled(row["course_id"])
                need(row["due_at"] > now(), "The assignment deadline has passed", 409)
                value = {
                    "body": text(data, "body", 10, 10000),
                    "url": url(data, "url"),
                    "score": -1,
                    "feedback": "",
                    "graded_by": "",
                }
                found = self.rows("submissions", user_id=uid, assignment_id=id)
                need(
                    not found or found[0]["score"] < 0,
                    "Graded submissions are locked",
                    409,
                )
                return (
                    self.db.update("submissions", found[0]["id"], value)
                    if found
                    else self.db.insert(
                        "submissions",
                        {
                            "user_id": uid,
                            "assignment_id": id,
                            "course_id": row["course_id"],
                            **value,
                        },
                    )
                )
            if not action and method in ("PATCH", "DELETE"):
                self.curriculum(row["course_id"])
                if method == "DELETE":
                    self.db.delete(root, id)
                    return {"message": "Deleted"}
                return self.db.update(root, id, self.content_data(root, data))
        if root == "submissions" and action == "grade" and method == "POST":
            s = self.get("submissions", id)
            self.manage_course(s["course_id"])
            a = self.get("assignments", s["assignment_id"])
            return self.db.update(
                "submissions",
                id,
                {
                    "score": integer(data, "score", 0, a["max_score"]),
                    "feedback": text(data, "feedback", 1, 3000),
                    "graded_by": uid,
                },
            )
        if root == "discussions" and id and method == "DELETE":
            row = self.get("discussions", id)
            need(
                row["user_id"] == uid
                or self.manages(self.get("courses", row["course_id"]))
            )
            self.db.delete("discussions", id)
            return {"message": "Deleted"}
        if root == "announcements" and method == "POST" and not id:
            need(self.staff())
            cid = text(data, "course_id", 0, 100)
            if cid:
                self.manage_course(cid)
            else:
                need(
                    self.user["role"] == "admin",
                    "Only admins can post campus-wide announcements",
                )
            return self.db.insert(
                "announcements",
                {
                    "course_id": cid,
                    "author_id": uid,
                    "title": text(data, "title", 3, 160),
                    "body": text(data, "body", 5, 5000),
                },
            )
        if root == "announcements" and id and method == "DELETE":
            row = self.get("announcements", id)
            need(self.user["role"] == "admin" or row["author_id"] == uid)
            self.db.delete("announcements", id)
            return {"message": "Deleted"}
        if root == "challenges":
            if method == "POST" and not id:
                need(self.staff())
                return self.db.insert(
                    "challenges", {"owner_id": uid, **self.challenge_data(data)}
                )
            if method == "PATCH" and id and not action:
                self.challenge_owner(id)
                value = self.challenge_data(data)
                sizes = [
                    len(self.rows("memberships", team_id=t["id"]))
                    for t in self.rows("teams", challenge_id=id)
                ]
                need(
                    not sizes or max(sizes) <= value["max_members"],
                    "Team limit is below an existing team size",
                    409,
                )
                return self.db.update("challenges", id, value)
            if method == "POST" and action == "teams":
                self.student()
                self.open_challenge(id)
                need(
                    not self.rows("memberships", challenge_id=id, user_id=uid),
                    "You already joined a team for this challenge",
                    409,
                )
                team = self.db.insert(
                    "teams",
                    {
                        "challenge_id": id,
                        "captain_id": uid,
                        "name": text(data, "name", 2, 80),
                    },
                )
                self.db.insert(
                    "memberships",
                    {"challenge_id": id, "team_id": team["id"], "user_id": uid},
                )
                return team
        if root == "teams" and id and method == "POST":
            team = self.get("teams", id)
            challenge = self.open_challenge(team["challenge_id"])
            self.student()
            if action == "join":
                need(
                    not self.rows("projects", team_id=id),
                    "Team roster is locked after project submission",
                    409,
                )
                need(
                    not self.rows(
                        "memberships", user_id=uid, challenge_id=challenge["id"]
                    ),
                    "You already belong to a team for this challenge",
                    409,
                )
                need(
                    len(self.rows("memberships", team_id=id))
                    < challenge["max_members"],
                    "Team is full",
                    409,
                )
                return self.db.insert(
                    "memberships",
                    {"challenge_id": challenge["id"], "team_id": id, "user_id": uid},
                )
            if action == "leave":
                need(team["captain_id"] != uid, "Captains cannot leave their team", 409)
                need(
                    not self.rows("projects", team_id=id),
                    "Team roster is locked after project submission",
                    409,
                )
                memberships = self.rows("memberships", user_id=uid, team_id=id)
                need(bool(memberships), "Not a team member", 409)
                self.db.delete("memberships", memberships[0]["id"])
                return {"message": "Left team"}
            if action == "project":
                need(team["captain_id"] == uid, "Only the captain can submit")
                value = {
                    "title": text(data, "title", 3, 160),
                    "description": text(data, "description", 20, 6000),
                    "repo_url": url(data, "repo_url", True),
                    "demo_url": url(data, "demo_url"),
                    "score": -1,
                    "feedback": "",
                    "graded_by": "",
                }
                existing = self.rows("projects", team_id=id)
                need(
                    not existing or existing[0]["score"] < 0,
                    "Judged projects are locked",
                    409,
                )
                return (
                    self.db.update("projects", existing[0]["id"], value)
                    if existing
                    else self.db.insert(
                        "projects",
                        {"team_id": id, "challenge_id": challenge["id"], **value},
                    )
                )
        if root == "projects" and action == "grade" and method == "POST":
            project = self.get("projects", id)
            self.challenge_owner(project["challenge_id"])
            need(
                not self.rows("memberships", team_id=project["team_id"], user_id=uid),
                "You cannot judge your own team",
                403,
            )
            return self.db.update(
                "projects",
                id,
                {
                    "score": integer(data, "score", 0, 100),
                    "feedback": text(data, "feedback", 1, 3000),
                    "graded_by": uid,
                },
            )
        if root == "users" and id and method == "PATCH":
            need(self.user["role"] == "admin")
            target = self.get("users", id)
            role = choice(data, "role", ["student", "instructor", "admin"])
            active = data.get("active")
            need(type(active) == bool, "active must be true or false", 422)
            need(
                id != uid or (role == "admin" and active),
                "You cannot remove your own admin access",
                409,
            )
            # A role transition invalidates existing sessions and forces a fresh sign-in.
            updated = self.db.update("users", id, {"role": role, "active": active})
            for s in self.rows("sessions", user_id=id):
                self.db.delete("sessions", s["id"])
            return public(updated)
        raise ApiError(404, "Endpoint not found")

    def course_data(self, d):
        return {
            "title": text(d, "title", 3, 160),
            "description": text(d, "description", 20, 6000),
            "category": text(d, "category", 2, 80),
            "level": choice(d, "level", ["Beginner", "Intermediate", "Advanced"]),
            "color": choice(d, "color", ["violet", "mint", "peach", "blue"]),
            "status": choice(d, "status", ["draft", "published", "archived"]),
        }

    def content_data(self, table, d):
        if table == "lessons":
            return {
                "title": text(d, "title", 3, 160),
                "body": text(d, "body", 20, 20000),
                "resource_url": url(d, "resource_url"),
                "position": integer(d, "position", 1, 1000),
                "minutes": integer(d, "minutes", 1, 600),
            }
        if table == "assignments":
            return {
                "title": text(d, "title", 3, 160),
                "description": text(d, "description", 10, 10000),
                "due_at": date(d, "due_at"),
                "max_score": integer(d, "max_score", 1, 1000),
            }
        options = d.get("options")
        need(
            isinstance(options, list)
            and len(options) == 4
            and all(isinstance(o, str) and 1 <= len(o.strip()) <= 500 for o in options),
            "Provide four nonempty answer options",
            422,
        )
        return {
            "prompt": text(d, "prompt", 5, 2000),
            "options": [o.strip() for o in options],
            "correct": integer(d, "correct", 0, 3),
            "explanation": text(d, "explanation", 5, 3000),
        }

    def challenge_data(self, d):
        return {
            "title": text(d, "title", 3, 160),
            "description": text(d, "description", 20, 6000),
            "max_members": integer(d, "max_members", 1, 10),
            "deadline": date(d, "deadline"),
            "status": choice(d, "status", ["open", "closed"]),
        }
