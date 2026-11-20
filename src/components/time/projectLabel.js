/** "001 — Title" for a project, "No project" when there is none. */
export function projectLabel(project) {
  if (!project) return "No project";
  const id = project.projectId ? `${project.projectId} — ` : "";
  return `${id}${project.title || "Untitled"}`;
}
