#!/usr/bin/env node
// docwizard/src/index.ts

import chalk from "chalk";
import logSymbols from "log-symbols";
import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { confirm } from "@inquirer/prompts";

import { ensureApiKey } from "./cli/setup.js";
import { askLanguage, getTranslator, askRequired, askSupportContact } from "./cli/prompts.js";
import { generateGuide } from "./core/generator.js";
import { ProjectInfo } from "./core/builder.js";
import { scanProject } from "./core/scanner/index.js";

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(): { outputPath: string; scanPath: string; update: boolean; help: boolean } {
  const args = process.argv.slice(2);
  let outputPath = "USER_GUIDE.md";
  let scanPath = ".";
  let update = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scan" && args[i + 1]) {
      scanPath = args[++i];
    } else if (args[i] === "--update") {
      update = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      help = true;
    } else if (!args[i].startsWith("--")) {
      outputPath = args[i];
    }
  }

  return { outputPath, scanPath, update, help };
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function printHelp() {
  console.log();
  console.log(chalk.bold("docwizard") + chalk.dim(" — project user guide generator"));
  console.log();
  console.log(chalk.bold("Usage:"));
  console.log("  docwizard                          Scan current directory, generate USER_GUIDE.md");
  console.log("  docwizard [output]                 Write guide to a custom file");
  console.log("  docwizard --scan <path>            Scan a specific project directory");
  console.log("  docwizard [output] --scan <path>   Custom output + custom scan path");
  console.log("  docwizard --update                 Update docwizard to the latest version");
  console.log("  docwizard --help                   Show this help message");
  console.log();
  console.log(chalk.bold("Examples:"));
  console.log(chalk.dim("  docwizard"));
  console.log(chalk.dim("  docwizard guide.md"));
  console.log(chalk.dim('  docwizard --scan ../my-project'));
  console.log(chalk.dim('  docwizard guide.md --scan ../my-project'));
  console.log();
  console.log(chalk.bold("Config:"));
  console.log("  API key is stored at " + chalk.cyan("~/.docgen/config.json"));
  console.log("  Set " + chalk.cyan("GROQ_API_KEY") + " env var to skip the config file.");
  console.log();
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

function runUpdate() {
  console.log();
  console.log(chalk.dim("  Updating docwizard..."));
  try {
    execSync("npm install -g docwizard@latest", { stdio: "inherit" });
    console.log();
    console.log(logSymbols.success, "docwizard updated successfully.");
  } catch {
    console.error(logSymbols.error, "Update failed. Try running manually:");
    console.error(chalk.dim("    npm install -g docwizard@latest"));
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { outputPath, scanPath, update, help } = parseArgs();

  if (help) {
    printHelp();
    return;
  }

  if (update) {
    runUpdate();
    return;
  }

  console.log();
  console.log(chalk.bold("docwizard"));
  console.log(chalk.dim("Scans your project and generates a plain-language user guide."));
  console.log();

  const apiKey = await ensureApiKey();
  const { lang, label: langLabel } = await askLanguage();
  const tr = getTranslator(lang);

  // -- Scan --
  const root = resolve(scanPath);
  console.log();
  console.log(logSymbols.info, chalk.dim(`Scanning ${root}...`));
  const scanned = scanProject(root);
  console.log(logSymbols.success, "Scan complete.");

  if (scanned.name)           console.log(chalk.dim(`  Name: ${scanned.name}`));
  if (scanned.roles?.length)  console.log(chalk.dim(`  Roles: ${scanned.roles.join(", ")}`));
  if (scanned.hasLogin)       console.log(chalk.dim(`  Login detected.`));
  if (scanned.sections?.length) {
    const sectionSummary = scanned.sections.map(s => {
      if (s.subsections?.length) {
        return `${s.name} (${s.subsections.map(sub => sub.name).join(", ")})`;
      }
      return s.name;
    }).join(" | ");
    console.log(chalk.dim(`  Sections: ${sectionSummary}`));
  }
  console.log();

  // -- Ask only what scanner couldn't infer --
  const name = scanned.name ?? await askRequired(tr("projectName"), lang);
  const summary = scanned.summary ?? await askRequired(tr("whatDoesItDo"), lang);
  const audience = scanned.roles?.join(", ") ?? await askRequired(tr("whoUsesIt" as any), lang, 5);
  const entryPoint = scanned.hasLogin
    ? "The user accesses the application by logging in with their credentials."
    : await askRequired(tr("howAccess" as any), lang);
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
      const { writeConfig } = await import("./config/config.js");
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