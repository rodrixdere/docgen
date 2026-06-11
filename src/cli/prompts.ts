// docwizard/src/cli/prompts.ts
// Terminal input functions for the scan flow.
// All user-facing strings come from src/i18n/strings.ts.

import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import { Lang, LANGUAGES, LANG_ALIASES, t } from "../i18n/strings.js";

export type { Lang };
export { t };

// ---------------------------------------------------------------------------
// Language selection
// ---------------------------------------------------------------------------

// Presents an interactive language selector.
// Returns the resolved Lang code and a human-readable label for the generator.
export async function askLanguage(): Promise<{ lang: Lang; label: string }> {
  const choice = await select({
    message: "Guide language:",
    choices: LANGUAGES.map(l => ({ name: l.label, value: l.value })),
  });
  const found = LANGUAGES.find(l => l.value === choice);
  return { lang: found?.lang ?? "en", label: found?.label ?? choice };
}

// Resolves a language from a string (e.g. "spanish", "es", "zh").
// Falls back to English if the input is not recognized.
export function resolveLang(input: string): { lang: Lang; label: string } {
  const key = input.trim().toLowerCase();
  const lang = LANG_ALIASES[key] ?? "en";
  const found = LANGUAGES.find(l => l.lang === lang);
  return { lang, label: found?.label ?? input.charAt(0).toUpperCase() + input.slice(1) };
}

// Returns a translation helper bound to a specific language.
export function getTranslator(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => t(lang, key, vars ?? {});
}

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------

// Prompts for a required string. Re-prompts until the minimum length is met.
export async function askRequired(message: string, lang: Lang, minLength = 10): Promise<string> {
  let answer = "";
  while (answer.length < minLength) {
    answer = (await input({ message })).trim();
    if (answer.length < minLength) {
      console.log(chalk.yellow(`  ${t(lang, "minChars", { n: minLength })}`));
    }
  }
  return answer;
}

// Prompts for an optional string. Returns undefined if the user leaves it blank.
export async function askOptional(message: string, lang: Lang): Promise<string | undefined> {
  const answer = (await input({
    message: `${message} ${chalk.dim(t(lang, "optional"))}`,
  })).trim();
  return answer.length > 0 ? answer : undefined;
}

// Prompts for an optional support contact.
export async function askSupportContact(lang: Lang): Promise<string | undefined> {
  console.log();
  return askOptional(t(lang, "supportContact"), lang);
}