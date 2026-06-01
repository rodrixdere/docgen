// docgen/src/core/scanner/detect.ts
// Pure detection functions — no I/O, no terminal output.

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, extname, basename } from "path";

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

export function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function readText(path: string): string {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
}

export function collectFiles(dir: string, extensions: string[], maxDepth = 6, depth = 0): string[] {
  if (depth > maxDepth || !existsSync(dir)) return [];
  const results: string[] = [];
  let entries: string[] = [];
  try { entries = readdirSync(dir); } catch { return []; }

  const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".next", ".git", "coverage"]);

  for (const entry of entries) {
    if (entry.startsWith(".") || SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...collectFiles(full, extensions, maxDepth, depth + 1));
    } else if (extensions.includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Framework detection
// ---------------------------------------------------------------------------

export type Framework = "react" | "next" | "nuxt" | "vue" | "svelte" | "angular" | "express" | "unknown";

interface PackageJsonDeps {
  name?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function detectFramework(root: string): Framework {
  const pkg = readJson<PackageJsonDeps>(join(root, "package.json"));
  if (!pkg) return "unknown";
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["next"]) return "next";
  if (deps["nuxt"] || deps["nuxt3"]) return "nuxt";
  if (deps["@sveltejs/kit"] || deps["svelte"]) return "svelte";
  if (deps["@angular/core"]) return "angular";
  if (deps["vue"]) return "vue";
  if (deps["express"] || deps["fastify"] || deps["koa"]) return "express";
  if (deps["react"]) return "react";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Role detection — dynamic, not hardcoded
// ---------------------------------------------------------------------------

// Folders that are clearly NOT roles — structural, technical, or auth-related
const NON_ROLE_FOLDERS = new Set([
  "components", "hooks", "utils", "helpers", "lib", "libs",
  "assets", "images", "icons", "styles", "css", "scss",
  "config", "configs", "context", "contexts", "store", "stores",
  "services", "api", "types", "interfaces", "models",
  "layout", "layouts", "common", "shared", "ui", "modals",
  "tabs", "forms", "tables", "charts", "widgets",
  "public", "static", "dist", "build", "node_modules",
  // auth/login folders are not roles
  "auth", "authentication", "login", "signin", "signup",
  // i18n/direction folders are not roles
  "rtl", "ltr", "i18n", "locales", "locale",
  // data/config folders are not roles
  "variables", "constants", "data", "mocks", "fixtures", "theme",
]);

export function isRoleFolder(name: string): boolean {
  return !NON_ROLE_FOLDERS.has(name.toLowerCase());
}

export function detectRolesFromFolders(root: string): string[] {
  const roles = new Set<string>();
  const dirsToSearch = [
    "pages", "views", "screens", "layouts", "scenes",
    "src/pages", "src/views", "src/screens", "src/layouts", "src/scenes",
  ];
  const PAGE_EXTENSIONS = new Set([".jsx", ".tsx", ".vue", ".svelte", ".js", ".ts"]);

  for (const dir of dirsToSearch) {
    const full = join(root, dir);
    if (!existsSync(full)) continue;
    try {
      const entries = readdirSync(full);
      for (const entry of entries) {
        const entryPath = join(full, entry);
        let stat;
        try { stat = statSync(entryPath); } catch { continue; }
        if (!stat.isDirectory()) continue;
        if (NON_ROLE_FOLDERS.has(entry.toLowerCase())) continue;

        // Check if this folder contains page-like files
        let hasPages = false;
        try {
          const children = readdirSync(entryPath);
          hasPages = children.some(c => PAGE_EXTENSIONS.has(extname(c)));
        } catch { continue; }

        if (hasPages) roles.add(entry.toLowerCase());
      }
    } catch { continue; }
  }

  return Array.from(roles);
}

export function detectRolesFromCode(files: string[]): string[] {
  const roles = new Set<string>();
  const patterns = [
    // Direct comparisons — role/rol/userRole variants
    /\brol\b\s*===?\s*['"`](\w+)['"`]/g,
    /\brole\b\s*===?\s*['"`](\w+)['"`]/g,
    /\brole\b\s*!==?\s*['"`](\w+)['"`]/g,
    /userRole\s*===?\s*['"`](\w+)['"`]/g,
    /hasRole\(['"`](\w+)['"`]\)/g,
    /roles\.includes\(['"`](\w+)['"`]\)/g,
    /user\.role\s*===?\s*['"`](\w+)['"`]/g,
    // Route/component-based role guards — covers PrivateRoute rol="admin" patterns
    /\brol\s*=\s*['"`](\w+)['"`]/g,
    /requiredRole\s*[:=]\s*['"`](\w+)['"`]/g,
    /allowedRoles\s*[:=]\s*\[([^\]]+)\]/g,
    /roles\s*[:=]\s*\[\s*['"`](\w+)['"`]/g,
  ];
  const skip = new Set(["string", "undefined", "null", "number", "boolean", "object", "any"]);

  for (const file of files.slice(0, 60)) {
    const raw = readText(file);
    // Strip comments so role strings inside comments don't get detected
    const content = raw
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Array patterns like allowedRoles: ["admin", "profesor"] capture the whole list
        const raw = match[1];
        const values = raw.includes(",") || raw.includes('"') || raw.includes("'")
          ? raw.match(/['"`](\w+)['"`]/g)?.map(s => s.replace(/['"`]/g, "")) ?? []
          : [raw];
        for (const role of values) {
          const r = role.toLowerCase();
          if (!skip.has(r) && r.length > 2) roles.add(r);
        }
      }
    }
  }

  return Array.from(roles);
}

// ---------------------------------------------------------------------------
// Auth detection
// ---------------------------------------------------------------------------

export function detectAuth(files: string[], root: string): { hasLogin: boolean; hasLogout: boolean } {
  const loginFileNames = new Set(["login", "signin", "sign-in", "auth", "loginpage", "signinpage", "authpage"]);
  const logoutPatterns = [/logout/i, /signout/i, /sign-out/i];
  const authIndicators = ["authcontext", "authmiddleware", "useauth", "authcontroller", "auth.routes", "authroutes"];

  let hasLogin = false;
  let hasLogout = false;

  for (const file of files) {
    const base = basename(file, extname(file)).toLowerCase();
    if (loginFileNames.has(base)) hasLogin = true;
    if (authIndicators.some(a => base.includes(a))) hasLogin = true;
    if (logoutPatterns.some(p => p.test(base))) hasLogout = true;
  }

  // Also detect auth from folder structure — covers index.jsx-based patterns
  // where the file is named "index" but lives inside an auth/signin folder
  if (!hasLogin) {
    const authDirs = [
      "auth", "src/auth",
      "pages/auth", "src/pages/auth",
      "views/auth", "src/views/auth",
      "layouts/auth", "src/layouts/auth",
    ];
    hasLogin = authDirs.some(d => existsSync(join(root, d)));
  }

  if (!hasLogout) {
    for (const file of files.slice(0, 40)) {
      const content = readText(file);
      if (logoutPatterns.some(p => p.test(content))) {
        hasLogout = true;
        break;
      }
    }
  }

  return { hasLogin, hasLogout };
}

// ---------------------------------------------------------------------------
// Name and summary detection
// ---------------------------------------------------------------------------

const GENERIC_NAMES = new Set([
  "frontend", "backend", "client", "server", "app", "web", "ui", "api",
  "project", "myapp", "my-app", "template", "starter", "boilerplate",
]);

export function detectNameAndSummary(root: string): { name?: string; summary?: string } {
  const pkg = readJson<PackageJsonDeps>(join(root, "package.json"));
  const rawName = pkg?.name?.trim().toLowerCase();
  let name = (!rawName || GENERIC_NAMES.has(rawName))
    ? undefined
    : pkg?.name?.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim();
  let summary = pkg?.description?.trim();

  // Try README for a better summary
  const readmePath = ["README.md", "readme.md", "Readme.md"]
    .map(f => join(root, f))
    .find(existsSync);

  if (readmePath && (!summary || summary.length < 20)) {
    const readme = readText(readmePath);
    const firstParagraph = readme
      .split("\n")
      .filter(l => {
        const t = l.trim();
        return t && !t.startsWith("#") && !t.startsWith("!")
          && !t.startsWith(">") && !t.startsWith("[")
          && !t.startsWith("<") && !t.startsWith("|");
      })
      .find(l => l.trim().length > 20);
    if (firstParagraph) summary = firstParagraph.trim();
  }

  return { name, summary };
}