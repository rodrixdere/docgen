// docgen/src/cli/prompts.ts
// All terminal input functions. No business logic here.

import { input, confirm, number, select } from "@inquirer/prompts";
import chalk from "chalk";
import { Section } from "../core/builder.js";

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
    guideLanguage:          "Guide language:",
    projectName:            "Project name:",
    whatDoesItDo:           "What does it do?",
    whoUsesIt:              "Who is going to use it?",
    howAccess:              "How does a user access it for the first time?",
    requiresLogin:          "Does the app require users to log in?",
    hasLogout:              "Does it have a logout option?",
    detectedRoles:          "Detected multiple roles:",
    differentSections:      "Do different users have access to different sections?",
    describeSections:       "Describe the main sections of your app.",
    howManySections:        "How many sections does it have?",
    sectionOf:              "Section {i} of {total}",
    sectionName:            "  Name:",
    sectionDesc:            "  What can the user do here?",
    whoAccess:              "  Who can access this section?",
    everyone:               "Everyone",
    hasSteps:               "  Does this section involve a sequence of steps?",
    listSteps:              "  List the steps, separated by commas:",
    commonMistake:          "  Any common mistake or thing the user should NOT do?",
    prereqSteps:            "Are there steps the user must complete before using the app?",
    listPrereqSteps:        "List those steps, separated by commas:",
    supportContact:         "Support contact:",
    sectionPurpose:         "  What problem does this solve for the user?",
    sectionContext:         "  Anything important the user should know before using this section?",
    appBenefit:             "What makes it useful or different from doing this manually?",
    optional:               "(optional)",
    minChars:               "Minimum {n} characters required.",
    generatingGuide:        "  Generating guide...",
    done:                   " done",
    fileExists:             "{file} already exists. Overwrite it?",
    aborted:                "  Aborted. No file was written.",
    written:                "  {file} written.",
  },
  es: {
    guideLanguage:          "Idioma de la guía:",
    projectName:            "Nombre del proyecto:",
    whatDoesItDo:           "¿Qué hace?",
    whoUsesIt:              "¿Quién lo va a usar?",
    howAccess:              "¿Cómo accede un usuario por primera vez?",
    requiresLogin:          "¿La app requiere que los usuarios inicien sesión?",
    hasLogout:              "¿Tiene opción para cerrar sesión?",
    detectedRoles:          "Roles detectados:",
    differentSections:      "¿Distintos usuarios tienen acceso a distintas secciones?",
    describeSections:       "Describe las secciones principales de tu app.",
    howManySections:        "¿Cuántas secciones tiene?",
    sectionOf:              "Sección {i} de {total}",
    sectionName:            "  Nombre:",
    sectionDesc:            "  ¿Qué puede hacer el usuario aquí?",
    whoAccess:              "  ¿Quién puede acceder a esta sección?",
    everyone:               "Todos",
    hasSteps:               "  ¿Esta sección implica una secuencia de pasos?",
    listSteps:              "  Lista los pasos, separados por comas:",
    commonMistake:          "  ¿Algún error común o algo que el usuario NO debe hacer?",
    prereqSteps:            "¿Hay pasos que el usuario debe completar antes de usar la app?",
    listPrereqSteps:        "Lista esos pasos, separados por comas:",
    supportContact:         "Contacto de soporte:",
    sectionPurpose:         "  ¿Qué problema resuelve esto para el usuario?",
    sectionContext:         "  ¿Algo importante que el usuario deba saber antes de usar esta sección?",
    appBenefit:             "¿Qué lo hace útil o diferente a hacerlo manualmente?",
    optional:               "(opcional)",
    minChars:               "Mínimo {n} caracteres requeridos.",
    generatingGuide:        "  Generando guía...",
    done:                   " listo",
    fileExists:             "{file} ya existe. ¿Sobreescribir?",
    aborted:                "  Cancelado. No se escribió ningún archivo.",
    written:                "  {file} escrito.",
  },
};

function tr(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  let str = t[lang][key] ?? t["en"][key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v));
  }
  return str;
}

// ---------------------------------------------------------------------------
// Base helpers
// ---------------------------------------------------------------------------

export async function ask(message: string): Promise<string> {
  const answer = await input({ message });
  return answer.trim();
}

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
  const answer = await input({
    message: `${message} ${chalk.dim(tr(lang, "optional"))}`,
  });
  const trimmed = answer.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function askSteps(prompt: string): Promise<string[]> {
  const raw = await ask(prompt);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Role detection
// ---------------------------------------------------------------------------

export function parseRoles(audience: string): string[] {
  const parts = audience
    .split(/\band\b|\by\b|,/i)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parts.length > 1 ? parts : [];
}

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
// Structured question flows
// ---------------------------------------------------------------------------

export async function askBasicInfo(lang: Lang) {
  const name       = await ask(tr(lang, "projectName"));
  const summary    = await askRequired(tr(lang, "whatDoesItDo"), lang);
  const benefit    = await askOptional(tr(lang, "appBenefit"), lang);
  const audience   = await askRequired(tr(lang, "whoUsesIt"), lang, 5);
  const entryPoint = await askRequired(tr(lang, "howAccess"), lang);
  return { name, summary, benefit, audience, entryPoint };
}

export async function askAuthInfo(lang: Lang) {
  console.log();
  const hasLogin = await confirm({
    message: tr(lang, "requiresLogin"),
    default: true,
  });
  const hasLogout = hasLogin
    ? await confirm({ message: tr(lang, "hasLogout"), default: true })
    : false;
  return { hasLogin, hasLogout };
}

export async function askRoles(audience: string, lang: Lang): Promise<string[] | undefined> {
  const detected = parseRoles(audience);
  if (detected.length < 2) return undefined;

  console.log();
  console.log(chalk.dim(`${tr(lang, "detectedRoles")} ${detected.join(", ")}`));
  const confirmed = await confirm({
    message: tr(lang, "differentSections"),
    default: true,
  });
  return confirmed ? detected : undefined;
}

export async function askSections(roles: string[] | undefined, lang: Lang): Promise<Section[]> {
  console.log();
  console.log(tr(lang, "describeSections"));
  console.log();

  const sectionCount =
    (await number({
      message: tr(lang, "howManySections"),
      min: 1,
    })) ?? 1;

  const sections: Section[] = [];

  for (let i = 1; i <= sectionCount; i++) {
    console.log();
    console.log(chalk.bold(tr(lang, "sectionOf", { i, total: sectionCount })));

    const name        = await ask(tr(lang, "sectionName"));
    const description = await askRequired(tr(lang, "sectionDesc"), lang, 5);

    let role: string | undefined;
    if (roles && roles.length > 1) {
      const choice = await select({
        message: tr(lang, "whoAccess"),
        choices: [
          { name: tr(lang, "everyone"), value: "" },
          ...roles.map((r) => ({ name: r, value: r })),
        ],
      });
      role = choice || undefined;
    }

    const hasSteps = await confirm({
      message: tr(lang, "hasSteps"),
      default: false,
    });

    let steps: string[] | undefined;
    if (hasSteps) {
      steps = await askSteps(tr(lang, "listSteps"));
    }

    const commonMistake = await askOptional(tr(lang, "commonMistake"), lang);
    const purpose       = await askOptional(tr(lang, "sectionPurpose"), lang);
    const context       = await askOptional(tr(lang, "sectionContext"), lang);

    sections.push({ name, description, purpose, context, steps, commonMistake, role });
  }

  return sections;
}

export async function askOrderedSteps(lang: Lang): Promise<string[] | undefined> {
  console.log();
  const hasOrder = await confirm({
    message: tr(lang, "prereqSteps"),
    default: false,
  });
  if (!hasOrder) return undefined;
  return askSteps(tr(lang, "listPrereqSteps"));
}

export async function askSupportContact(lang: Lang): Promise<string | undefined> {
  console.log();
  return askOptional(tr(lang, "supportContact"), lang);
}