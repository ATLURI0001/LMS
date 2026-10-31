import { toCsv } from "./lib/csv.js";
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  LayoutDashboard,
  Trophy,
  Users,
  GraduationCap,
  Bell,
  Search,
  LogOut,
  Settings,
  Plus,
  Check,
  Clock,
  Play,
  Code2,
  Layers,
  Terminal,
  Menu,
  X,
  FileText,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Download,
  Shield,
  BarChart3,
  ChevronRight,
  Lock,
  Trash2,
  Pencil,
  Sparkles,
  Target,
  Flag,
} from "lucide-react";

import api from "./lib/api.js";
import {
  dateLabel,
  future,
  initialCourse,
  courseFields,
  lessonFields,
  assignmentFields,
  questionFields,
  challengeFields,
  projectFields,
  initials,
} from "./lib/forms.js";
import {
  Badge,
  Empty,
  Button,
  Dialog,
  Editor,
  Brand,
} from "./components/ui.jsx";
import Login from "./components/Login.jsx";
import SubmissionList from "./components/SubmissionList.jsx";
import CourseWorkspace from "./components/CourseWorkspace.jsx";
import Hackathons from "./components/Hackathons.jsx";
export default function App() {
  const [state, setState] = useState(null),
    [loading, setLoading] = useState(true),
    [startupError, setStartupError] = useState(""),
    [page, setPage] = useState("dashboard"),
    [courseId, setCourseId] = useState(""),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(null),
    [mobile, setMobile] = useState(false),
    [busy, setBusy] = useState(false),
    [certificate, setCertificate] = useState(null);
  async function refresh() {
    try {
      const data = await api("state");
      setState(data);
      setStartupError("");
    } catch (e) {
      if (e.status === 401) setState(null);
      else {
        setStartupError(e.message);
        throw e;
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh().catch(() => {});
  }, []);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(null), 6000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  function go(next) {
    setPage(next);
    setMobile(false);
    setQuery("");
    window.scrollTo(0, 0);
  }
  async function mutate(
    path,
    method = "POST",
    data = {},
    message = "Saved successfully",
  ) {
    setBusy(true);
    try {
      const result = await api(path, method, data);
      await refresh();
      if (message) setNotice({ text: message });
      return result;
    } catch (e) {
      if (e.status === 401) setState(null);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const act = (path, method = "POST", data = {}, message) =>
    mutate(path, method, data, message).catch((e) =>
      setNotice({ text: e.message, error: true }),
    );
  function edit(
    title,
    fields,
    initial,
    path,
    method = "POST",
    transform = (x) => x,
    note,
  ) {
    setModal({
      title,
      fields,
      initial,
      note,
      submit: async (d) => mutate(path, method, transform(d)),
    });
  }
  const localDate = (v) => {
    if (!v) return future();
    const d = new Date(v);
    return new Date(d - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  if (loading)
    return (
      <div className="loading">
        <Brand />
        <span>Opening your workspace…</span>
      </div>
    );
  if (!state)
    return (
      <>
        {startupError && (
          <div className="connection-error" role="alert">
            Could not reach the API: {startupError}. Check that the backend is
            running.{" "}
            <button onClick={() => refresh().catch(() => {})}>Retry</button>
          </div>
        )}
        <Login onLogin={refresh} />
      </>
    );
  const user = state.user,
    staff = user.role !== "student",
    admin = user.role === "admin";
  const owned = (c) => admin || c.owner_id === user.id;
  const enrolled = (id) =>
    state.enrollments.some((e) => e.user_id === user.id && e.course_id === id);
  const courseLessons = (id) =>
    state.lessons
      .filter((l) => l.course_id === id)
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const completed = (id) =>
    state.completions.filter(
      (c) => c.user_id === user.id && (!id || c.course_id === id),
    );
  const progress = (id) => {
    const total = courseLessons(id).length;
    return total ? Math.round((completed(id).length / total) * 100) : 0;
  };
  const myCourses = state.courses.filter((c) =>
    staff ? owned(c) : enrolled(c.id),
  );
  const name = (id) =>
    state.users.find((u) => u.id === id)?.name || "Campus member";
  const courseName = (id) =>
    state.courses.find((c) => c.id === id)?.title || "Course";
  const openCourse = (id) => {
    setCourseId(id);
    go("course");
  };
  const editCourse = (c) =>
    edit(
      c ? "Edit course" : "Create a course",
      courseFields,
      c || initialCourse,
      c ? `courses/${c.id}` : "courses",
      c ? "PATCH" : "POST",
    );
  const editChallenge = (c) =>
    edit(
      c ? "Edit challenge" : "Launch a challenge",
      challengeFields,
      c
        ? { ...c, deadline: localDate(c.deadline) }
        : {
            title: "",
            description: "",
            max_members: 4,
            deadline: future(),
            status: "open",
          },
      c ? `challenges/${c.id}` : "challenges",
      c ? "PATCH" : "POST",
      (d) => ({ ...d, deadline: new Date(d.deadline).toISOString() }),
    );
  const nav = [
    ["dashboard", "Overview", LayoutDashboard],
    ["courses", staff ? "Course studio" : "Explore courses", BookOpen],
    ["learning", staff ? "My teaching" : "My learning", GraduationCap],
    ["hackathons", "Hackathon arena", Code2],
    ["leaderboard", "Leaderboard", Trophy],
    ["announcements", "Notice board", Bell],
    ...(staff
      ? [["reports", "Reports & grading", BarChart3]]
      : [["certificates", "Certificates", FileText]]),
    ...(admin ? [["users", "Manage people", Shield]] : []),
  ];
  const titles = {
    dashboard: "Overview",
    courses: staff ? "Course studio" : "Explore courses",
    learning: staff ? "My teaching" : "My learning",
    course: "Learning workspace",
    hackathons: "Hackathon arena",
    leaderboard: "Leaderboard",
    announcements: "Notice board",
    reports: "Reports & grading",
    certificates: "Certificates",
    users: "Manage people",
    profile: "Your account",
  };
  function CourseCard({ course: c }) {
    const lessons = courseLessons(c.id),
      isMine = enrolled(c.id);
    return (
      <article className="course-card">
        <button
          className={`course-art ${c.color}`}
          onClick={() => openCourse(c.id)}
          aria-label={`Open ${c.title}`}
        >
          <span className="art-label">{c.category.toUpperCase()}</span>
          <div className="art-visual">
            <div className="art-tile">
              <Code2 size={38} />
            </div>
            <div className="art-chip">
              <span />
              <span />
              <span />
            </div>
            <div className="art-ring" />
          </div>
          <Badge>{c.level}</Badge>
        </button>
        <div className="course-card-body">
          <div className="course-meta">
            {lessons.length} lessons <span>·</span>{" "}
            {lessons.reduce((s, l) => s + l.minutes, 0)} min{" "}
            {staff && <Badge>{c.status}</Badge>}
          </div>
          <button className="card-title" onClick={() => openCourse(c.id)}>
            {c.title}
          </button>
          <p>{c.description}</p>
          {isMine && (
            <div className="progress-label">
              <span>Course progress</span>
              <strong>{progress(c.id)}%</strong>
            </div>
          )}
          {isMine && (
            <div className="progress">
              <i style={{ width: `${progress(c.id)}%` }} />
            </div>
          )}
          <div className="card-footer">
            <div className="mentor">
              <span className="avatar small">{initials(name(c.owner_id))}</span>
              <span>{name(c.owner_id)}</span>
            </div>
            <button
              className="round-btn"
              onClick={() => openCourse(c.id)}
              aria-label={`Open ${c.title}`}
            >
              <ArrowUpRight size={19} />
            </button>
          </div>
        </div>
      </article>
    );
  }
  const visibleCourses = state.courses.filter(
    (c) =>
      (page !== "learning" || myCourses.includes(c)) &&
      `${c.title} ${c.category} ${c.level}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const totalPoints =
    state.leaderboard.find((u) => u.id === user.id)?.points || 0;
  const announcementForm = () =>
    edit(
      "Post an announcement",
      [
        [
          "course_id",
          "Course",
          (admin ? [{ value: "", label: "Entire campus" }] : []).concat(
            state.courses
              .filter(owned)
              .map((c) => ({ value: c.id, label: c.title })),
          ),
        ],
        ["title", "Title", "text", true],
        ["body", "Message", "textarea", true],
      ],
      { course_id: admin ? "" : myCourses[0]?.id || "", title: "", body: "" },
      "announcements",
      "POST",
      (d) => d,
      "Share a useful update with your learners.",
    );
  function exportReport() {
    const rows = [
      [
        "Course",
        "Student",
        "Lessons completed",
        "Total lessons",
        "Best quiz %",
        "Assignments graded",
      ],
      ...state.enrollments.flatMap((e) => {
        const c = state.courses.find((c) => c.id === e.course_id && owned(c));
        if (!c) return [];
        return [
          [
            c.title,
            name(e.user_id),
            state.completions.filter(
              (r) => r.course_id === c.id && r.user_id === e.user_id,
            ).length,
            courseLessons(c.id).length,
            Math.max(
              0,
              ...state.attempts
                .filter((a) => a.course_id === c.id && a.user_id === e.user_id)
                .map((a) => a.score),
            ),
            state.submissions.filter(
              (s) =>
                s.course_id === c.id && s.user_id === e.user_id && s.score >= 0,
            ).length,
          ],
        ];
      }),
    ];
    const csv = toCsv(rows);
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascent-learning-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {mobile && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Brand />
        <div className="workspace-label">
          <span className="status-dot" /> CAMPUS WORKSPACE
        </div>
        <nav>
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              onClick={() => go(key)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {key === "hackathons" && <span className="nav-new">BUILD</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-promo">
          <div className="mini-stars">
            ✦ <span>✧</span>
          </div>
          <h4>
            A little progress.
            <br />
            Every single day.
          </h4>
          <p>Your next breakthrough is one lesson away.</p>
          <button onClick={() => go("learning")}>
            Keep going <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => go("profile")}>
            <Settings size={18} /> Account settings
          </button>
          <button
            onClick={async () => {
              try {
                await api("auth/logout", "POST", {});
                setState(null);
                setPage("dashboard");
              } catch (e) {
                setNotice({ text: e.message, error: true });
              }
            }}
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={23} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{titles[page]}</strong>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <input
                aria-label="Search courses"
                placeholder="Find your next skill…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage("courses");
                }}
              />
              <kbd>/</kbd>
            </div>
            <button
              className="icon-btn notification"
              aria-label="Open announcements"
              onClick={() => go("announcements")}
            >
              <Bell size={20} />
              {state.announcements.length > 0 && <i />}
            </button>
            <button
              className="avatar"
              aria-label="Open your profile"
              onClick={() => go("profile")}
            >
              {initials(user.name)}
            </button>
          </div>
        </header>
        <main id="main">
          <div className="page-eyebrow">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            <span className="role-label">{user.role} workspace</span>
          </div>
          {page === "dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>
                    Hey {user.name.split(" ")[0]}, let's make progress
                    <span className="accent">.</span>
                  </h1>
                  <p>
                    A new skill. A bold idea. A little closer to what’s next.
                  </p>
                </div>
                <Button
                  icon={staff ? Plus : ArrowUpRight}
                  onClick={() => (staff ? editCourse() : go("courses"))}
                >
                  {staff ? "Create a course" : "Explore courses"}
                </Button>
              </div>
              <div className="dashboard-grid">
                <div className="dashboard-main">
                  <section className="hero-banner">
                    <div>
                      <Badge tone="lime">YOUR NEXT CHAPTER</Badge>
                      <h2>
                        Don't just learn it.
                        <br />
                        <em>Build with it.</em>
                      </h2>
                      <p>
                        Turn classroom knowledge into projects
                        <br />
                        that make you stand out.
                      </p>
                      <Button
                        className="light"
                        icon={ArrowUpRight}
                        onClick={() => go("hackathons")}
                      >
                        Enter the arena
                      </Button>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="code-window">
                        <div className="window-dots">● ● ●</div>
                        <div>
                          <span>const</span> future = {"{"}
                          <br />
                          &nbsp; curiosity: <em>true</em>,<br />
                          &nbsp; ideas: <em>"limitless"</em>,<br />
                          &nbsp; nextStep: <em>"build"</em>
                          <br />
                          {"}"};
                        </div>
                      </div>
                      <div className="floating-badge">
                        <Trophy size={24} />
                        <span>
                          MAKE IT
                          <br />
                          <strong>HAPPEN.</strong>
                        </span>
                      </div>
                      <span className="hero-spark">✳</span>
                    </div>
                  </section>
                  <div className="stats-grid">
                    {(staff
                      ? [
                          [BookOpen, myCourses.length, "Courses managed"],
                          [Users, state.enrollments.length, "Enrollments"],
                          [
                            FileText,
                            state.submissions.filter((s) => s.score < 0).length,
                            "Awaiting review",
                          ],
                          [
                            Flag,
                            state.challenges.filter((c) => c.status === "open")
                              .length,
                            "Open challenges",
                          ],
                        ]
                      : [
                          [BookOpen, myCourses.length, "Courses joined"],
                          [
                            CheckCircle2,
                            completed().length,
                            "Lessons completed",
                          ],
                          [
                            Target,
                            state.attempts.filter((a) => a.user_id === user.id)
                              .length,
                            "Quiz attempts",
                          ],
                          [Trophy, totalPoints, "Learning points"],
                        ]
                    ).map(([Icon, value, label]) => (
                      <div className="stat" key={label}>
                        <span className="stat-icon">
                          <Icon size={19} />
                        </span>
                        <strong>{value}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="section-heading">
                    <div>
                      <h2>
                        {staff ? "Your teaching studio" : "Keep your momentum"}
                      </h2>
                      <p>
                        {staff
                          ? "Build paths your students can follow."
                          : "Small steps add up to remarkable things."}
                      </p>
                    </div>
                    <button className="text-btn" onClick={() => go("learning")}>
                      View all <ArrowRight size={16} />
                    </button>
                  </div>
                  {myCourses.length ? (
                    <div className="course-grid dashboard-courses">
                      {myCourses.slice(0, 2).map((c) => (
                        <CourseCard key={c.id} course={c} />
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="A fresh start"
                      text="Explore the catalog and enroll in your first course."
                    >
                      <Button onClick={() => go("courses")}>
                        Find a course
                      </Button>
                    </Empty>
                  )}
                </div>
                <aside className="dashboard-aside">
                  <section className="panel weekly-card">
                    <div className="section-heading">
                      <h3>
                        {staff ? "Campus pulse" : "Your learning journey"}
                      </h3>
                      <Sparkles size={18} />
                    </div>
                    <div
                      className="progress-ring"
                      style={{
                        "--progress": `${myCourses.length ? Math.round(myCourses.reduce((s, c) => s + progress(c.id), 0) / myCourses.length) : 0}%`,
                      }}
                    >
                      <div>
                        <strong>
                          {staff
                            ? state.users.filter((u) => u.role === "student")
                                .length
                            : completed().length}
                        </strong>
                        <span>{staff ? "learners" : "lessons done"}</span>
                      </div>
                    </div>
                    <h4>
                      {staff
                        ? "Make room for the next generation."
                        : completed().length
                          ? "You’re building momentum."
                          : "Your first step is waiting."}
                    </h4>
                    <p>
                      {staff
                        ? "Create, guide, review, repeat."
                        : `${state.certificates.length} certificates earned. Keep learning at your pace.`}
                    </p>
                    <div className="mini-legend">
                      <span />{" "}
                      {staff ? "Campus learners" : "Average course progress"}
                    </div>
                  </section>
                  <section className="panel">
                    <div className="section-heading">
                      <h3>On the notice board</h3>
                      <Bell size={17} />
                    </div>
                    {state.announcements
                      .slice(-3)
                      .reverse()
                      .map((a) => (
                        <button
                          className="notice-item"
                          key={a.id}
                          onClick={() => go("announcements")}
                        >
                          <span className="notice-icon">
                            <Bell size={16} />
                          </span>
                          <span>
                            <strong>{a.title}</strong>
                            <small>{dateLabel(a.created_at)}</small>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))}
                    {!state.announcements.length && (
                      <p className="muted">You're all caught up.</p>
                    )}
                  </section>
                  <div className="quote-card">
                    <span>✳</span>
                    <p>
                      Great projects start with
                      <br />
                      <strong>one curious person.</strong>
                    </p>
                    <small>LET THAT BE YOU.</small>
                  </div>
                </aside>
              </div>
            </>
          )}
          {["courses", "learning"].includes(page) && (
            <>
              <div className="page-heading">
                <div>
                  <h1>
                    {page === "learning"
                      ? staff
                        ? "Teach what moves you."
                        : "Your learning, in motion."
                      : staff
                        ? "Build a path worth following."
                        : "What will you build next?"}
                  </h1>
                  <p>
                    {staff
                      ? "Create a course, add the curriculum, then publish it for your campus."
                      : "Practical paths to turn your curiosity into working skills."}
                  </p>
                </div>
                {staff && (
                  <Button icon={Plus} onClick={() => editCourse()}>
                    Create course
                  </Button>
                )}
              </div>
              <div className="filter-row">
                <div className="search-box wide-search">
                  <Search size={18} />
                  <input
                    aria-label="Filter courses"
                    placeholder="Search by topic, level, or course name"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <span className="muted">{visibleCourses.length} courses</span>
              </div>
              <div className="course-grid">
                {visibleCourses.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
              {!visibleCourses.length && (
                <Empty
                  title="No courses found"
                  text="Try another topic or explore the full catalog."
                />
              )}
            </>
          )}
          {page === "course" && (
            <CourseWorkspace
              key={courseId}
              {...{
                state,
                user,
                staff,
                owned,
                enrolled,
                courseId,
                courseLessons,
                progress,
                name,
                edit,
                editCourse,
                act,
                mutate,
                setNotice,
                busy,
                localDate,
                setCertificate,
              }}
              onBack={() => go("courses")}
            />
          )}
          {page === "hackathons" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">LEARN IT. SHIP IT. SHOW IT.</div>
                  <h1>Your ideas deserve a stage.</h1>
                  <p>
                    Find a challenge, form a team, and build a working solution.
                  </p>
                </div>
                {staff && (
                  <Button icon={Plus} onClick={() => editChallenge()}>
                    Launch challenge
                  </Button>
                )}
              </div>
              <Hackathons
                {...{
                  state,
                  user,
                  staff,
                  name,
                  edit,
                  editChallenge,
                  act,
                  busy,
                }}
              />
            </>
          )}
          {page === "leaderboard" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>A little healthy competition.</h1>
                  <p>
                    10 points per lesson + your best quiz score per course +
                    judged team project scores.
                  </p>
                </div>
                <Badge tone="lime">EVERY STEP COUNTS</Badge>
              </div>
              <div className="leader-hero">
                <Trophy size={48} />
                <div>
                  <h2>Progress earns its place.</h2>
                  <p>
                    Practice quizzes reward improvement. Repeated attempts never
                    stack points.
                  </p>
                </div>
              </div>
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Learner</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.leaderboard.map((r, i) => (
                      <tr
                        key={r.id}
                        className={r.id === user.id ? "your-row" : ""}
                      >
                        <td>
                          <span className={`rank rank-${i + 1}`}>
                            {i < 3 ? <Trophy size={18} /> : i + 1}
                          </span>
                        </td>
                        <td>
                          <span className="person">
                            <span className="avatar small">
                              {initials(r.name)}
                            </span>
                            {r.name}
                            {r.id === user.id && <Badge>You</Badge>}
                          </span>
                        </td>
                        <td>
                          <strong>{r.points}</strong>{" "}
                          <span className="muted">pts</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {page === "announcements" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>The campus notice board.</h1>
                  <p>Course updates and announcements, all in one place.</p>
                </div>
                {staff && (
                  <Button icon={Plus} onClick={announcementForm}>
                    Post announcement
                  </Button>
                )}
              </div>
              <div className="notice-grid">
                {[...state.announcements].reverse().map((a) => (
                  <article className="panel announcement" key={a.id}>
                    <Badge>
                      {a.course_id ? courseName(a.course_id) : "Campus-wide"}
                    </Badge>
                    <h2>{a.title}</h2>
                    <div className="prose">{a.body}</div>
                    <footer>
                      <span>
                        {name(a.author_id)} · {dateLabel(a.created_at)}
                      </span>
                      {(admin || a.author_id === user.id) && (
                        <button
                          className="icon-btn danger"
                          aria-label={`Delete ${a.title}`}
                          onClick={() =>
                            edit(
                              "Remove announcement",
                              [],
                              {},
                              `announcements/${a.id}`,
                              "DELETE",
                              () => ({}),
                              "This removes the announcement from the notice board.",
                            )
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </footer>
                  </article>
                ))}
              </div>
              {!state.announcements.length && (
                <Empty
                  title="No announcements yet"
                  text="Updates from your instructors will appear here."
                />
              )}
            </>
          )}
          {page === "certificates" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Proof of your progress.</h1>
                  <p>
                    Finish every lesson, pass the quiz at 70%, and each
                    assignment at 50% to earn a course certificate.
                  </p>
                </div>
              </div>
              <div className="certificate-grid">
                {state.certificates.map((c) => (
                  <article className="panel cert-card" key={c.id}>
                    <GraduationCap size={40} />
                    <Badge tone="mint">COMPLETED</Badge>
                    <h2>{c.course_title}</h2>
                    <p>Issued to {c.learner_name}</p>
                    <small>{dateLabel(c.created_at)}</small>
                    <Button
                      className="secondary"
                      icon={Download}
                      onClick={() => setCertificate(c)}
                    >
                      View & print
                    </Button>
                  </article>
                ))}
              </div>
              {!state.certificates.length && (
                <Empty
                  title="Your first milestone is ahead"
                  text="Complete a course, then use “Claim certificate” in its learning workspace."
                >
                  <Button onClick={() => go("learning")}>
                    Continue learning
                  </Button>
                </Empty>
              )}
            </>
          )}
          {page === "users" && admin && (
            <>
              <div className="page-heading">
                <div>
                  <h1>People make the campus.</h1>
                  <p>
                    Manage roles and access. Changing access signs the account
                    out immediately.
                  </p>
                </div>
                <Badge>{state.users.length} accounts</Badge>
              </div>
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <span className="person">
                            <span className="avatar small">
                              {initials(u.name)}
                            </span>
                            {u.name}
                          </span>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <Badge>{u.role}</Badge>
                        </td>
                        <td>
                          <Badge tone={u.active ? "mint" : "peach"}>
                            {u.active ? "Active" : "Disabled"}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            className="secondary small-btn"
                            disabled={u.id === user.id}
                            icon={Pencil}
                            onClick={() =>
                              edit(
                                `Manage ${u.name}`,
                                [
                                  [
                                    "role",
                                    "Role",
                                    ["student", "instructor", "admin"],
                                  ],
                                  [
                                    "status",
                                    "Account status",
                                    ["Active", "Disabled"],
                                  ],
                                ],
                                {
                                  role: u.role,
                                  status: u.active ? "Active" : "Disabled",
                                },
                                `users/${u.id}`,
                                "PATCH",
                                (d) => ({
                                  role: d.role,
                                  active: d.status === "Active",
                                }),
                              )
                            }
                          >
                            Edit access
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {page === "reports" && staff && (
            <>
              <div className="page-heading">
                <div>
                  <h1>See the progress. Guide the next step.</h1>
                  <p>
                    Enrollment, course progress, and assignment review for the
                    courses you manage.
                  </p>
                </div>
                <Button icon={Download} onClick={exportReport}>
                  Export CSV
                </Button>
              </div>
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Enrollments</th>
                      <th>Lessons</th>
                      <th>Pending reviews</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {myCourses.map((c) => (
                      <tr key={c.id}>
                        <td>{c.title}</td>
                        <td>
                          {
                            state.enrollments.filter(
                              (e) => e.course_id === c.id,
                            ).length
                          }
                        </td>
                        <td>{courseLessons(c.id).length}</td>
                        <td>
                          {
                            state.submissions.filter(
                              (s) => s.course_id === c.id && s.score < 0,
                            ).length
                          }
                        </td>
                        <td>
                          <button
                            className="text-btn"
                            onClick={() => openCourse(c.id)}
                          >
                            Open <ArrowUpRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="section-heading">
                <h2>Submission inbox</h2>
                <span className="muted">
                  {state.submissions.length} submissions
                </span>
              </div>
              <SubmissionList
                submissions={state.submissions}
                {...{ state, name, edit }}
              />
              {!state.submissions.length && (
                <Empty
                  title="No submissions yet"
                  text="Student work will appear here for review."
                />
              )}
            </>
          )}
          {page === "profile" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Your space, your details.</h1>
                  <p>Keep your profile current and your account secure.</p>
                </div>
              </div>
              <section className="panel profile-panel">
                <span className="avatar large">{initials(user.name)}</span>
                <div>
                  <h2>{user.name}</h2>
                  <p>{user.email}</p>
                  <Badge>{user.role}</Badge>
                </div>
                <Button
                  className="secondary"
                  icon={Pencil}
                  onClick={() =>
                    edit(
                      "Update your profile",
                      [["name", "Full name", "text", true]],
                      { name: user.name },
                      "profile",
                      "PATCH",
                    )
                  }
                >
                  Edit profile
                </Button>
              </section>
              <section className="panel security-panel">
                <Lock size={25} />
                <div>
                  <h3>Password & sessions</h3>
                  <p>Changing your password signs out all existing sessions.</p>
                </div>
                <Button
                  className="secondary"
                  onClick={() => {
                    setModal({
                      title: "Change password",
                      fields: [
                        ["current", "Current password", "password", true],
                        [
                          "password",
                          "New password (12–128 characters)",
                          "password",
                          true,
                        ],
                      ],
                      submit: async (d) => {
                        await api("auth/password", "POST", d);
                        setState(null);
                        setPage("dashboard");
                      },
                    });
                  }}
                >
                  Change password
                </Button>
              </section>
            </>
          )}
          <footer className="app-footer">
            <span>
              ascent <b>✦</b> Learn. Build. Rise.
            </span>
            <span>Made for curious minds and ambitious teams.</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className={`toast ${notice.error ? "error" : ""}`} role="status">
          {notice.error ? <Flag size={18} /> : <CheckCircle2 size={18} />}
          <span>{notice.text}</span>
          <button
            className="icon-btn"
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Editor
          key={modal.title}
          config={modal}
          onClose={() => setModal(null)}
        />
      )}
      {certificate && (
        <Dialog
          title="Your course certificate"
          wide
          onClose={() => setCertificate(null)}
        >
          <div className="certificate-print print-root">
            <Brand />
            <div className="eyebrow">CERTIFICATE OF COMPLETION</div>
            <p>This recognizes that</p>
            <h1>{certificate.learner_name}</h1>
            <p>has completed the learning requirements for</p>
            <h2>{certificate.course_title}</h2>
            <GraduationCap size={56} />
            <div className="cert-details">
              <span>ISSUED {dateLabel(certificate.created_at)}</span>
              <span>ID {certificate.id}</span>
            </div>
            <small>
              Campus learning achievement · Not an accredited academic
              qualification
            </small>
          </div>
          <div className="form-actions">
            <Button icon={Download} onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
