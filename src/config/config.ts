// docgen/src/config/config.ts
// Reads and writes ~/.docgen/config.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".docgen");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export interface DocgenConfig {
  groqApiKey: string;
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

export function writeConfig(config: DocgenConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function resolveApiKey(): string | null {
  // Env var takes priority over saved config
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  const config = readConfig();
  return config?.groqApiKey ?? null;
}