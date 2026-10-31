import React from "react";
import {
  Code2,
  Clock,
  Pencil,
  Plus,
  ArrowUpRight,
  Trophy,
  ExternalLink,
} from "lucide-react";
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
export default function Hackathons({
  state,
  user,
  staff,
  name,
  edit,
  editChallenge,
  act,
  busy,
}) {
  return (
    <div className="challenge-list">
      {state.challenges.map((c) => {
        const teams = state.teams.filter((t) => t.challenge_id === c.id),
          membership = state.memberships.find(
            (m) => m.challenge_id === c.id && m.user_id === user.id,
          ),
          canJudge = user.role === "admin" || (staff && c.owner_id === user.id),
          isOpen = c.status === "open" && new Date(c.deadline) > new Date();
        return (
          <section className="challenge panel" key={c.id}>
            <div className="challenge-heading">
              <div className="challenge-icon">
                <Code2 size={30} />
              </div>
              <div>
                <Badge tone={isOpen ? "mint" : "peach"}>
                  {isOpen ? "OPEN FOR BUILDERS" : "CLOSED"}
                </Badge>
                <h2>{c.title}</h2>
                <p>
                  <Clock size={15} /> Due {dateLabel(c.deadline)}{" "}
                  <span>· Teams of up to {c.max_members}</span>
                </p>
              </div>
              {canJudge && (
                <Button
                  className="secondary"
                  icon={Pencil}
                  onClick={() => editChallenge(c)}
                >
                  Edit
                </Button>
              )}
            </div>
            <div className="prose">{c.description}</div>
            <div className="section-heading">
              <h3>{teams.length} teams in the arena</h3>
              {!staff && !membership && isOpen && (
                <Button
                  icon={Plus}
                  onClick={() =>
                    edit(
                      "Create your team",
                      [["name", "Team name", "text", true]],
                      { name: "" },
                      `challenges/${c.id}/teams`,
                    )
                  }
                >
                  Create team
                </Button>
              )}
            </div>
            <div className="team-grid">
              {teams.map((t) => {
                const members = state.memberships.filter(
                    (m) => m.team_id === t.id,
                  ),
                  project = state.projects.find((p) => p.team_id === t.id),
                  mine = membership?.team_id === t.id,
                  captain = t.captain_id === user.id;
                return (
                  <article
                    className={`team-card ${mine ? "my-team" : ""}`}
                    key={t.id}
                  >
                    <div className="section-heading">
                      <h3>{t.name}</h3>
                      {mine && <Badge tone="mint">YOUR TEAM</Badge>}
                    </div>
                    <p className="muted">Captain: {name(t.captain_id)}</p>
                    <div className="team-members">
                      {members.map((m) => (
                        <span
                          className="avatar small"
                          key={m.id}
                          title={name(m.user_id)}
                        >
                          {initials(name(m.user_id))}
                        </span>
                      ))}
                      <small>
                        {members.length}/{c.max_members} members
                      </small>
                    </div>
                    <ul className="member-names">
                      {members.map((m) => (
                        <li key={m.id}>{name(m.user_id)}</li>
                      ))}
                    </ul>
                    {project && (
                      <div className="project-preview">
                        <Badge tone={project.score >= 0 ? "mint" : "violet"}>
                          {project.score >= 0
                            ? `${project.score}/100 · Judged`
                            : "Project submitted"}
                        </Badge>
                        <h4>{project.title}</h4>
                        <p className="prose">{project.description}</p>
                        <div className="project-links">
                          <a
                            href={project.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Repository <ExternalLink size={13} />
                          </a>
                          {project.demo_url && (
                            <a
                              href={project.demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Live demo <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                        {project.feedback && (
                          <div className="feedback">
                            <strong>Judge feedback</strong>
                            <p>{project.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="team-actions">
                      {!staff &&
                        !membership &&
                        isOpen &&
                        !project &&
                        members.length < c.max_members && (
                          <Button
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              act(
                                `teams/${t.id}/join`,
                                "POST",
                                {},
                                "You joined the team",
                              )
                            }
                          >
                            Join team
                          </Button>
                        )}
                      {mine && !captain && !project && isOpen && (
                        <Button
                          className="secondary"
                          disabled={busy}
                          onClick={() =>
                            act(
                              `teams/${t.id}/leave`,
                              "POST",
                              {},
                              "You left the team",
                            )
                          }
                        >
                          Leave team
                        </Button>
                      )}
                      {captain && isOpen && (!project || project.score < 0) && (
                        <Button
                          icon={ArrowUpRight}
                          onClick={() =>
                            edit(
                              project
                                ? "Update team project"
                                : "Submit team project",
                              projectFields,
                              project || {
                                title: "",
                                description: "",
                                repo_url: "",
                                demo_url: "",
                              },
                              `teams/${t.id}/project`,
                            )
                          }
                        >
                          {project ? "Update project" : "Submit project"}
                        </Button>
                      )}
                      {canJudge && project && (
                        <Button
                          className="secondary"
                          icon={Trophy}
                          onClick={() =>
                            edit(
                              "Judge project",
                              [
                                ["score", "Score (0–100)", "number", true],
                                [
                                  "feedback",
                                  "Judging feedback",
                                  "textarea",
                                  true,
                                ],
                              ],
                              {
                                score: Math.max(0, project.score),
                                feedback: project.feedback,
                              },
                              `projects/${project.id}/grade`,
                            )
                          }
                        >
                          Judge
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {!teams.length && (
              <p className="muted">
                The first team could be yours. Start with a name and a shared
                idea.
              </p>
            )}
          </section>
        );
      })}
      {!state.challenges.length && (
        <Empty
          title="The next challenge is on its way"
          text="An instructor or admin can launch the first campus challenge."
        />
      )}
    </div>
  );
}
