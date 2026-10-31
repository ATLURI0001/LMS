package dev.ascent;

import static dev.ascent.Validation.*;

import java.util.*;
import java.util.stream.Collectors;

/** Domain layer: authorization and learning rules are always checked on the server. */
public class LmsService {

  private final Store db;
  public Map<String, Object> user;

  public LmsService(Store db, Map<String, Object> user) {
    this.db = db;
    this.user = user;
  }

  public List<Map<String, Object>> rows(String t, Map<String, Object> q) {
    return db
      .all(t)
      .stream()
      .filter(r ->
        q
          .entrySet()
          .stream()
          .allMatch(e -> Objects.equals(r.get(e.getKey()), e.getValue()))
      )
      .toList();
  }

  public Map<String, Object> get(String t, String id) {
    var r = db.get(t, id);
    need(r != null, "Not found", 404);
    return r;
  }

  private boolean staff() {
    return Set.of("admin", "instructor").contains(s(user, "role"));
  }

  private boolean manages(Map<String, Object> c) {
    return (
      s(user, "role").equals("admin") ||
      (s(user, "role").equals("instructor") &&
        s(c, "owner_id").equals(s(user, "id")))
    );
  }

  private Map<String, Object> manageCourse(String id) {
    var c = get("courses", id);
    need(manages(c));
    return c;
  }

  private Map<String, Object> enrolled(String id) {
    var c = get("courses", id);
    need(
      manages(c) ||
        !rows(
          "enrollments",
          m("course_id", id, "user_id", s(user, "id"))
        ).isEmpty(),
      "Enroll in this course first",
      403
    );
    return c;
  }

  private void student() {
    need(
      s(user, "role").equals("student"),
      "This action requires a student account",
      403
    );
  }

  private Map<String, Object> openChallenge(String id) {
    var c = get("challenges", id);
    need(
      s(c, "status").equals("open") && s(c, "deadline").compareTo(now()) > 0,
      "This challenge is closed",
      409
    );
    return c;
  }

  private Map<String, Object> challengeOwner(String id) {
    var c = get("challenges", id);
    need(
      s(user, "role").equals("admin") ||
        (s(user, "role").equals("instructor") &&
          s(c, "owner_id").equals(s(user, "id")))
    );
    return c;
  }

  private void curriculum(String id) {
    manageCourse(id);
    need(
      rows("enrollments", m("course_id", id)).isEmpty(),
      "Curriculum is locked after the first enrollment. Create a new course version.",
      409
    );
  }

  public Map<String, Object> state() {
    String uid = s(user, "id");
    var all = db.all("courses");
    Set<String> owned = all
      .stream()
      .filter(this::manages)
      .map(c -> s(c, "id"))
      .collect(Collectors.toSet());
    Set<String> access = rows("enrollments", m("user_id", uid))
      .stream()
      .map(e -> s(e, "course_id"))
      .collect(Collectors.toSet());
    access.addAll(owned);
    Set<String> visible = all
      .stream()
      .filter(
        c -> s(c, "status").equals("published") || access.contains(s(c, "id"))
      )
      .map(c -> s(c, "id"))
      .collect(Collectors.toSet());
    var out = m(
      "user",
      publicUser(user),
      "courses",
      all
        .stream()
        .filter(c -> visible.contains(s(c, "id")))
        .toList()
    );
    out.put(
      "users",
      db
        .all("users")
        .stream()
        .map(u ->
          s(user, "role").equals("admin") || s(u, "id").equals(uid)
            ? publicUser(u)
            : m("id", u.get("id"), "name", u.get("name"), "role", u.get("role"))
        )
        .toList()
    );
    out.put(
      "lessons",
      db
        .all("lessons")
        .stream()
        .filter(l -> visible.contains(s(l, "course_id")))
        .map(l -> {
          var r = new LinkedHashMap<>(l);
          if (!access.contains(s(l, "course_id"))) {
            r.remove("body");
            r.remove("resource_url");
          }
          return r;
        })
        .toList()
    );
    out.put(
      "questions",
      db
        .all("questions")
        .stream()
        .filter(q -> access.contains(s(q, "course_id")))
        .map(q -> {
          var r = new LinkedHashMap<>(q);
          if (!owned.contains(s(q, "course_id"))) {
            r.remove("correct");
            r.remove("explanation");
          }
          return r;
        })
        .toList()
    );
    for (String t : List.of("assignments", "discussions", "announcements"))
      out.put(
        t,
        db
          .all(t)
          .stream()
          .filter(
            r ->
              access.contains(s(r, "course_id")) ||
              (t.equals("announcements") && s(r, "course_id").isEmpty())
          )
          .toList()
      );
    for (String t : List.of(
      "enrollments",
      "completions",
      "attempts",
      "submissions"
    ))
      out.put(
        t,
        db
          .all(t)
          .stream()
          .filter(
            r ->
              s(r, "user_id").equals(uid) || owned.contains(s(r, "course_id"))
          )
          .toList()
      );
    out.put("certificates", rows("certificates", m("user_id", uid)));
    for (String t : List.of("challenges", "teams", "memberships", "projects"))
      out.put(t, db.all(t));
    List<Map<String, Object>> leaderboard = new ArrayList<>();
    for (var u : db.all("users"))
      if (
        s(u, "role").equals("student") && Boolean.TRUE.equals(u.get("active"))
      ) {
        Map<String, Integer> best = new HashMap<>();
        for (var a : rows("attempts", m("user_id", u.get("id"))))
          best.merge(s(a, "course_id"), n(a, "score"), Math::max);
        Set<String> teams = rows("memberships", m("user_id", u.get("id")))
          .stream()
          .map(r -> s(r, "team_id"))
          .collect(Collectors.toSet());
        int points =
          rows("completions", m("user_id", u.get("id"))).size() * 10 +
          best.values().stream().mapToInt(Integer::intValue).sum() +
          db
            .all("projects")
            .stream()
            .filter(p -> teams.contains(s(p, "team_id")))
            .mapToInt(p -> Math.max(0, n(p, "score")))
            .sum();
        leaderboard.add(
          m("id", u.get("id"), "name", u.get("name"), "points", points)
        );
      }
    leaderboard.sort(
      Comparator.<Map<String, Object>>comparingInt(
        r -> -n(r, "points")
      ).thenComparing(r -> s(r, "name"))
    );
    out.put("leaderboard", leaderboard);
    return out;
  }

  public Object dispatch(String method, String path, Map<String, Object> d) {
    String[] parts = path.split("/");
    String root = parts[0],
      id = parts.length > 1 ? parts[1] : "",
      action = parts.length > 2 ? parts[2] : "",
      uid = s(user, "id");
    if (method.equals("GET") && path.equals("state")) return state();
    if (method.equals("PATCH") && path.equals("profile")) return publicUser(
      db.update("users", uid, m("name", text(d, "name", 2, 80)))
    );
    if (method.equals("POST") && path.equals("auth/password")) {
      need(
        d.get("current") instanceof String &&
          s(d, "current").length() <= 128 &&
          Security.verify(s(d, "current"), s(user, "password_hash")),
        "Current password is incorrect",
        400
      );
      db.update(
        "users",
        uid,
        m("password_hash", Security.hashPassword(password(d)))
      );
      for (var session : rows("sessions", m("user_id", uid)))
        db.delete("sessions", s(session, "id"));
      return m("message", "Password changed. Sign in again.");
    }
    if (root.equals("courses")) {
      if (method.equals("POST") && id.isEmpty()) {
        need(staff());
        var v = courseData(d);
        v.put("owner_id", uid);
        return db.insert("courses", v);
      }
      if (method.equals("PATCH") && !id.isEmpty() && action.isEmpty()) {
        manageCourse(id);
        return db.update("courses", id, courseData(d));
      }
      if (method.equals("POST") && action.equals("enroll")) {
        student();
        var c = get("courses", id);
        need(
          s(c, "status").equals("published"),
          "Course is not open for enrollment",
          409
        );
        need(
          rows("enrollments", m("user_id", uid, "course_id", id)).isEmpty(),
          "Already enrolled",
          409
        );
        return db.insert("enrollments", m("course_id", id, "user_id", uid));
      }
      if (
        method.equals("POST") &&
        Set.of("lessons", "questions", "assignments").contains(action)
      ) {
        curriculum(id);
        var v = contentData(action, d);
        v.put("course_id", id);
        return db.insert(action, v);
      }
      if (method.equals("POST") && action.equals("quiz")) {
        student();
        enrolled(id);
        var qs = rows("questions", m("course_id", id));
        need(!qs.isEmpty(), "No quiz available", 409);
        need(
          d.get("answers") instanceof Map,
          "Answer every quiz question",
          422
        );
        Map<?, ?> answers = (Map<?, ?>) d.get("answers");
        need(
          answers.size() == qs.size() &&
            qs.stream().allMatch(q -> answers.containsKey(q.get("id"))),
          "Answer every quiz question",
          422
        );
        int correct = 0;
        for (var q : qs) {
          Object v = answers.get(q.get("id"));
          need(
            v instanceof Integer &&
              (Integer) v >= 0 &&
              (Integer) v < ((List<?>) q.get("options")).size(),
            "Invalid answer",
            422
          );
          if ((Integer) v == n(q, "correct")) correct++;
        }
        var attempt = db.insert(
          "attempts",
          m(
            "course_id",
            id,
            "user_id",
            uid,
            "answers",
            answers,
            "score",
            (int) Math.round((correct * 100.0) / qs.size())
          )
        );
        return m(
          "attempt",
          attempt,
          "review",
          qs
            .stream()
            .map(q ->
              m(
                "id",
                q.get("id"),
                "correct",
                q.get("correct"),
                "explanation",
                q.get("explanation")
              )
            )
            .toList()
        );
      }
      if (method.equals("POST") && action.equals("discussions")) {
        enrolled(id);
        return db.insert(
          "discussions",
          m("course_id", id, "user_id", uid, "body", text(d, "body", 1, 3000))
        );
      }
      if (method.equals("POST") && action.equals("certificate")) {
        student();
        var c = enrolled(id);
        var lessons = rows("lessons", m("course_id", id));
        Set<String> done = rows(
          "completions",
          m("course_id", id, "user_id", uid)
        )
          .stream()
          .map(r -> s(r, "lesson_id"))
          .collect(Collectors.toSet());
        need(
          !lessons.isEmpty() &&
            lessons.stream().allMatch(l -> done.contains(s(l, "id"))),
          "Complete every lesson first",
          409
        );
        need(
          rows("questions", m("course_id", id)).isEmpty() ||
            rows("attempts", m("course_id", id, "user_id", uid))
              .stream()
              .anyMatch(a -> n(a, "score") >= 70),
          "Pass the quiz with at least 70%",
          409
        );
        for (var a : rows("assignments", m("course_id", id))) {
          var ss = rows(
            "submissions",
            m("assignment_id", a.get("id"), "user_id", uid)
          );
          need(
            !ss.isEmpty() &&
              n(ss.get(0), "score") >= 0 &&
              n(ss.get(0), "score") * 100 >= n(a, "max_score") * 50,
            "Pass every assignment with at least 50%",
            409
          );
        }
        var found = rows("certificates", m("course_id", id, "user_id", uid));
        return found.isEmpty()
          ? db.insert(
              "certificates",
              m(
                "course_id",
                id,
                "user_id",
                uid,
                "course_title",
                c.get("title"),
                "learner_name",
                user.get("name")
              )
            )
          : found.get(0);
      }
    }
    if (
      Set.of("lessons", "questions", "assignments").contains(root) &&
      !id.isEmpty()
    ) {
      var r = get(root, id);
      String cid = s(r, "course_id");
      if (
        root.equals("lessons") &&
        method.equals("POST") &&
        action.equals("complete")
      ) {
        student();
        enrolled(cid);
        var found = rows("completions", m("user_id", uid, "lesson_id", id));
        return found.isEmpty()
          ? db.insert(
              "completions",
              m("user_id", uid, "lesson_id", id, "course_id", cid)
            )
          : found.get(0);
      }
      if (
        root.equals("assignments") &&
        method.equals("POST") &&
        action.equals("submit")
      ) {
        student();
        enrolled(cid);
        need(
          s(r, "due_at").compareTo(now()) > 0,
          "The assignment deadline has passed",
          409
        );
        var value = m(
          "body",
          text(d, "body", 10, 10000),
          "url",
          url(d, "url", false),
          "score",
          -1,
          "feedback",
          "",
          "graded_by",
          ""
        );
        var found = rows("submissions", m("user_id", uid, "assignment_id", id));
        need(
          found.isEmpty() || n(found.get(0), "score") < 0,
          "Graded submissions are locked",
          409
        );
        if (!found.isEmpty()) return db.update(
          "submissions",
          s(found.get(0), "id"),
          value
        );
        value.putAll(m("user_id", uid, "assignment_id", id, "course_id", cid));
        return db.insert("submissions", value);
      }
      if (action.isEmpty() && Set.of("PATCH", "DELETE").contains(method)) {
        curriculum(cid);
        if (method.equals("DELETE")) {
          db.delete(root, id);
          return m("message", "Deleted");
        }
        return db.update(root, id, contentData(root, d));
      }
    }
    if (
      root.equals("submissions") &&
      action.equals("grade") &&
      method.equals("POST")
    ) {
      var submission = get("submissions", id);
      manageCourse(s(submission, "course_id"));
      var a = get("assignments", s(submission, "assignment_id"));
      return db.update(
        "submissions",
        id,
        m(
          "score",
          integer(d, "score", 0, n(a, "max_score")),
          "feedback",
          text(d, "feedback", 1, 3000),
          "graded_by",
          uid
        )
      );
    }
    if (
      root.equals("discussions") && !id.isEmpty() && method.equals("DELETE")
    ) {
      var r = get("discussions", id);
      need(
        s(r, "user_id").equals(uid) ||
          manages(get("courses", s(r, "course_id")))
      );
      db.delete("discussions", id);
      return m("message", "Deleted");
    }
    if (root.equals("announcements") && method.equals("POST") && id.isEmpty()) {
      need(staff());
      String cid = text(d, "course_id", 0, 100);
      if (cid.isEmpty()) need(
        s(user, "role").equals("admin"),
        "Only admins can post campus-wide announcements",
        403
      );
      else manageCourse(cid);
      return db.insert(
        "announcements",
        m(
          "course_id",
          cid,
          "author_id",
          uid,
          "title",
          text(d, "title", 3, 160),
          "body",
          text(d, "body", 5, 5000)
        )
      );
    }
    if (
      root.equals("announcements") && !id.isEmpty() && method.equals("DELETE")
    ) {
      var r = get("announcements", id);
      need(s(user, "role").equals("admin") || s(r, "author_id").equals(uid));
      db.delete("announcements", id);
      return m("message", "Deleted");
    }
    if (root.equals("challenges")) {
      if (method.equals("POST") && id.isEmpty()) {
        need(staff());
        var v = challengeData(d);
        v.put("owner_id", uid);
        return db.insert("challenges", v);
      }
      if (method.equals("PATCH") && !id.isEmpty() && action.isEmpty()) {
        challengeOwner(id);
        var v = challengeData(d);
        need(
          rows("teams", m("challenge_id", id))
            .stream()
            .allMatch(
              t ->
                rows("memberships", m("team_id", t.get("id"))).size() <=
                n(v, "max_members")
            ),
          "Team limit is below an existing team size",
          409
        );
        return db.update("challenges", id, v);
      }
      if (method.equals("POST") && action.equals("teams")) {
        student();
        openChallenge(id);
        need(
          rows("memberships", m("challenge_id", id, "user_id", uid)).isEmpty(),
          "You already joined a team for this challenge",
          409
        );
        var t = db.insert(
          "teams",
          m(
            "challenge_id",
            id,
            "captain_id",
            uid,
            "name",
            text(d, "name", 2, 80)
          )
        );
        db.insert(
          "memberships",
          m("challenge_id", id, "team_id", t.get("id"), "user_id", uid)
        );
        return t;
      }
    }
    if (root.equals("teams") && !id.isEmpty() && method.equals("POST")) {
      var t = get("teams", id);
      var c = openChallenge(s(t, "challenge_id"));
      student();
      String cid = s(c, "id");
      if (action.equals("join")) {
        need(
          rows("projects", m("team_id", id)).isEmpty(),
          "Team roster is locked after project submission",
          409
        );
        need(
          rows("memberships", m("user_id", uid, "challenge_id", cid)).isEmpty(),
          "You already belong to a team for this challenge",
          409
        );
        need(
          rows("memberships", m("team_id", id)).size() < n(c, "max_members"),
          "Team is full",
          409
        );
        return db.insert(
          "memberships",
          m("challenge_id", cid, "team_id", id, "user_id", uid)
        );
      }
      if (action.equals("leave")) {
        need(
          !s(t, "captain_id").equals(uid),
          "Captains cannot leave their team",
          409
        );
        need(
          rows("projects", m("team_id", id)).isEmpty(),
          "Team roster is locked after project submission",
          409
        );
        var ms = rows("memberships", m("user_id", uid, "team_id", id));
        need(!ms.isEmpty(), "Not a team member", 409);
        db.delete("memberships", s(ms.get(0), "id"));
        return m("message", "Left team");
      }
      if (action.equals("project")) {
        need(
          s(t, "captain_id").equals(uid),
          "Only the captain can submit",
          403
        );
        var v = m(
          "title",
          text(d, "title", 3, 160),
          "description",
          text(d, "description", 20, 6000),
          "repo_url",
          url(d, "repo_url", true),
          "demo_url",
          url(d, "demo_url", false),
          "score",
          -1,
          "feedback",
          "",
          "graded_by",
          ""
        );
        var ps = rows("projects", m("team_id", id));
        need(
          ps.isEmpty() || n(ps.get(0), "score") < 0,
          "Judged projects are locked",
          409
        );
        if (!ps.isEmpty()) return db.update("projects", s(ps.get(0), "id"), v);
        v.putAll(m("team_id", id, "challenge_id", cid));
        return db.insert("projects", v);
      }
    }
    if (
      root.equals("projects") && action.equals("grade") && method.equals("POST")
    ) {
      var p = get("projects", id);
      challengeOwner(s(p, "challenge_id"));
      need(
        rows(
          "memberships",
          m("team_id", p.get("team_id"), "user_id", uid)
        ).isEmpty(),
        "You cannot judge your own team",
        403
      );
      return db.update(
        "projects",
        id,
        m(
          "score",
          integer(d, "score", 0, 100),
          "feedback",
          text(d, "feedback", 1, 3000),
          "graded_by",
          uid
        )
      );
    }
    if (root.equals("users") && !id.isEmpty() && method.equals("PATCH")) {
      need(s(user, "role").equals("admin"));
      get("users", id);
      String role = choice(d, "role", "student", "instructor", "admin");
      need(
        d.get("active") instanceof Boolean,
        "active must be true or false",
        422
      );
      boolean active = (Boolean) d.get("active");
      need(
        !id.equals(uid) || (role.equals("admin") && active),
        "You cannot remove your own admin access",
        409
      );
      var u = db.update("users", id, m("role", role, "active", active));
      for (var session : rows("sessions", m("user_id", id)))
        db.delete("sessions", s(session, "id"));
      return publicUser(u);
    }
    throw new ApiError(404, "Endpoint not found");
  }

  private Map<String, Object> courseData(Map<String, Object> d) {
    return m(
      "title",
      text(d, "title", 3, 160),
      "description",
      text(d, "description", 20, 6000),
      "category",
      text(d, "category", 2, 80),
      "level",
      choice(d, "level", "Beginner", "Intermediate", "Advanced"),
      "color",
      choice(d, "color", "violet", "mint", "peach", "blue"),
      "status",
      choice(d, "status", "draft", "published", "archived")
    );
  }

  private Map<String, Object> contentData(String t, Map<String, Object> d) {
    if (t.equals("lessons")) return m(
      "title",
      text(d, "title", 3, 160),
      "body",
      text(d, "body", 20, 20000),
      "resource_url",
      url(d, "resource_url", false),
      "position",
      integer(d, "position", 1, 1000),
      "minutes",
      integer(d, "minutes", 1, 600)
    );
    if (t.equals("assignments")) return m(
      "title",
      text(d, "title", 3, 160),
      "description",
      text(d, "description", 10, 10000),
      "due_at",
      date(d, "due_at"),
      "max_score",
      integer(d, "max_score", 1, 1000)
    );
    need(
      d.get("options") instanceof List,
      "Provide four nonempty answer options",
      422
    );
    List<?> options = (List<?>) d.get("options");
    need(
      options.size() == 4 &&
        options
          .stream()
          .allMatch(
            o ->
              o instanceof String &&
              ((String) o).strip().length() >= 1 &&
              ((String) o).strip().length() <= 500
          ),
      "Provide four nonempty answer options",
      422
    );
    return m(
      "prompt",
      text(d, "prompt", 5, 2000),
      "options",
      options
        .stream()
        .map(o -> ((String) o).strip())
        .toList(),
      "correct",
      integer(d, "correct", 0, 3),
      "explanation",
      text(d, "explanation", 5, 3000)
    );
  }

  private Map<String, Object> challengeData(Map<String, Object> d) {
    return m(
      "title",
      text(d, "title", 3, 160),
      "description",
      text(d, "description", 20, 6000),
      "max_members",
      integer(d, "max_members", 1, 10),
      "deadline",
      date(d, "deadline"),
      "status",
      choice(d, "status", "open", "closed")
    );
  }
}
