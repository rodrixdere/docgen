// docgen/src/core/scanner/sections.ts
// Detects app sections and subsections from source files per framework.

import { existsSync } from "fs";
import { join, extname, basename, dirname, relative, normalize } from "path";
import { Section } from "../builder.js";
import { collectFiles, isRoleFolder, Framework } from "./detect.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUFFIX_WORDS = new Set([
  "page", "view", "screen", "dashboard", "tab",
  "component", "controller", "route", "panel", "layout",
]);

const SKIP_FILE_NAMES = new Set([
  "app", "main", "layout", "error", "not-found",
  "notfound", "404", "_app", "_document", "loading",
  // NOTE: "index" is intentionally removed from this set.
  // index.jsx/tsx is a common pattern for section entry points (e.g. views/admin/profile/index.jsx).
  // We handle index files specially in collectRawFiles: use the parent folder name as the label.
]);

const SKIP_FILE_PATTERNS = /^(login|signin|sign-in|auth|register|signup|sign-up|loginpage|signinpage|authpage)$/i;

// Folder names that are structural/technical — not user-facing roles or sections
const NON_SECTION_FOLDERS = new Set([
  "components", "hooks", "utils", "helpers", "lib", "libs",
  "assets", "images", "icons", "styles", "css", "scss",
  "config", "configs", "context", "contexts", "store", "stores",
  "services", "api", "types", "interfaces", "models",
  "layout", "layouts", "common", "shared", "ui", "modals",
  "tabs", "forms", "tables", "charts", "widgets",
  "public", "static", "dist", "build", "node_modules",
  "variables", "constants", "data", "mocks", "fixtures",
  // auth/i18n folders are not sections
  "auth", "authentication", "login", "signin", "signup",
  "rtl", "ltr", "i18n", "locales", "locale",
]);

// ---------------------------------------------------------------------------
// Label normalization
// ---------------------------------------------------------------------------

export function fileNameToLabel(name: string, detectedRoles: string[]): string {
  const roleSet = new Set(detectedRoles.map(r => r.toLowerCase()));

  const words = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  // Remove trailing suffix word
  if (words.length > 1 && SUFFIX_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }

  // Only remove leading role word if at least 2 words remain after removal.
  // Prevents "EstudianteDashboard" → remove suffix → ["Estudiante"] → remove role → "" (empty).
  if (words.length >= 2 && (roleSet.has(words[0].toLowerCase()) || isRoleFolder(words[0]))) {
    words.shift();
  }

  if (!words.length) return "";

  return words
    .map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(" ");
}

function isTabFile(base: string): boolean {
  return /Tab$/i.test(base);
}

// ---------------------------------------------------------------------------
// Raw file collection
// ---------------------------------------------------------------------------

interface RawFile {
  base: string;       // the label source: folder name (for index files) or filename
  file: string;
  role?: string;
  isTab: boolean;
  parentDir: string;  // used for parent lookup in subsection building
}

function collectRawFiles(searchDir: string, roles: string[]): RawFile[] {
  const normalizedSearchDir = normalize(searchDir);
  const files = collectFiles(normalizedSearchDir, [".jsx", ".tsx", ".vue", ".svelte"]);
  const result: RawFile[] = [];

  for (const file of files) {
    const normalizedFile = normalize(file);
    const base = basename(normalizedFile, extname(normalizedFile));
    const parentDir = dirname(normalizedFile);
    const parentFolderName = basename(parentDir);

    // --- index file: use parent folder name as label instead of "index" ---
    if (base.toLowerCase() === "index") {
      // Skip if parent folder is structural/auth/i18n
      if (NON_SECTION_FOLDERS.has(parentFolderName.toLowerCase())) continue;
      // Skip if parent folder is a known role (it's a role root, not a section)
      if (roles.includes(parentFolderName.toLowerCase())) continue;
      // Skip auth-like folder names
      if (SKIP_FILE_PATTERNS.test(parentFolderName)) continue;

      const rel = relative(normalizedSearchDir, normalizedFile);
      const parts = rel.split(/[/\\]/).filter(Boolean);
      const roleFolder = parts.find(p => roles.includes(p.toLowerCase()));
      const role = roleFolder?.toLowerCase();

      result.push({
        base: parentFolderName,   // use folder name as the label source
        file: normalizedFile,
        role,
        isTab: isTabFile(parentFolderName),
        parentDir,
      });
      continue;
    }

    // --- regular named file ---
    if (SKIP_FILE_NAMES.has(base.toLowerCase())) continue;
    if (SKIP_FILE_PATTERNS.test(base)) continue;
    if (roles.map(r => r.toLowerCase()).includes(base.toLowerCase())) continue;

    const rel = relative(normalizedSearchDir, normalizedFile);
    const parts = rel.split(/[/\\]/).filter(Boolean);
    const roleFolder = parts.find(p => isRoleFolder(p) || roles.includes(p.toLowerCase()));
    const role = roleFolder?.toLowerCase();

    result.push({
      base,
      file: normalizedFile,
      role,
      isTab: isTabFile(base),
      parentDir,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Section builder with subsections
// ---------------------------------------------------------------------------

function findParentSection(dir: string, sectionByDir: Map<string, Section>): Section | undefined {
  const parent = dirname(dir);
  if (!parent || parent === dir) return undefined;
  return sectionByDir.get(parent) ?? findParentSection(parent, sectionByDir);
}

function buildSectionsWithSubsections(rawFiles: RawFile[], roles: string[]): Section[] {
  const sections: Section[] = [];
  const sectionByDir = new Map<string, Section>();
  const seen = new Set<string>();

  // First pass: non-tab files become top-level sections
  for (const raw of rawFiles) {
    if (raw.isTab) continue;

    const label = fileNameToLabel(raw.base, roles);
    const sectionName = label || (raw.role ? `Main (${raw.role})` : null);
    if (!sectionName) continue;

    const seenKey = `${raw.role ?? ""}:${sectionName.toLowerCase()}`;
    if (seen.has(seenKey)) continue;
    seen.add(seenKey);

    const section: Section = {
      name: sectionName,
      description: `${sectionName} section.`,
      role: roles.length > 1 ? raw.role : undefined,
    };

    sections.push(section);

    // Register this section for parentDir AND all ancestors so that tab files
    // in subdirectories can find their parent via findParentSection.
    let dir = raw.parentDir;
    while (dir && !sectionByDir.has(dir)) {
      sectionByDir.set(dir, section);
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  // Second pass: tab files become subsections of their nearest parent section
  for (const raw of rawFiles) {
    if (!raw.isTab) continue;

    const label = fileNameToLabel(raw.base, roles);
    if (!label) continue;

    const parent = sectionByDir.get(raw.parentDir) ?? findParentSection(raw.parentDir, sectionByDir);

    const sub: Section = {
      name: label,
      description: `${label} subsection.`,
    };

    if (parent) {
      parent.subsections = parent.subsections ?? [];
      parent.subsections.push(sub);
    } else {
      // No parent found — promote to top-level section
      const seenKey = `${raw.role ?? ""}:${label.toLowerCase()}`;
      if (seen.has(seenKey)) continue;
      seen.add(seenKey);
      sections.push({
        name: label,
        description: `${label} section.`,
        role: roles.length > 1 ? raw.role : undefined,
      });
    }
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Per-framework detectors
// ---------------------------------------------------------------------------

export function detectSectionsReact(root: string, roles: string[]): Section[] {
  const pageDirs = [
    "pages", "views", "screens", "layouts", "scenes",
    "src/pages", "src/views", "src/screens", "src/layouts", "src/scenes",
  ];

  const allRaw: RawFile[] = [];
  for (const dir of pageDirs) {
    const full = join(root, dir);
    if (!existsSync(full)) continue;
    allRaw.push(...collectRawFiles(full, roles));
  }

  return buildSectionsWithSubsections(allRaw, roles);
}

export function detectSectionsNext(root: string, roles: string[]): Section[] {
  const candidates = [
    join(root, "app"),
    join(root, "src", "app"),
    join(root, "pages"),
    join(root, "src", "pages"),
  ];
  const searchDir = candidates.find(existsSync) ?? null;
  if (!searchDir) return detectSectionsReact(root, roles);

  const rawFiles = collectRawFiles(searchDir, roles);
  return buildSectionsWithSubsections(rawFiles, roles);
}

export function detectSectionsExpress(root: string): Section[] {
  const sections: Section[] = [];
  const seen = new Set<string>();
  const routeDirs = ["routes", "src/routes", "api/routes", "src/api", "api"];

  for (const dir of routeDirs) {
    const full = join(root, dir);
    if (!existsSync(full)) continue;

    const files = collectFiles(full, [".js", ".ts"]);
    for (const file of files) {
      const raw = basename(file, extname(file)).replace(/\.routes?$/i, "");
      if (SKIP_FILE_NAMES.has(raw.toLowerCase())) continue;

      const label = fileNameToLabel(raw, []);
      if (!label || seen.has(label.toLowerCase())) continue;
      seen.add(label.toLowerCase());

      sections.push({ name: label, description: `${label} section.` });
    }
  }

  return sections;
}

export function detectSectionsAngular(root: string, roles: string[]): Section[] {
  const sections: Section[] = [];
  const seen = new Set<string>();
  const SKIP = new Set(["app", "root", "layout", "shell", "auth", "login"]);

  const files = collectFiles(root, [".ts"]);
  for (const file of files) {
    if (!file.endsWith(".component.ts")) continue;
    const base = basename(file, ".component.ts");
    if (SKIP.has(base.toLowerCase())) continue;

    const label = fileNameToLabel(base, roles);
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());

    sections.push({ name: label, description: `${label} section.` });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function detectSections(root: string, framework: Framework, roles: string[]): Section[] {
  switch (framework) {
    case "next":    return detectSectionsNext(root, roles);
    case "express": return detectSectionsExpress(root);
    case "angular": return detectSectionsAngular(root, roles);
    default:        return detectSectionsReact(root, roles);
  }
}