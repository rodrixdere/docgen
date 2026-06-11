// docwizard/src/config/config.ts
// Reads and writes ~/.docgen/config.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".docgen");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export interface DocgenConfig {
  groqApiKey: string;
  defaultLang?: string; // e.g. "spanish", "english", "chinese"
}

export function readConfig(): DocgenConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.groqApiKey === "string" && parsed.groqApiKey.length > 0) {
      return parsed as DocgenConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeConfig(config: Partial<DocgenConfig>): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  // Merge with existing config so we don't overwrite unrelated fields
  const existing = readConfig() ?? { groqApiKey: "" };
  const merged = { ...existing, ...config };
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
}

export function resolveApiKey(): string | null {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  const config = readConfig();
  return config?.groqApiKey ?? null;
}

// Returns the saved default language, or null if none is set.
export function resolveDefaultLang(): string | null {
  const config = readConfig();
  return config?.defaultLang ?? null;
}