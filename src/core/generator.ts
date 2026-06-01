// docgen/src/core/generator.ts
// Calls Groq to turn ProjectInfo into a polished user guide.
// No terminal I/O here.

import { ProjectInfo } from "./builder.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(info: ProjectInfo, language: string): string {
  function serializeSection(s: typeof info.sections[0], indent = ""): string {
    const lines = [`${indent}- Name: ${s.name}`, `${indent}  Description: ${s.description}`];
    if (s.purpose)  lines.push(`${indent}  Purpose: ${s.purpose}`);
    if (s.context)  lines.push(`${indent}  Context: ${s.context}`);
    if (s.role)     lines.push(`${indent}  Role: ${s.role}`);
    if (s.steps?.length) lines.push(`${indent}  Steps: ${s.steps.join(" / ")}`);
    if (s.commonMistake) lines.push(`${indent}  Common mistake: ${s.commonMistake}`);
    if (s.subsections?.length) {
      lines.push(`${indent}  Subsections:`);
      for (const sub of s.subsections) {
        lines.push(serializeSection(sub, indent + "    "));
      }
    }
    return lines.join("\n");
  }

  const sections = info.sections.map(s => serializeSection(s)).join("\n\n");

  const roleInfo = info.roles?.length
    ? `The app has multiple user roles: ${info.roles.join(", ")}.`
    : "";

  const loginInfo  = info.hasLogin  ? "The app requires users to log in."  : "";
  const logoutInfo = info.hasLogout ? "The app has a logout option." : "";

  const orderedStepsInfo = info.orderedSteps?.length
    ? `Before using the app, users must complete these steps in order: ${info.orderedSteps.join(", ")}.`
    : "";

  const supportInfo = info.supportContact
    ? `Support contact: ${info.supportContact}`
    : "No specific support contact. Tell users to contact whoever gave them access.";

  const roleGroupingInstruction = info.roles?.length && info.roles.length > 1
    ? `Group sections by role using headers like "## [Role name] features" or the equivalent in ${language}. Sections with no role go under a "## General features" header or equivalent.`
    : "";

  return `
You are writing a user guide for a software application. Your audience is: ${info.audience}.
Write in plain, friendly language. No technical jargon. Be thorough and clear.
Write the ENTIRE guide in ${language}. This is mandatory — do not mix languages.

Project: ${info.name}
What it does: ${info.summary}${info.benefit ? `\nWhy it is useful: ${info.benefit}` : ""}
How users access it: ${info.entryPoint}
${roleInfo}
${loginInfo}
${logoutInfo}
${orderedStepsInfo}

Sections:
${sections}

${supportInfo}

Instructions:
- Write a complete, well-developed user guide in Markdown.
- Use ## for main sections, ### for subsections, #### for sub-subsections.
- ${roleGroupingInstruction}
- Start with a 2-3 sentence introduction: what the app is, who it is for, why it is useful.
- For each section write 3-5 sentences explaining what the user can do and why it matters. Do not just repeat the input — expand it naturally.
- For sections with steps, use a numbered list. Each step must be clear and actionable for a non-technical user.
- For common mistakes, use a blockquote: > **Note:** or the equivalent in ${language}.
- If login is detected, include a login section with numbered steps.
- If logout is detected, include a logout section with numbered steps.
- Do not invent features or behavior not described in the input.
- Do not add a "Technologies used" or "Author" section.
- End with a support section. Use a mailto link if an email was provided.
- Output only the Markdown. No preamble, no explanation outside the guide.
`.trim();
}

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------

export async function generateGuide(
  info: ProjectInfo,
  apiKey: string,
  language = "Spanish",
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: buildPrompt(info, language) }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) throw new Error("Invalid Groq API key. Run docgen again to enter a new one.");
    if (response.status === 429) throw new Error("Groq rate limit reached. Wait a moment and try again.");
    throw new Error(`Groq API error (${response.status}): ${error}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response.");

  return content.trim();
}