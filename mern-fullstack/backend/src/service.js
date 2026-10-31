import { now } from "./database.js";
import { hashPassword, verifyPassword } from "./security.js";
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function need(value, message = "Forbidden", status = 403) {
  if (!value) throw new ApiError(status, message);
}
export function text(d, k, min = 1, max = 200) {
  need(
    typeof d[k] === "string" || d[k] === undefined,
    `${k} must be text`,
    422,
  );
  const v = (d[k] ?? "").trim();
  need(
    v.length >= min && v.length <= max,
    `${k} must be ${min}–${max} characters`,
    422,
  );
  return v;
}
export function integer(d, k, min, max) {
  const v = d[k];
  need(
    Number.isInteger(v) && v >= min && v <= max,
    `${k} must be an integer from ${min} to ${max}`,
    422,
  );
  return v;
}
export function choice(d, k, values) {
  const v = text(d, k);
  need(values.includes(v), `Invalid ${k}`, 422);
  return v;
}
export function url(d, k, required = false) {
  const v = text(d, k, required ? 1 : 0, 2000);
  if (v) {
    let u;
    try {
      u = new URL(v);
    } catch {
      throw new ApiError(422, `${k} must be an HTTP(S) URL`);
    }
    need(
      ["http:", "https:"].includes(u.protocol) &&
        u.hostname &&
        !u.username &&
        !u.password,
      `${k} must be an HTTP(S) URL`,
      422,
    );
  }
  return v;
}
export function date(d, k) {
  const v = text(d, k, 1, 40);
  need(
    /(Z|[+-]\d\d:\d\d)$/.test(v) && Number.isFinite(Date.parse(v)),
    `Invalid ${k}; include a timezone`,
    422,
  );
  return new Date(v).toISOString().replace(/\.\d{3}Z$/, "Z");
}
export function password(d, k = "password") {
  const v = d[k];
  need(
    typeof v === "string" && v.length >= 12 && v.length <= 128,
    "Password must be 12–128 characters",
    422,
  );
  return v;
}
export const publicUser = ({ password_hash, ...user }) => user;
export class Service {
  constructor(db, user = null) {
    this.db = db;
    this.user = user;
  }
  rows(table, query = {}) {
    return this.db
      .all(table)
      .filter((r) => Object.entries(query).every(([k, v]) => r[k] === v));
  }
  get(table, id) {
    const row = this.db.get(table, id);
    need(row, "Not found", 404);
    return row;
  }
  staff() {
    return ["admin", "instructor"].includes(this.user.role);
  }
  manages(c) {
    return (
      this.user.role === "admin" ||
      (this.user.role === "instructor" && c.owner_id === this.user.id)
    );
  }
  manageCourse(id) {
    const c = this.get("courses", id);
    need(this.manages(c));
    return c;
  }
  enrolled(id) {
    const c = this.get("courses", id);
    need(
      this.manages(c) ||
        this.rows("enrollments", { course_id: id, user_id: this.user.id })
          .length,
      "Enroll in this course first",
    );
    return c;
  }
  student() {
    need(
      this.user.role === "student",
      "This action requires a student account",
    );
  }
  openChallenge(id) {
    const c = this.get("challenges", id);
    need(
      c.status === "open" && c.deadline > now(),
      "This challenge is closed",
      409,
    );
    return c;
  }
  challengeOwner(id) {
    const c = this.get("challenges", id);
    need(
      this.user.role === "admin" ||
        (this.user.role === "instructor" && c.owner_id === this.user.id),
    );
    return c;
  }
  curriculum(id) {
    this.manageCourse(id);
    need(
      !this.rows("enrollments", { course_id: id }).length,
      "Curriculum is locked after the first enrollment. Create a new course version.",
      409,
    );
  }
  state() {
    const uid = this.user.id,
      all = this.db.all("courses");
    const owned = new Set(all.filter((c) => this.manages(c)).map((c) => c.id));
    const enrolled = new Set(
      this.rows("enrollments", { user_id: uid }).map((e) => e.course_id),
    );
    const accessible = new Set([...owned, ...enrolled]);
    const visible = new Set(
      all
        .filter((c) => c.status === "published" || accessible.has(c.id))
        .map((c) => c.id),
    );
    const data = {
      user: publicUser(this.user),
      courses: all.filter((c) => visible.has(c.id)),
    };
    data.users = this.db
      .all("users")
      .map((u) =>
        this.user.role === "admin" || u.id === uid
          ? publicUser(u)
          : { id: u.id, name: u.name, role: u.role },
      );
    data.lessons = this.db
      .all("lessons")
      .filter((l) => visible.has(l.course_id))
      .map((l) => {
        if (accessible.has(l.course_id)) return l;
        const { body, resource_url, ...rest } = l;
        return rest;
      });
    data.questions = this.db
      .all("questions")
      .filter((q) => accessible.has(q.course_id))
      .map((q) => {
        if (owned.has(q.course_id)) return q;
        const { correct, explanation, ...rest } = q;
        return rest;
      });
    for (const t of ["assignments", "discussions", "announcements"])
      data[t] = this.db
        .all(t)
        .filter(
          (r) =>
            accessible.has(r.course_id) ||
            (t === "announcements" && !r.course_id),
        );
    for (const t of ["enrollments", "completions", "attempts", "submissions"])
      data[t] = this.db
        .all(t)
        .filter((r) => r.user_id === uid || owned.has(r.course_id));
    data.certificates = this.rows("certificates", { user_id: uid });
    for (const t of ["challenges", "teams", "memberships", "projects"])
      data[t] = this.db.all(t);
    data.leaderboard = this.db
      .all("users")
      .filter((u) => u.role === "student" && u.active)
      .map((u) => {
        const best = {};
        for (const a of this.rows("attempts", { user_id: u.id }))
          best[a.course_id] = Math.max(best[a.course_id] || 0, a.score);
        const teams = new Set(
          this.rows("memberships", { user_id: u.id }).map((m) => m.team_id),
        );
        return {
          id: u.id,
          name: u.name,
          points:
            this.rows("completions", { user_id: u.id }).length * 10 +
            Object.values(best).reduce((a, b) => a + b, 0) +
            this.db
              .all("projects")
              .filter((p) => teams.has(p.team_id))
              .reduce((s, p) => s + Math.max(0, p.score), 0),
        };
      })
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
    return data;
  }
  dispatch(method, path, d) {
    const [root, id = "", action = ""] = path.split("/"),
      uid = this.user.id,
      db = this.db;
    if (method === "GET" && path === "state") return this.state();
    if (method === "PATCH" && path === "profile")
      return publicUser(
        db.update("users", uid, { name: text(d, "name", 2, 80) }),
      );
    if (method === "POST" && path === "auth/password") {
      need(
        typeof d.current === "string" &&
          d.current.length <= 128 &&
          verifyPassword(d.current, this.user.password_hash),
        "Current password is incorrect",
        400,
      );
      db.update("users", uid, { password_hash: hashPassword(password(d)) });
      for (const s of this.rows("sessions", { user_id: uid }))
        db.delete("sessions", s.id);
      return { message: "Password changed. Sign in again." };
    }
    if (root === "courses") {
      if (method === "POST" && !id) {
        need(this.staff());
        return db.insert("courses", { owner_id: uid, ...this.courseData(d) });
      }
      if (method === "PATCH" && id && !action) {
        this.manageCourse(id);
        return db.update("courses", id, this.courseData(d));
      }
      if (method === "POST" && action === "enroll") {
        this.student();
        const c = this.get("courses", id);
        need(
          c.status === "published",
          "Course is not open for enrollment",
          409,
        );
        need(
          !this.rows("enrollments", { user_id: uid, course_id: id }).length,
          "Already enrolled",
          409,
        );
        return db.insert("enrollments", { course_id: id, user_id: uid });
      }
      if (
        method === "POST" &&
        ["lessons", "questions", "assignments"].includes(action)
      ) {
        this.curriculum(id);
        return db.insert(action, {
          course_id: id,
          ...this.contentData(action, d),
        });
      }
      if (method === "POST" && action === "quiz") {
        this.student();
        this.enrolled(id);
        const qs = this.rows("questions", { course_id: id });
        need(qs.length, "No quiz available", 409);
        const answers = d.answers;
        need(
          answers &&
            typeof answers === "object" &&
            !Array.isArray(answers) &&
            Object.keys(answers).length === qs.length &&
            qs.every((q) => Object.hasOwn(answers, q.id)),
          "Answer every quiz question",
          422,
        );
        let correct = 0;
        for (const q of qs) {
          const v = answers[q.id];
          need(
            Number.isInteger(v) && v >= 0 && v < q.options.length,
            "Invalid answer",
            422,
          );
          if (v === q.correct) correct++;
        }
        const attempt = db.insert("attempts", {
          course_id: id,
          user_id: uid,
          answers,
          score: Math.round((correct * 100) / qs.length),
        });
        return {
          attempt,
          review: qs.map((q) => ({
            id: q.id,
            correct: q.correct,
            explanation: q.explanation,
          })),
        };
      }
      if (method === "POST" && action === "discussions") {
        this.enrolled(id);
        return db.insert("discussions", {
          course_id: id,
          user_id: uid,
          body: text(d, "body", 1, 3000),
        });
      }
      if (method === "POST" && action === "certificate") {
        this.student();
        const c = this.enrolled(id),
          ls = this.rows("lessons", { course_id: id }),
          done = new Set(
            this.rows("completions", { course_id: id, user_id: uid }).map(
              (r) => r.lesson_id,
            ),
          );
        need(
          ls.length && ls.every((l) => done.has(l.id)),
          "Complete every lesson first",
          409,
        );
        need(
          !this.rows("questions", { course_id: id }).length ||
            this.rows("attempts", { course_id: id, user_id: uid }).some(
              (a) => a.score >= 70,
            ),
          "Pass the quiz with at least 70%",
          409,
        );
        for (const a of this.rows("assignments", { course_id: id })) {
          const s = this.rows("submissions", {
            assignment_id: a.id,
            user_id: uid,
          })[0];
          need(
            s && s.score >= 0 && s.score * 100 >= a.max_score * 50,
            "Pass every assignment with at least 50%",
            409,
          );
        }
        return (
          this.rows("certificates", { course_id: id, user_id: uid })[0] ||
          db.insert("certificates", {
            course_id: id,
            user_id: uid,
            course_title: c.title,
            learner_name: this.user.name,
          })
        );
      }
    }
    if (["lessons", "questions", "assignments"].includes(root) && id) {
      const r = this.get(root, id);
      if (root === "lessons" && method === "POST" && action === "complete") {
        this.student();
        this.enrolled(r.course_id);
        return (
          this.rows("completions", { user_id: uid, lesson_id: id })[0] ||
          db.insert("completions", {
            user_id: uid,
            lesson_id: id,
            course_id: r.course_id,
          })
        );
      }
      if (root === "assignments" && method === "POST" && action === "submit") {
        this.student();
        this.enrolled(r.course_id);
        need(r.due_at > now(), "The assignment deadline has passed", 409);
        const value = {
            body: text(d, "body", 10, 10000),
            url: url(d, "url"),
            score: -1,
            feedback: "",
            graded_by: "",
          },
          found = this.rows("submissions", {
            user_id: uid,
            assignment_id: id,
          })[0];
        need(!found || found.score < 0, "Graded submissions are locked", 409);
        return found
          ? db.update("submissions", found.id, value)
          : db.insert("submissions", {
              user_id: uid,
              assignment_id: id,
              course_id: r.course_id,
              ...value,
            });
      }
      if (!action && ["PATCH", "DELETE"].includes(method)) {
        this.curriculum(r.course_id);
        if (method === "DELETE") {
          db.delete(root, id);
          return { message: "Deleted" };
        }
        return db.update(root, id, this.contentData(root, d));
      }
    }
    if (root === "submissions" && action === "grade" && method === "POST") {
      const s = this.get("submissions", id);
      this.manageCourse(s.course_id);
      const a = this.get("assignments", s.assignment_id);
      return db.update("submissions", id, {
        score: integer(d, "score", 0, a.max_score),
        feedback: text(d, "feedback", 1, 3000),
        graded_by: uid,
      });
    }
    if (root === "discussions" && id && method === "DELETE") {
      const r = this.get("discussions", id);
      need(r.user_id === uid || this.manages(this.get("courses", r.course_id)));
      db.delete("discussions", id);
      return { message: "Deleted" };
    }
    if (root === "announcements" && method === "POST" && !id) {
      need(this.staff());
      const cid = text(d, "course_id", 0, 100);
      if (cid) this.manageCourse(cid);
      else
        need(
          this.user.role === "admin",
          "Only admins can post campus-wide announcements",
        );
      return db.insert("announcements", {
        course_id: cid,
        author_id: uid,
        title: text(d, "title", 3, 160),
        body: text(d, "body", 5, 5000),
      });
    }
    if (root === "announcements" && id && method === "DELETE") {
      const r = this.get("announcements", id);
      need(this.user.role === "admin" || r.author_id === uid);
      db.delete("announcements", id);
      return { message: "Deleted" };
    }
    if (root === "challenges") {
      if (method === "POST" && !id) {
        need(this.staff());
        return db.insert("challenges", {
          owner_id: uid,
          ...this.challengeData(d),
        });
      }
      if (method === "PATCH" && id && !action) {
        this.challengeOwner(id);
        const value = this.challengeData(d);
        need(
          this.rows("teams", { challenge_id: id }).every(
            (t) =>
              this.rows("memberships", { team_id: t.id }).length <=
              value.max_members,
          ),
          "Team limit is below an existing team size",
          409,
        );
        return db.update("challenges", id, value);
      }
      if (method === "POST" && action === "teams") {
        this.student();
        this.openChallenge(id);
        need(
          !this.rows("memberships", { challenge_id: id, user_id: uid }).length,
          "You already joined a team for this challenge",
          409,
        );
        const t = db.insert("teams", {
          challenge_id: id,
          captain_id: uid,
          name: text(d, "name", 2, 80),
        });
        db.insert("memberships", {
          challenge_id: id,
          team_id: t.id,
          user_id: uid,
        });
        return t;
      }
    }
    if (root === "teams" && id && method === "POST") {
      const t = this.get("teams", id),
        c = this.openChallenge(t.challenge_id);
      this.student();
      if (action === "join") {
        need(
          !this.rows("projects", { team_id: id }).length,
          "Team roster is locked after project submission",
          409,
        );
        need(
          !this.rows("memberships", { user_id: uid, challenge_id: c.id })
            .length,
          "You already belong to a team for this challenge",
          409,
        );
        need(
          this.rows("memberships", { team_id: id }).length < c.max_members,
          "Team is full",
          409,
        );
        return db.insert("memberships", {
          challenge_id: c.id,
          team_id: id,
          user_id: uid,
        });
      }
      if (action === "leave") {
        need(t.captain_id !== uid, "Captains cannot leave their team", 409);
        need(
          !this.rows("projects", { team_id: id }).length,
          "Team roster is locked after project submission",
          409,
        );
        const m = this.rows("memberships", { user_id: uid, team_id: id })[0];
        need(m, "Not a team member", 409);
        db.delete("memberships", m.id);
        return { message: "Left team" };
      }
      if (action === "project") {
        need(t.captain_id === uid, "Only the captain can submit");
        const value = {
            title: text(d, "title", 3, 160),
            description: text(d, "description", 20, 6000),
            repo_url: url(d, "repo_url", true),
            demo_url: url(d, "demo_url"),
            score: -1,
            feedback: "",
            graded_by: "",
          },
          p = this.rows("projects", { team_id: id })[0];
        need(!p || p.score < 0, "Judged projects are locked", 409);
        return p
          ? db.update("projects", p.id, value)
          : db.insert("projects", {
              team_id: id,
              challenge_id: c.id,
              ...value,
            });
      }
    }
    if (root === "projects" && action === "grade" && method === "POST") {
      const p = this.get("projects", id);
      this.challengeOwner(p.challenge_id);
      need(
        !this.rows("memberships", { team_id: p.team_id, user_id: uid }).length,
        "You cannot judge your own team",
      );
      return db.update("projects", id, {
        score: integer(d, "score", 0, 100),
        feedback: text(d, "feedback", 1, 3000),
        graded_by: uid,
      });
    }
    if (root === "users" && id && method === "PATCH") {
      need(this.user.role === "admin");
      this.get("users", id);
      const role = choice(d, "role", ["student", "instructor", "admin"]),
        active = d.active;
      need(typeof active === "boolean", "active must be true or false", 422);
      need(
        id !== uid || (role === "admin" && active),
        "You cannot remove your own admin access",
        409,
      );
      const u = db.update("users", id, { role, active });
      for (const s of this.rows("sessions", { user_id: id }))
        db.delete("sessions", s.id);
      return publicUser(u);
    }
    throw new ApiError(404, "Endpoint not found");
  }
  courseData(d) {
    return {
      title: text(d, "title", 3, 160),
      description: text(d, "description", 20, 6000),
      category: text(d, "category", 2, 80),
      level: choice(d, "level", ["Beginner", "Intermediate", "Advanced"]),
      color: choice(d, "color", ["violet", "mint", "peach", "blue"]),
      status: choice(d, "status", ["draft", "published", "archived"]),
    };
  }
  contentData(t, d) {
    if (t === "lessons")
      return {
        title: text(d, "title", 3, 160),
        body: text(d, "body", 20, 20000),
        resource_url: url(d, "resource_url"),
        position: integer(d, "position", 1, 1000),
        minutes: integer(d, "minutes", 1, 600),
      };
    if (t === "assignments")
      return {
        title: text(d, "title", 3, 160),
        description: text(d, "description", 10, 10000),
        due_at: date(d, "due_at"),
        max_score: integer(d, "max_score", 1, 1000),
      };
    need(
      Array.isArray(d.options) &&
        d.options.length === 4 &&
        d.options.every(
          (o) =>
            typeof o === "string" &&
            o.trim().length >= 1 &&
            o.trim().length <= 500,
        ),
      "Provide four nonempty answer options",
      422,
    );
    return {
      prompt: text(d, "prompt", 5, 2000),
      options: d.options.map((o) => o.trim()),
      correct: integer(d, "correct", 0, 3),
      explanation: text(d, "explanation", 5, 3000),
    };
  }
  challengeData(d) {
    return {
      title: text(d, "title", 3, 160),
      description: text(d, "description", 20, 6000),
      max_members: integer(d, "max_members", 1, 10),
      deadline: date(d, "deadline"),
      status: choice(d, "status", ["open", "closed"]),
    };
  }
}
