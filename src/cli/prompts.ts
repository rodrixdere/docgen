// docgen/src/cli/prompts.ts
// Terminal input functions for the scan flow only.

import { input } from "@inquirer/prompts";
import chalk from "chalk";

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

type Lang = "en" | "es";

const SUPPORTED_LANGUAGES: Record<string, Lang> = {
  english: "en",
  español: "es",
  spanish: "es",
  es:      "es",
  en:      "en",
};

const t: Record<Lang, Record<string, string>> = {
  en: {
    projectName:     "Project name:",
    whatDoesItDo:    "What does it do?",
    supportContact:  "Support contact:",
    optional:        "(optional)",
    minChars:        "Minimum {n} characters required.",
    generatingGuide: "  Generating guide...",
    done:            " done",
    fileExists:      "{file} already exists. Overwrite it?",
    aborted:         "  Aborted. No file was written.",
    written:         "  ✓ {file} written.",
  },
  es: {
    projectName:     "Nombre del proyecto:",
    whatDoesItDo:    "¿Qué hace?",
    supportContact:  "Contacto de soporte:",
    optional:        "(opcional)",
    minChars:        "Mínimo {n} caracteres requeridos.",
    generatingGuide: "  Generando guía...",
    done:            " listo",
    fileExists:      "{file} ya existe. ¿Sobreescribir?",
    aborted:         "  Cancelado. No se escribió ningún archivo.",
    written:         "  ✓ {file} escrito.",
  },
};

export function tr(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  let str = t[lang][key] ?? t["en"][key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v));
  }
  return str;
}

export type { Lang };

// ---------------------------------------------------------------------------
// Language selection — always in English, runs before everything else
// ---------------------------------------------------------------------------

export async function askLanguage(): Promise<{ lang: Lang; label: string }> {
  const answer = (await input({
    message: "Guide language:",
    default: "Spanish/English",
  })).trim().toLowerCase() || "spanish";

  const lang: Lang = SUPPORTED_LANGUAGES[answer] ?? "en";
  const label = answer.charAt(0).toUpperCase() + answer.slice(1);
  return { lang, label };
}

export function getTranslator(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => tr(lang, key, vars ?? {});
}

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------

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

export async function askOptional(message: string, lang: Lang): Promise<string | undefined> {
  const answer = (await input({
    message: `${message} ${chalk.dim(tr(lang, "optional"))}`,
  })).trim();
  return answer.length > 0 ? answer : undefined;
}

export async function askSupportContact(lang: Lang): Promise<string | undefined> {
  console.log();
  return askOptional(tr(lang, "supportContact"), lang);
}