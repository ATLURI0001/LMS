import React from "react";
import { Pencil, ExternalLink } from "lucide-react";
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
export default function SubmissionList({ submissions, state, name, edit }) {
  return (
    <div className="submission-list">
      {submissions.map((s) => {
        const a = state.assignments.find((a) => a.id === s.assignment_id);
        return (
          <article className="panel submission" key={s.id}>
            <div className="section-heading">
              <div>
                <Badge tone={s.score < 0 ? "peach" : "mint"}>
                  {s.score < 0
                    ? "Awaiting review"
                    : `${s.score} / ${a?.max_score}`}
                </Badge>
                <h3>{a?.title}</h3>
                <span className="muted">
                  {name(s.user_id)} · {dateLabel(s.created_at)}
                </span>
              </div>
              <Button
                className="secondary"
                icon={Pencil}
                onClick={() =>
                  edit(
                    "Review submission",
                    [
                      ["score", `Score (0–${a?.max_score})`, "number", true],
                      ["feedback", "Feedback", "textarea", true],
                    ],
                    { score: s.score < 0 ? 0 : s.score, feedback: s.feedback },
                    `submissions/${s.id}/grade`,
                  )
                }
              >
                Grade
              </Button>
            </div>
            <p className="prose">{s.body}</p>
            {s.url && (
              <a
                className="external-link"
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open submitted work <ExternalLink size={15} />
              </a>
            )}
            {s.feedback && (
              <div className="feedback">
                <strong>Feedback</strong>
                <p>{s.feedback}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
