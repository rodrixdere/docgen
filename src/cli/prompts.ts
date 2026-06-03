// docwizard/src/cli/prompts.ts
// Terminal input functions for the scan flow.
// Only asks what the scanner could not infer from the project.

import { input } from "@inquirer/prompts";
import chalk from "chalk";

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

// Supported UI languages for CLI prompts.
// The guide itself can be written in any language — this only controls the prompts.
type Lang = "en" | "es";

// Maps user input to a supported Lang code.
const SUPPORTED_LANGUAGES: Record<string, Lang> = {
  english: "en",
  español: "es",
  spanish: "es",
  es:      "es",
  en:      "en",
};

// All user-facing strings indexed by language and key.
const t: Record<Lang, Record<string, string>> = {
  en: {
    projectName:     "Project name:",
    whatDoesItDo:    "What does it do?",
    whoUsesIt:       "Who is going to use it?",
    howAccess:       "How does a user access it for the first time?",
    supportContact:  "Support contact:",
    optional:        "(optional)",
    minChars:        "Minimum {n} characters required.",
    generatingGuide: "  Generating guide...",
    done:            " done",
    fileExists:      "{file} already exists. Overwrite it?",
    aborted:         "  Aborted. No file was written.",
    written:         "{file} written.",
  },
  es: {
    projectName:     "Nombre del proyecto:",
    whatDoesItDo:    "¿Qué hace?",
    whoUsesIt:       "¿Quién lo va a usar?",
    howAccess:       "¿Cómo accede un usuario por primera vez?",
    supportContact:  "Contacto de soporte:",
    optional:        "(opcional)",
    minChars:        "Mínimo {n} caracteres requeridos.",
    generatingGuide: "  Generando guía...",
    done:            " listo",
    fileExists:      "{file} ya existe. ¿Sobreescribir?",
    aborted:         "  Cancelado. No se escribió ningún archivo.",
    written:         "{file} escrito.",
  },
};

// Resolves a translation string by language and key.
// Falls back to English if the key is missing in the target language.
// Supports simple variable interpolation via {varName} placeholders.
export function tr(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  let str = t[lang][key] ?? t["en"][key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v));
  }
  return str;
}

export type { Lang };

// ---------------------------------------------------------------------------
// Language selection
// ---------------------------------------------------------------------------

// Always runs in English before anything else.
// Returns both the internal Lang code and a human-readable label for the generator prompt.
export async function askLanguage(): Promise<{ lang: Lang; label: string }> {
  const answer = (await input({
    message: "Guide language:",
    default: "Spanish/English",
  })).trim().toLowerCase() || "spanish";

  const lang: Lang = SUPPORTED_LANGUAGES[answer] ?? "en";
  const label = answer.charAt(0).toUpperCase() + answer.slice(1);
  return { lang, label };
}

// Returns a translation helper bound to a specific language.
// Used in index.ts to avoid passing lang to every tr() call.
export function getTranslator(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => tr(lang, key, vars ?? {});
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
      console.log(chalk.yellow(`  ${tr(lang, "minChars", { n: minLength })}`));
    }
  }
  return answer;
}

// Prompts for an optional string. Returns undefined if the user leaves it blank.
export async function askOptional(message: string, lang: Lang): Promise<string | undefined> {
  const answer = (await input({
    message: `${message} ${chalk.dim(tr(lang, "optional"))}`,
  })).trim();
  return answer.length > 0 ? answer : undefined;
}

// Prompts for an optional support contact (email, name, URL, etc.).
export async function askSupportContact(lang: Lang): Promise<string | undefined> {
  console.log();
  return askOptional(tr(lang, "supportContact"), lang);
}