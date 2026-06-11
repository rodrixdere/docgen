#!/usr/bin/env node
// docwizard/src/index.ts

import chalk from "chalk";
import logSymbols from "log-symbols";
import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { confirm } from "@inquirer/prompts";

import { ensureApiKey } from "./cli/setup.js";
import { askLanguage, resolveLang, getTranslator, askRequired, askOptional, askSupportContact, Lang } from "./cli/prompts.js";
import { t, LANGUAGES } from "./i18n/strings.js";
import { generateGuide } from "./core/generator.js";
import { ProjectInfo } from "./core/builder.js";
import { scanProject } from "./core/scanner/index.js";
import { writeConfig, resolveDefaultLang } from "./config/config.js";

// ---------------------------------------------------------------------------
// Language resolution
// ---------------------------------------------------------------------------

// Resolves the language for this run:
// 1. --lang + --scan → use for this run only, do not save
// 2. --lang only     → save as new default and exit
// 3. No flag         → use saved default, or ask if none saved
async function resolveLanguage(
  langFlag: string | null,
  hasScanFlag: boolean,
): Promise<{ lang: Lang; label: string }> {
  if (langFlag) {
    const resolved = resolveLang(langFlag);
    if (!hasScanFlag) {
      writeConfig({ defaultLang: langFlag.toLowerCase() });
    }
    return resolved;
  }

  const saved = resolveDefaultLang();
  if (saved) {
    const resolved = resolveLang(saved);
    console.log(chalk.dim(`  ${t(resolved.lang, "langDefault", { lang: resolved.label })}`));
    return resolved;
  }

  // No flag, no saved default — ask interactively and save
  const result = await askLanguage();
  writeConfig({ defaultLang: result.label.toLowerCase() });
  return result;
}

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let outputPath = "USER_GUIDE.md";
  let scanPath = ".";
  let update = false;
  let help = false;
  let resetKey = false;
  let langFlag: string | null = null;
  let hasScanFlag = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scan" && args[i + 1]) {
      scanPath = args[++i];
      hasScanFlag = true;
    } else if (args[i] === "--update") {
      update = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      help = true;
    } else if (args[i] === "--reset-key") {
      resetKey = true;
    } else if (args[i] === "--lang" && args[i + 1]) {
      langFlag = args[++i];
    } else if (!args[i].startsWith("--")) {
      outputPath = args[i];
    }
  }

  return { outputPath, scanPath, update, help, resetKey, langFlag, hasScanFlag };
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function printHelp(lang: Lang = "en") {
  console.log();
  console.log(chalk.bold("docwizard") + chalk.dim(" — " + t(lang, "helpTitle").replace("docwizard — ", "")));
  console.log();
  console.log(chalk.bold(t(lang, "helpUsage")));
  console.log(t(lang, "helpCmd1"));
  console.log(t(lang, "helpCmd2"));
  console.log(t(lang, "helpCmd3"));
  console.log(t(lang, "helpCmd4"));
  console.log(t(lang, "helpCmd5"));
  console.log(t(lang, "helpCmd6"));
  console.log(t(lang, "helpCmd7"));
  console.log(t(lang, "helpCmd8"));
  console.log();
  console.log(chalk.bold(t(lang, "helpLangs")));
  console.log(chalk.dim("  " + LANGUAGES.map(l => l.label).join(", ")));
  console.log();
  console.log(chalk.bold(t(lang, "helpExamples")));
  console.log(chalk.dim("  docwizard"));
  console.log(chalk.dim("  docwizard --lang spanish"));
  console.log(chalk.dim("  docwizard --lang chinese --scan ../my-project"));
  console.log(chalk.dim("  docwizard guide.md --scan ../my-project"));
  console.log();
  console.log(chalk.bold(t(lang, "helpConfig")));
  console.log(t(lang, "helpConfigPath").replace("~/.docgen/config.json", chalk.cyan("~/.docgen/config.json")));
  console.log(t(lang, "helpConfigEnv").replace("GROQ_API_KEY", chalk.cyan("GROQ_API_KEY")));
  console.log();
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

function runUpdate(lang: Lang = "en") {
  console.log();
  console.log(chalk.dim("  Updating docwizard..."));
  try {
    execSync("npm install -g docwizard@latest", { stdio: "inherit" });
    console.log();
    console.log(logSymbols.success, t(lang, "helpUpdateOk"));
  } catch {
    console.error(logSymbols.error, t(lang, "helpUpdateFail"));
    console.error(chalk.dim("    npm install -g docwizard@latest"));
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Reset key
// ---------------------------------------------------------------------------

function runResetKey(lang: Lang = "en") {
  writeConfig({ groqApiKey: "" });
  console.log();
  console.log(logSymbols.success, t(lang, "helpKeyCleared"));
  console.log();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { outputPath, scanPath, update, help, resetKey, langFlag, hasScanFlag } = parseArgs();

  const savedLang = resolveDefaultLang();
  const uiLang: Lang = savedLang ? (resolveLang(savedLang).lang) : "en";
  if (help)     { printHelp(uiLang);   return; }
  if (update)   { runUpdate(uiLang);   return; }
  if (resetKey) { runResetKey(uiLang); return; }

  // --lang without --scan → just set default and exit
  if (langFlag && !hasScanFlag) {
    const resolved = resolveLang(langFlag);
    writeConfig({ defaultLang: langFlag.toLowerCase() });
    console.log();
    console.log(logSymbols.success, t(resolved.lang, "langSaved", { lang: resolved.label }));
    console.log();
    return;
  }

  console.log();
  console.log(chalk.bold("docwizard"));
  console.log(chalk.dim("Scans your project and generates a plain-language user guide."));
  console.log();

  const apiKey = await ensureApiKey();
  const { lang, label: langLabel } = await resolveLanguage(langFlag, hasScanFlag);
  const tr = getTranslator(lang);

  // -- Scan --
  const root = resolve(scanPath);
  console.log();
  console.log(logSymbols.info, chalk.dim(t(lang, "scanning", { path: root })));
  const scanned = scanProject(root);
  console.log(logSymbols.success, t(lang, "scanComplete"));

  if (scanned.name)          console.log(chalk.dim(`  Name: ${scanned.name}`));
  if (scanned.roles?.length) console.log(chalk.dim(`  Roles: ${scanned.roles.join(", ")}`));
  if (scanned.hasLogin)      console.log(chalk.dim(`  Login detected.`));
  if (scanned.sections?.length) {
    const sectionSummary = scanned.sections.map(s =>
      s.subsections?.length
        ? `${s.name} (${s.subsections.map(sub => sub.name).join(", ")})`
        : s.name
    ).join(" | ");
    console.log(chalk.dim(`  Sections: ${sectionSummary}`));
  }
  console.log();

  // -- Ask only what scanner couldn't infer --
  const name       = scanned.name    ?? await askRequired(tr("projectName"), lang);
  const summary    = scanned.summary ?? await askRequired(tr("whatDoesItDo"), lang);
  const audience   = scanned.roles?.join(", ") ?? await askRequired(t(lang, "whoUsesIt"), lang, 5);
  const entryPoint = scanned.hasLogin
    ? "The user accesses the application by logging in with their credentials."
    : await askRequired(t(lang, "howAccess"), lang);
  const supportContact = await askSupportContact(lang);

  const info: ProjectInfo = {
    name,
    summary,
    audience,
    entryPoint,
    roles: scanned.roles,
    sections: scanned.sections ?? [],
    hasLogin: scanned.hasLogin,
    hasLogout: scanned.hasLogout,
    supportContact,
  };

  // -- Overwrite check --
  const fullPath = resolve(outputPath);
  if (existsSync(fullPath)) {
    console.log();
    const overwrite = await confirm({
      message: tr("fileExists", { file: outputPath }),
      default: false,
    });
    if (!overwrite) {
      console.log(chalk.dim(tr("aborted")));
      console.log();
      return;
    }
  }

  // -- Generate --
  console.log();
  process.stdout.write(chalk.dim(tr("generatingGuide")));

  let guide: string;
  try {
    guide = await generateGuide(info, apiKey, langLabel);
  } catch (err: any) {
    console.log();
    console.error(logSymbols.error, err.message);
    if (err.message.includes("Invalid Groq API key")) {
      writeConfig({ groqApiKey: "" });
      console.log(chalk.dim("  Saved key has been cleared. Run docwizard again to enter a new one."));
    }
    console.log();
    process.exit(1);
  }

  process.stdout.write(chalk.green(tr("done") + "\n"));
  writeFileSync(fullPath, guide, "utf-8");
  console.log();
  console.log(logSymbols.success, tr("written", { file: outputPath }));
  console.log();
}

main().catch(err => {
  console.error(logSymbols.error, err.message);
  process.exit(1);
});