// docgen/src/cli/setup.ts
// Runs on first use when no API key is found.
// Guides the dev through getting a free Groq key and saves it to disk.

import { input } from "@inquirer/prompts";
import chalk from "chalk";
import { writeConfig, resolveApiKey } from "../config/config.js";

const GROQ_CONSOLE_URL = "https://console.groq.com/keys";

export async function ensureApiKey(): Promise<string> {
  const existing = resolveApiKey();
  if (existing) return existing;

  console.log();
  console.log(chalk.yellow("  docgen needs a Groq API key to generate your guide."));
  console.log(chalk.dim("  Groq is free — no credit card required."));
  console.log();
  console.log("  Steps:");
  console.log(`  1. Open ${chalk.cyan(GROQ_CONSOLE_URL)}`);
  console.log("  2. Sign in or create a free account.");
  console.log('  3. Click "Create API key", give it any name.');
  console.log("  4. Copy the key and paste it below.");
  console.log();

  let key = "";
  while (!isValidKey(key)) {
    key = (await input({ message: "  Paste your Groq API key:" })).trim();
    if (!isValidKey(key)) {
      console.log(chalk.yellow("  That doesn't look like a valid key. It should start with 'gsk_'."));
    }
  }

  writeConfig({ groqApiKey: key });

  console.log();
  console.log(chalk.green("  Key saved to ~/.docgen/config.json"));
  console.log(chalk.dim("  You won't be asked again."));
  console.log();

  return key;
}

function isValidKey(key: string): boolean {
  return key.startsWith("gsk_") && key.length > 20;
}