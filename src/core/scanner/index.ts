// docgen/src/core/scanner/index.ts
// Orchestrates the full project scan. No terminal I/O.

import { collectFiles, detectFramework, detectRolesFromCode, detectAuth, detectNameAndSummary } from "./detect.js";
import { detectSections } from "./sections.js";
import { ProjectInfo } from "../builder.js";

export type PartialProjectInfo = Partial<ProjectInfo> & {
  missing: (keyof ProjectInfo)[];
};

export function scanProject(root: string): PartialProjectInfo {
  const framework = detectFramework(root);
  const { name, summary } = detectNameAndSummary(root);

  const extensions = [".jsx", ".tsx", ".js", ".ts", ".vue", ".svelte"];
  const allFiles = collectFiles(root, extensions);

  // Role detection — code-based only.
  // Folder names are ambiguous (views/admin/ could be a role or a feature module).
  // Only explicit role strings in code are reliable signals.
  // Patterns covered: rol===, role===, PrivateRoute rol=, allowedRoles, etc.
  const codeRoles = detectRolesFromCode(allFiles);
  const SKIP_ROLES = new Set(["user", "users"]);
  const roles = codeRoles.filter(r => !SKIP_ROLES.has(r) && r.length >= 2)
    .filter((_, __, arr) => arr.length >= 2);

  // Auth — pass root so folder-based auth detection works
  const { hasLogin, hasLogout } = detectAuth(allFiles, root);

  // Sections
  const sections = detectSections(root, framework, roles);

  // What still needs to be asked
  const missing: (keyof ProjectInfo)[] = [];
  if (!name) missing.push("name");
  if (!summary) missing.push("summary");
  missing.push("audience");
  if (!hasLogin) missing.push("entryPoint");
  if (!sections.length) missing.push("sections");
  missing.push("supportContact");

  return {
    name,
    summary,
    roles: roles.length > 1 ? roles : undefined,
    hasLogin,
    hasLogout,
    sections,
    missing,
  };
}