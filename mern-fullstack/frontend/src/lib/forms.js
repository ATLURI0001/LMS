export const dateLabel = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const future = () =>
  new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16);
export const initialCourse = {
  title: "",
  description: "",
  category: "Web development",
  level: "Beginner",
  color: "violet",
  status: "draft",
};
export const courseFields = [
  ["title", "Course title", "text", true],
  ["description", "What will learners build?", "textarea", true],
  ["category", "Category", "text", true],
  ["level", "Level", ["Beginner", "Intermediate", "Advanced"]],
  ["color", "Card color", ["violet", "mint", "peach", "blue"]],
  ["status", "Visibility", ["draft", "published", "archived"]],
];
export const lessonFields = [
  ["title", "Lesson title", "text", true],
  ["body", "Lesson content", "textarea", true],
  ["resource_url", "Resource URL (optional)", "url"],
  ["position", "Lesson order", "number", true],
  ["minutes", "Estimated minutes", "number", true],
];
export const assignmentFields = [
  ["title", "Assignment title", "text", true],
  ["description", "Instructions", "textarea", true],
  ["due_at", "Deadline (your local time)", "datetime-local", true],
  ["max_score", "Maximum score", "number", true],
];
export const questionFields = [
  ["prompt", "Question", "textarea", true],
  ["option0", "Option A", "text", true],
  ["option1", "Option B", "text", true],
  ["option2", "Option C", "text", true],
  ["option3", "Option D", "text", true],
  ["correct", "Correct option (0=A, 1=B, 2=C, 3=D)", "number", true],
  ["explanation", "Answer explanation", "textarea", true],
];
export const challengeFields = [
  ["title", "Challenge title", "text", true],
  ["description", "Brief and judging criteria", "textarea", true],
  ["max_members", "Maximum team members", "number", true],
  ["deadline", "Deadline (your local time)", "datetime-local", true],
  ["status", "Status", ["open", "closed"]],
];
export const projectFields = [
  ["title", "Project name", "text", true],
  ["description", "Problem, solution, and architecture", "textarea", true],
  ["repo_url", "Repository URL", "url", true],
  ["demo_url", "Live demo URL (optional)", "url"],
];
export const initials = (name) =>
  name
    ?.split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
