#!/usr/bin/env node
// docgen/src/index.ts

import chalk from "chalk";
import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { confirm } from "@inquirer/prompts";

import { ensureApiKey } from "./cli/setup.js";
import {
  askLanguage,
  getTranslator,
  askBasicInfo,
  askAuthInfo,
  askRoles,
  askSections,
  askOrderedSteps,
  askSupportContact,
} from "./cli/prompts.js";
import { generateGuide } from "./core/generator.js";
import { ProjectInfo } from "./core/builder.js";

async function main() {
  const outputPath = process.argv[2] ?? "USER_GUIDE.md";

  console.log();
  console.log(chalk.bold("docgen"));
  console.log(chalk.dim("Generates a plain-language user guide for your project."));
  console.log();

  // -- API key (always in English, runs before language selection) --
  const apiKey = await ensureApiKey();

  // -- Language --
  const { lang, label } = await askLanguage();
  const tr = getTranslator(lang);

  // -- Collect info --
  const { name, summary, benefit, audience, entryPoint } = await askBasicInfo(lang);
  const { hasLogin, hasLogout } = await askAuthInfo(lang);
  const roles = await askRoles(audience, lang);
  const sections = await askSections(roles, lang);
  const orderedSteps = await askOrderedSteps(lang);
  const supportContact = await askSupportContact(lang);

  const info: ProjectInfo = {
    name,
    summary,
    benefit,
    audience,
    roles,
    entryPoint,
    sections,
    hasLogin,
    hasLogout,
    orderedSteps,
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
    guide = await generateGuide(info, apiKey, label);
  } catch (err: any) {
    console.log();
    console.error(chalk.red(`\n  ✖ ${err.message}`));

    if (err.message.includes("Invalid Groq API key")) {
      const { writeConfig } = await import("./config/config.js");
      writeConfig({ groqApiKey: "" });
      console.log(chalk.dim("  Saved key has been cleared. Run docgen again to enter a new one."));
    }

    console.log();
    process.exit(1);
  }

  process.stdout.write(chalk.green(tr("done") + "\n"));

  // -- Write --
  writeFileSync(fullPath, guide, "utf-8");

  console.log();
  console.log(chalk.green(tr("written", { file: outputPath })));
  console.log();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});