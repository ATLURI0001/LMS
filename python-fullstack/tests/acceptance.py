"""Stack-neutral API acceptance suite. Requires DEMO_MODE=true and a disposable database.
Run: python tests/acceptance.py http://localhost:8000
No third-party Python dependencies. Creates uniquely named fixture users and courses.
"""

import json, sys, uuid, urllib.request, urllib.error, http.cookiejar
from concurrent.futures import ThreadPoolExecutor

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000").rstrip(
    "/"
) + "/api/"
PASSWORD = "AscentDemo!2026"
checks = 0


def check(condition, message):
    global checks
    checks += 1
    if not condition:
        raise AssertionError(message)


class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.http = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPCookieProcessor(self.jar),
        )

    def call(self, path, method="GET", data=None, expect=200, headers=None):
        request = urllib.request.Request(
            BASE + path,
            data=json.dumps(data).encode() if data is not None else None,
            method=method,
            headers={"Content-Type": "application/json", **(headers or {})},
        )
        try:
            response = self.http.open(request, timeout=25)
            status = response.status
            result = json.load(response)
        except urllib.error.HTTPError as e:
            status = e.code
            result = json.load(e)
        if expect is not None:
            check(
                status == expect,
                f"{method} {path}: expected {expect}, got {status}: {result}",
            )
        return result if expect is not None else (status, result)

    def login(self, role):
        return self.call(
            "auth/login",
            "POST",
            {"email": role + "@ascent.local", "password": PASSWORD},
        )["user"]

    def register(self, label):
        self.email = f"{label}-{uuid.uuid4().hex[:10]}@example.test"
        return self.call(
            "auth/register",
            "POST",
            {
                "email": self.email,
                "name": label + " Learner",
                "password": PASSWORD,
                "role": "admin",
            },
            201,
        )["user"]


anonymous = Client()
anonymous.call("health")
anonymous.call("state", expect=401)
anonymous.call(
    "auth/login",
    "POST",
    {"email": "student@ascent.local", "password": PASSWORD},
    415,
    {"Content-Type": "text/plain"},
)
anonymous.call("auth/login", "POST", {"padding": "x" * 65536}, 413)

anonymous.call(
    "auth/register", "POST", {"email": "bad", "name": "X", "password": "short"}, 422
)
admin = Client()
admin_user = admin.login("admin")
instructor = Client()
instructor.login("instructor")
student = Client()
u = student.register("Primary")
check(u["role"] == "student", "Registration cannot grant admin")
check("password_hash" not in u, "Password hashes must never be returned")
check(
    any(
        c._rest.get("HttpOnly") is not None or "HttpOnly" in c._rest
        for c in student.jar
    ),
    "HttpOnly session cookie missing",
)
peer = Client()
peer_user = peer.register("Peer")
outsider = Client()
out = outsider.register("Outsider")
mentor = Client()
mentor_user = mentor.register("OtherMentor")
admin.call(
    "users/" + mentor_user["id"], "PATCH", {"role": "instructor", "active": True}
)
mentor.call("state", expect=401)
mentor.call("auth/login", "POST", {"email": mentor.email, "password": PASSWORD})
student.call("courses", "POST", {}, 403)
student.call(
    "profile", "PATCH", {"name": "Ignored"}, 403, {"Origin": "https://evil.example"}
)
student.call("profile", "PATCH", {"name": "Primary Learner"})
student.call("users/" + out["id"], "PATCH", {"role": "admin", "active": True}, 403)
course = {
    "title": "Acceptance course",
    "description": "A complete end-to-end learning path created by the acceptance suite.",
    "category": "Testing",
    "level": "Beginner",
    "color": "mint",
    "status": "draft",
}
c = instructor.call("courses", "POST", course)
cid = c["id"]
check(
    all(r["id"] != cid for r in student.call("state")["courses"]), "Draft course leaked"
)
student.call(f"courses/{cid}/enroll", "POST", {}, 409)
mentor.call("courses/" + cid, "PATCH", course, 403)
lbody = {
    "title": "Learn transactions",
    "body": "Transactions keep a group of changes consistent and protect business invariants.",
    "resource_url": "https://example.com/lesson",
    "position": 1,
    "minutes": 10,
}
l = instructor.call(f"courses/{cid}/lessons", "POST", lbody)
instructor.call("lessons/" + l["id"], "PATCH", {**lbody, "minutes": 12})
instructor.call(
    f"courses/{cid}/lessons",
    "POST",
    {**lbody, "resource_url": "javascript:alert(1)"},
    422,
)
extra = instructor.call(f"courses/{cid}/lessons", "POST", {**lbody, "position": 2})
instructor.call("lessons/" + extra["id"], "DELETE", {})
qbody = {
    "prompt": "Where should permissions be checked?",
    "options": ["Browser only", "Server", "CSS", "README"],
    "correct": 1,
    "explanation": "The server owns the authorization decision.",
}
q = instructor.call(f"courses/{cid}/questions", "POST", qbody)
extra = instructor.call(f"courses/{cid}/questions", "POST", qbody)
instructor.call("questions/" + extra["id"], "DELETE", {})
instructor.call("questions/" + q["id"], "PATCH", qbody)
a = instructor.call(
    f"courses/{cid}/assignments",
    "POST",
    {
        "title": "Build a tiny API",
        "description": "Submit a complete API with server validation.",
        "due_at": "2099-12-31T23:00:00Z",
        "max_score": 100,
    },
)
instructor.call("courses/" + cid, "PATCH", {**course, "status": "published"})
student.call("lessons/" + l["id"] + "/complete", "POST", {}, 403)
student.call(f"courses/{cid}/quiz", "POST", {"answers": {q["id"]: 1}}, 403)
student.call(f"courses/{cid}/enroll", "POST", {})
student.call(f"courses/{cid}/enroll", "POST", {}, 409)
instructor.call(f"courses/{cid}/lessons", "POST", lbody, 409)
instructor.call("questions/" + q["id"], "DELETE", {}, 409)
state = student.call("state")
check(
    all("correct" not in q and "explanation" not in q for q in state["questions"]),
    "Quiz answer leakage",
)
check(
    all("password_hash" not in u for u in state["users"]),
    "Private hash leaked in state",
)
check(
    all("email" not in r for r in state["users"] if r["id"] != u["id"]),
    "Other user email leaked",
)
outsider_state = outsider.call("state")
check(
    "body" not in next(x for x in outsider_state["lessons"] if x["id"] == l["id"]),
    "Lesson body leaked before enrollment",
)
student.call(f"courses/{cid}/certificate", "POST", {}, 409)
r = student.call("lessons/" + l["id"] + "/complete", "POST", {})
r2 = student.call("lessons/" + l["id"] + "/complete", "POST", {})
check(r["id"] == r2["id"], "Completion must be idempotent")
student.call(f"courses/{cid}/quiz", "POST", {"answers": {}}, 422)
student.call(f"courses/{cid}/quiz", "POST", {"answers": {q["id"]: True}}, 422)
failed = student.call(
    f"courses/{cid}/quiz", "POST", {"answers": {q["id"]: 0}, "score": 100}
)
check(failed["attempt"]["score"] == 0, "Client cannot forge quiz score")
student.call(f"courses/{cid}/certificate", "POST", {}, 409)
passed = student.call(f"courses/{cid}/quiz", "POST", {"answers": {q["id"]: 1}})
check(passed["attempt"]["score"] == 100, "Quiz must score correct answers")
student.call(f"courses/{cid}/certificate", "POST", {}, 409)
submission = student.call(
    "assignments/" + a["id"] + "/submit",
    "POST",
    {
        "body": "Implemented authorization and validated every input.",
        "url": "https://example.com/project",
    },
)
student.call(
    "submissions/" + submission["id"] + "/grade",
    "POST",
    {"score": 100, "feedback": "Self grading"},
    403,
)
mentor.call(
    "submissions/" + submission["id"] + "/grade",
    "POST",
    {"score": 100, "feedback": "Cross-owner grading"},
    403,
)
instructor.call(
    "submissions/" + submission["id"] + "/grade",
    "POST",
    {"score": 101, "feedback": "Invalid grade"},
    422,
)
instructor.call(
    "submissions/" + submission["id"] + "/grade",
    "POST",
    {"score": 90, "feedback": "Clear validation and a working implementation."},
)
student.call(
    "assignments/" + a["id"] + "/submit",
    "POST",
    {"body": "Attempting to replace graded work.", "url": ""},
    409,
)
cert = student.call(f"courses/{cid}/certificate", "POST", {})
check(
    cert["id"] == student.call(f"courses/{cid}/certificate", "POST", {})["id"],
    "Certificate must be idempotent",
)
check(cert["learner_name"] == u["name"], "Certificate identifies the learner")
post = student.call(
    f"courses/{cid}/discussions",
    "POST",
    {"body": "How do we handle a transaction conflict?"},
)
outsider.call(
    f"courses/{cid}/discussions", "POST", {"body": "Unauthorized comment"}, 403
)
peer.call("discussions/" + post["id"], "DELETE", {}, 403)
instructor.call("discussions/" + post["id"], "DELETE", {})
announcement = instructor.call(
    "announcements",
    "POST",
    {
        "course_id": cid,
        "title": "Lab review",
        "body": "The lab review will cover transaction boundaries.",
    },
)
check(
    any(x["id"] == announcement["id"] for x in student.call("state")["announcements"]),
    "Course announcement missing",
)
instructor.call(
    "announcements",
    "POST",
    {
        "course_id": "",
        "title": "No global access",
        "body": "Instructors cannot broadcast globally.",
    },
    403,
)
instructor.call("announcements/" + announcement["id"], "DELETE", {})
challenge_body = {
    "title": "Acceptance challenge",
    "description": "Build a complete project and explain your architecture to the judges.",
    "max_members": 2,
    "deadline": "2099-12-31T23:00:00Z",
    "status": "open",
}
challenge = instructor.call("challenges", "POST", challenge_body)
hid = challenge["id"]
team = student.call(f"challenges/{hid}/teams", "POST", {"name": "Atomic Builders"})
tid = team["id"]
student.call(f"challenges/{hid}/teams", "POST", {"name": "Duplicate team"}, 409)
# Two students race for one remaining seat: database transaction protects capacity.
with ThreadPoolExecutor(max_workers=2) as pool:
    statuses = list(
        pool.map(
            lambda client: client.call(f"teams/{tid}/join", "POST", {}, expect=None)[0],
            [peer, outsider],
        )
    )
check(sorted(statuses) == [200, 409], f"Team capacity race: {statuses}")
joined = peer if statuses[0] == 200 else outsider
other = outsider if statuses[0] == 200 else peer
student.call(f"teams/{tid}/leave", "POST", {}, 409)
joined.call(f"teams/{tid}/project", "POST", {}, 403)
project = student.call(
    f"teams/{tid}/project",
    "POST",
    {
        "title": "Campus help desk",
        "description": "A searchable campus help desk backed by a documented API and persistent records.",
        "repo_url": "https://github.com/example/project",
        "demo_url": "",
    },
)
joined.call(f"teams/{tid}/leave", "POST", {}, 409)
other.call(f"teams/{tid}/join", "POST", {}, 409)
mentor.call(
    "projects/" + project["id"] + "/grade",
    "POST",
    {"score": 100, "feedback": "Unauthorized judge"},
    403,
)
instructor.call(
    "projects/" + project["id"] + "/grade",
    "POST",
    {"score": 85, "feedback": "A strong vertical slice and a clear demo."},
)
student.call(
    f"teams/{tid}/project",
    "POST",
    {
        "title": "Change judged work",
        "description": "An update after judging is locked by the server.",
        "repo_url": "https://example.com/repo",
        "demo_url": "",
    },
    409,
)
board = student.call("state")["leaderboard"]
score = next(x["points"] for x in board if x["id"] == u["id"])
check(score == 195, f"Expected 10 lesson + 100 best quiz + 85 project, got {score}")
instructor.call("challenges/" + hid, "PATCH", {**challenge_body, "status": "closed"})
other.call(f"challenges/{hid}/teams", "POST", {"name": "Too late"}, 409)
admin.call("users/" + out["id"], "PATCH", {"role": "student", "active": False})
outsider.call("state", expect=401)
outsider.call(
    "auth/login", "POST", {"email": outsider.email, "password": PASSWORD}, 401
)
admin.call(
    "users/" + admin_user["id"], "PATCH", {"role": "student", "active": False}, 409
)
# Concurrent duplicate enrollment must produce a single durable row.
with ThreadPoolExecutor(max_workers=2) as pool:
    statuses = list(
        pool.map(
            lambda _: peer.call(f"courses/{cid}/enroll", "POST", {}, expect=None)[0],
            [1, 2],
        )
    )
check(sorted(statuses) == [200, 409], f"Enrollment race: {statuses}")
student.call(
    "auth/password",
    "POST",
    {"current": "IncorrectPassword", "password": "NewPassword!2026"},
    400,
)
student.call(
    "auth/password", "POST", {"current": PASSWORD, "password": "NewPassword!2026"}
)
student.call("state", expect=401)
student.call("auth/login", "POST", {"email": student.email, "password": PASSWORD}, 401)
student.call(
    "auth/login", "POST", {"email": student.email, "password": "NewPassword!2026"}
)
student.call("auth/logout", "POST", {})
student.call("state", expect=401)
# Password whitespace is significant and must round-trip without trimming.
padded = Client()
padded_email = f"padded-{uuid.uuid4().hex[:10]}@example.test"
padded.call(
    "auth/register",
    "POST",
    {
        "name": "Padded Password",
        "email": padded_email,
        "password": "  valid password 2026  ",
    },
    201,
)
padded.call("auth/logout", "POST", {})
padded.call(
    "auth/login", "POST", {"email": padded_email, "password": "  valid password 2026  "}
)
padded.call(
    "auth/password",
    "POST",
    {"current": "  valid password 2026  ", "password": "AnotherPassword!2026"},
)
# Past deadlines are enforced even when status is open.
expired = instructor.call(
    "challenges", "POST", {**challenge_body, "deadline": "2000-01-01T00:00:00Z"}
)
peer.call("challenges/" + expired["id"] + "/teams", "POST", {"name": "Late Team"}, 409)
admin.call("users/" + out["id"], "PATCH", {"role": "student", "active": "true"}, 422)
print(
    json.dumps(
        {
            "result": "PASS",
            "checks": checks,
            "base_url": BASE,
            "coverage": [
                "authentication",
                "roles",
                "course lifecycle",
                "curriculum lock",
                "content visibility",
                "quiz integrity",
                "assignment grading",
                "certificates",
                "discussion",
                "announcements",
                "teams",
                "concurrency",
                "project judging",
                "leaderboard",
                "session revocation",
                "CSRF origin validation",
                "JSON media type validation",
                "64 KiB request limit",
            ],
        },
        indent=2,
    )
)
