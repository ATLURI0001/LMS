import React, { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Plus,
  Pencil,
  GraduationCap,
  Lock,
  Check,
  CheckCircle2,
  ExternalLink,
  Target,
  FileText,
  MessageSquare,
  Settings,
  Trash2,
  Trophy,
} from "lucide-react";
import SubmissionList from "./SubmissionList.jsx";
import { Badge, Empty, Button, Dialog, Editor, Brand } from "./ui.jsx";
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
} from "../lib/forms.js";
export default function CourseWorkspace({
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
  onBack,
}) {
  const c = state.courses.find((c) => c.id === courseId),
    lessons = courseLessons(courseId),
    [tab, setTab] = useState("lessons"),
    [lessonId, setLessonId] = useState(lessons[0]?.id),
    [answers, setAnswers] = useState({}),
    [review, setReview] = useState(null),
    [post, setPost] = useState("");
  if (!c)
    return (
      <Empty
        title="Course unavailable"
        text="Return to the catalog to choose another course."
      />
    );
  const manage = staff && owned(c),
    hasAccess = manage || enrolled(c.id),
    lesson = lessons.find((l) => l.id === lessonId) || lessons[0],
    questions = state.questions.filter((q) => q.course_id === c.id),
    assignments = state.assignments.filter((a) => a.course_id === c.id),
    locked = state.enrollments.some((e) => e.course_id === c.id),
    mySubmission = (id) =>
      state.submissions.find(
        (s) => s.assignment_id === id && s.user_id === user.id,
      ),
    best = Math.max(
      0,
      ...state.attempts
        .filter((a) => a.course_id === c.id && a.user_id === user.id)
        .map((a) => a.score),
    );
  const contentEdit = (type, row) => {
    const fields =
      type === "lessons"
        ? lessonFields
        : type === "questions"
          ? questionFields
          : assignmentFields;
    let initial = row
      ? { ...row }
      : type === "lessons"
        ? {
            title: "",
            body: "",
            resource_url: "",
            position: lessons.length + 1,
            minutes: 15,
          }
        : type === "questions"
          ? {
              prompt: "",
              correct: 0,
              explanation: "",
              option0: "",
              option1: "",
              option2: "",
              option3: "",
            }
          : { title: "", description: "", due_at: future(), max_score: 100 };
    if (type === "questions" && row)
      row.options.forEach((o, i) => (initial[`option${i}`] = o));
    if (type === "assignments" && row) initial.due_at = localDate(row.due_at);
    edit(
      `${row ? "Edit" : "Add"} ${type.slice(0, -1)}`,
      fields,
      initial,
      row ? `${type}/${row.id}` : `courses/${c.id}/${type}`,
      row ? "PATCH" : "POST",
      (d) =>
        type === "questions"
          ? {
              prompt: d.prompt,
              correct: d.correct,
              explanation: d.explanation,
              options: [0, 1, 2, 3].map((i) => d[`option${i}`]),
            }
          : type === "assignments"
            ? { ...d, due_at: new Date(d.due_at).toISOString() }
            : d,
    );
  };
  return (
    <>
      <button className="text-btn back" onClick={onBack}>
        <ArrowLeft size={16} /> Back to courses
      </button>
      <div className={`course-header ${c.color}`}>
        <div>
          <Badge>{c.category}</Badge>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
          <div className="course-header-meta">
            <span>
              <BookOpen size={16} />
              {lessons.length} lessons
            </span>
            <span>
              <Clock size={16} />
              {lessons.reduce((s, l) => s + l.minutes, 0)} minutes
            </span>
            <span>{c.level}</span>
          </div>
        </div>
        <div className="course-actions">
          {manage ? (
            <Button icon={Pencil} onClick={() => editCourse(c)}>
              Edit details
            </Button>
          ) : enrolled(c.id) ? (
            <>
              <strong>{progress(c.id)}% complete</strong>
              <div className="progress">
                <i style={{ width: `${progress(c.id)}%` }} />
              </div>
              <Button
                className="secondary"
                icon={GraduationCap}
                disabled={busy}
                onClick={async () => {
                  try {
                    const cert = await mutate(
                      `courses/${c.id}/certificate`,
                      "POST",
                      {},
                      "Certificate earned",
                    );
                    setCertificate(cert);
                  } catch (e) {
                    setNotice({ text: e.message, error: true });
                  }
                }}
              >
                Claim certificate
              </Button>
            </>
          ) : !staff ? (
            <Button
              disabled={busy || c.status !== "published"}
              icon={Plus}
              onClick={() =>
                act(
                  `courses/${c.id}/enroll`,
                  "POST",
                  {},
                  "You’re enrolled. Let’s get started!",
                )
              }
            >
              Enroll in course
            </Button>
          ) : (
            <Badge>Managed by {name(c.owner_id)}</Badge>
          )}
        </div>
      </div>
      {!hasAccess ? (
        <div className="panel">
          <h2>A look at the path ahead</h2>
          {lessons.map((l, i) => (
            <div className="lesson-preview" key={l.id}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{l.title}</strong>
              <span>{l.minutes} min</span>
              <Lock size={17} />
            </div>
          ))}
          <p className="muted">
            Enroll to unlock lesson content, quizzes, assignments, and
            discussion.
          </p>
        </div>
      ) : (
        <>
          <div className="tabs">
            {[
              ["lessons", "Lessons", BookOpen],
              ["quiz", "Practice quiz", Target],
              ["assignments", "Assignments", FileText],
              ["discussion", "Discussion", MessageSquare],
              ...(manage ? [["manage", "Curriculum & reviews", Settings]] : []),
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          {tab === "lessons" &&
            (lesson ? (
              <div className="lesson-layout">
                <aside className="panel lesson-sidebar">
                  <h3>Course curriculum</h3>
                  {lessons.map((l, i) => {
                    const done = state.completions.some(
                      (r) => r.user_id === user.id && r.lesson_id === l.id,
                    );
                    return (
                      <button
                        key={l.id}
                        className={lesson.id === l.id ? "selected" : ""}
                        onClick={() => setLessonId(l.id)}
                      >
                        <span className={`lesson-number ${done ? "done" : ""}`}>
                          {done ? <Check size={15} /> : i + 1}
                        </span>
                        <span>
                          <strong>{l.title}</strong>
                          <small>{l.minutes} min read & practice</small>
                        </span>
                      </button>
                    );
                  })}
                </aside>
                <article className="panel lesson-reader">
                  <Badge>{c.category}</Badge>
                  <h2>{lesson.title}</h2>
                  <p className="muted">
                    <Clock size={15} /> {lesson.minutes} minutes · Learn by
                    doing
                  </p>
                  <div className="prose lesson-prose">{lesson.body}</div>
                  {lesson.resource_url && (
                    <a
                      className="resource-card"
                      href={lesson.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BookOpen size={22} />
                      <span>
                        <strong>Go a little deeper</strong>
                        <small>Open the lesson resource</small>
                      </span>
                      <ExternalLink size={18} />
                    </a>
                  )}
                  {!staff && (
                    <Button
                      icon={CheckCircle2}
                      disabled={
                        busy ||
                        state.completions.some(
                          (r) =>
                            r.user_id === user.id && r.lesson_id === lesson.id,
                        )
                      }
                      onClick={() =>
                        act(
                          `lessons/${lesson.id}/complete`,
                          "POST",
                          {},
                          "Lesson completed. Keep going!",
                        )
                      }
                    >
                      {state.completions.some(
                        (r) =>
                          r.user_id === user.id && r.lesson_id === lesson.id,
                      )
                        ? "Lesson complete"
                        : "Mark as complete"}
                    </Button>
                  )}
                </article>
              </div>
            ) : (
              <Empty
                title="The curriculum is taking shape"
                text="Your instructor will add lessons here."
              />
            ))}
          {tab === "quiz" && (
            <div className="panel quiz-panel">
              <div className="section-heading">
                <div>
                  <h2>Check what you’ve learned.</h2>
                  <p>
                    Practice as often as you like. A score of 70% passes; your
                    best result counts.
                  </p>
                </div>
                {!staff && <Badge tone="mint">BEST {best}%</Badge>}
              </div>
              {questions.length ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      setReview(
                        await mutate(
                          `courses/${c.id}/quiz`,
                          "POST",
                          { answers },
                          "Quiz scored",
                        ),
                      );
                    } catch (e) {
                      setNotice({ text: e.message, error: true });
                    }
                  }}
                >
                  {questions.map((q, i) => (
                    <fieldset className="quiz-question" key={q.id}>
                      <legend>
                        <span>{String(i + 1).padStart(2, "0")}</span> {q.prompt}
                      </legend>
                      {q.options.map((option, j) => (
                        <label
                          className={`quiz-option ${answers[q.id] === j ? "chosen" : ""}`}
                          key={j}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            required
                            disabled={staff}
                            checked={answers[q.id] === j}
                            onChange={() => {
                              setAnswers({ ...answers, [q.id]: j });
                              setReview(null);
                            }}
                          />
                          <span className="option-letter">{"ABCD"[j]}</span>
                          {option}
                          {manage && q.correct === j && <Check size={18} />}
                        </label>
                      ))}
                      {review && (
                        <p className="feedback">
                          {
                            review.review.find((r) => r.id === q.id)
                              ?.explanation
                          }
                        </p>
                      )}
                    </fieldset>
                  ))}
                  {staff ? (
                    <p className="form-note">
                      Instructor preview. Sign in as a student to take this
                      quiz.
                    </p>
                  ) : (
                    <Button disabled={busy} icon={Target}>
                      Submit answers
                    </Button>
                  )}
                  {review && (
                    <div className="quiz-result">
                      <Trophy size={28} />
                      <div>
                        <h3>
                          {review.attempt.score}% ·{" "}
                          {review.attempt.score >= 70
                            ? "You passed!"
                            : "Keep practicing."}
                        </h3>
                        <p>
                          Review the explanations above and revisit any lesson
                          you need.
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <Empty
                  title="No quiz published yet"
                  text="Your instructor can add questions in the curriculum studio."
                />
              )}
            </div>
          )}
          {tab === "assignments" && (
            <div className="assignment-grid">
              {assignments.map((a) => {
                const s = mySubmission(a.id);
                return (
                  <article className="panel assignment" key={a.id}>
                    <Badge tone={s?.score >= 0 ? "mint" : "peach"}>
                      {s
                        ? s.score < 0
                          ? "Submitted · awaiting review"
                          : `${s.score} / ${a.max_score}`
                        : "To do"}
                    </Badge>
                    <h2>{a.title}</h2>
                    <p className="prose">{a.description}</p>
                    <div className="assignment-meta">
                      <Clock size={16} /> Due {dateLabel(a.due_at)}{" "}
                      <span>· {a.max_score} points</span>
                    </div>
                    {s && (
                      <div className="feedback">
                        <strong>Your submission</strong>
                        <p>{s.body}</p>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open project
                          </a>
                        )}
                        {s.feedback && (
                          <>
                            <strong>Instructor feedback</strong>
                            <p>{s.feedback}</p>
                          </>
                        )}
                      </div>
                    )}
                    {!staff && (
                      <Button
                        disabled={
                          s?.score >= 0 || new Date(a.due_at) < new Date()
                        }
                        icon={ArrowUpRight}
                        onClick={() =>
                          edit(
                            s ? "Update submission" : "Submit assignment",
                            [
                              [
                                "body",
                                "Explain your solution",
                                "textarea",
                                true,
                              ],
                              [
                                "url",
                                "Repository / work URL (optional)",
                                "url",
                              ],
                            ],
                            { body: s?.body || "", url: s?.url || "" },
                            `assignments/${a.id}/submit`,
                          )
                        }
                      >
                        {s?.score >= 0
                          ? "Graded & locked"
                          : s
                            ? "Update submission"
                            : "Submit your work"}
                      </Button>
                    )}
                  </article>
                );
              })}
              {!assignments.length && <Empty title="No assignments yet" />}
            </div>
          )}
          {tab === "discussion" && (
            <div className="panel discussion-panel">
              <h2>Good questions build better understanding.</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await mutate(
                      `courses/${c.id}/discussions`,
                      "POST",
                      { body: post },
                      "Posted to the discussion",
                    );
                    setPost("");
                  } catch (e) {
                    setNotice({ text: e.message, error: true });
                  }
                }}
              >
                <label className="field">
                  Ask a question or share a discovery
                  <textarea
                    value={post}
                    maxLength={3000}
                    required
                    onChange={(e) => setPost(e.target.value)}
                    rows={3}
                  />
                </label>
                <Button icon={MessageSquare} disabled={busy}>
                  Post to discussion
                </Button>
              </form>
              <div className="discussion-feed">
                {state.discussions
                  .filter((d) => d.course_id === c.id)
                  .slice()
                  .reverse()
                  .map((d) => (
                    <article key={d.id}>
                      <span className="avatar small">
                        {initials(name(d.user_id))}
                      </span>
                      <div>
                        <strong>{name(d.user_id)}</strong>
                        <small>{dateLabel(d.created_at)}</small>
                        <p className="prose">{d.body}</p>
                      </div>
                      {(manage || d.user_id === user.id) && (
                        <button
                          className="icon-btn"
                          aria-label="Delete discussion post"
                          onClick={() =>
                            edit(
                              "Delete post",
                              [],
                              {},
                              `discussions/${d.id}`,
                              "DELETE",
                              () => ({}),
                              "Remove this post from the course discussion.",
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </article>
                  ))}
              </div>
            </div>
          )}
          {tab === "manage" && manage && (
            <>
              <div className="form-note">
                <strong>Curriculum publishing</strong>
                <p>
                  {locked
                    ? "This curriculum is locked because students are enrolled. You can still update course details, grade work, and archive the course."
                    : "Add and review your lessons, questions, and assignments before publishing. The first enrollment locks assessment requirements."}
                </p>
              </div>
              {[
                ["lessons", lessons],
                ["questions", questions],
                ["assignments", assignments],
              ].map(([type, items]) => (
                <section className="panel curriculum-section" key={type}>
                  <div className="section-heading">
                    <h2>{type[0].toUpperCase() + type.slice(1)}</h2>
                    <Button
                      disabled={locked}
                      className="secondary"
                      icon={Plus}
                      onClick={() => contentEdit(type)}
                    >
                      Add {type.slice(0, -1)}
                    </Button>
                  </div>
                  {items.map((item) => (
                    <div className="curriculum-row" key={item.id}>
                      <span>{item.title || item.prompt}</span>
                      <div>
                        <button
                          className="icon-btn"
                          disabled={locked}
                          aria-label={`Edit ${item.title || item.prompt}`}
                          onClick={() => contentEdit(type, item)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-btn danger"
                          disabled={locked}
                          aria-label={`Delete ${item.title || item.prompt}`}
                          onClick={() =>
                            edit(
                              "Delete curriculum item",
                              [],
                              {},
                              `${type}/${item.id}`,
                              "DELETE",
                              () => ({}),
                              "This removes the item from this course.",
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!items.length && <p className="muted">Nothing added yet.</p>}
                </section>
              ))}
              <div className="section-heading">
                <h2>Student submissions</h2>
              </div>
              <SubmissionList
                submissions={state.submissions.filter(
                  (s) => s.course_id === c.id,
                )}
                {...{ state, name, edit }}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
