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
  const sections = info.sections
    .map((s) => {
      const lines = [`- Name: ${s.name}`, `  Description: ${s.description}`];
      if (s.purpose) lines.push(`  Purpose (why this matters to the user): ${s.purpose}`);
      if (s.context) lines.push(`  Important context: ${s.context}`);
      if (s.role) lines.push(`  Role: ${s.role}`);
      if (s.steps && s.steps.length > 0) {
        lines.push(`  Steps: ${s.steps.join(" / ")}`);
      }
      if (s.commonMistake) lines.push(`  Common mistake: ${s.commonMistake}`);
      return lines.join("\n");
    })
    .join("\n\n");

  const roleInfo =
    info.roles && info.roles.length > 1
      ? `The app has multiple user roles: ${info.roles.join(", ")}.`
      : "";

  const loginInfo = info.hasLogin
    ? "The app requires users to log in. Include a login section with numbered steps."
    : "";

  const logoutInfo = info.hasLogout
    ? "The app has a logout option. Include a logout section with numbered steps."
    : "";

  const orderedStepsInfo =
    info.orderedSteps && info.orderedSteps.length > 0
      ? `Before using the app, users must complete these steps in order: ${info.orderedSteps.join(", ")}.`
      : "";

  const supportInfo = info.supportContact
    ? `Support contact: ${info.supportContact}`
    : "No specific support contact. Tell users to contact whoever gave them access.";

  return `
You are writing a user guide for a software application. Your audience is: ${info.audience}.
Write in plain, friendly language. Do not use technical jargon. Be concise and direct.
Write the entire guide in ${language}. This is mandatory regardless of the language of the input.

Project: ${info.name}
What it does: ${info.summary}${info.benefit ? `\nWhy it is useful: ${info.benefit}` : ''}
How users access it: ${info.entryPoint}
${roleInfo}
${loginInfo}
${logoutInfo}
${orderedStepsInfo}

Sections of the app:
${sections}

${supportInfo}

Instructions:
- Write a complete user guide in Markdown.
- Use ## for main sections and ### for subsections.
- ${info.roles && info.roles.length > 1 ? `Group sections under "## Funciones para [role]" headers for each role. Sections available to everyone go under "## Funciones generales".` : ""}
- Write a thorough, complete user guide. Each section should be well developed — not a single line.
- Start with an introduction paragraph (2-3 sentences) that explains what the app is, who it is for, and why it is useful. Use the summary, audience, and benefit fields.
- For each section, write a full paragraph (3-5 sentences) that explains what the user can do, why it matters, and how it fits into their workflow. Use the description, purpose, and context fields to build this out. Do not just repeat the input verbatim.
- If a section has steps, use a numbered list. Write each step as a clear, actionable instruction with enough detail that a non-technical user can follow it without guessing.
- If a section has important context, weave it naturally into the section text or add it as a callout.
- For common mistakes, use a blockquote starting with > **Nota:**. Explain why it matters, not just what to avoid.
- Do not invent features, screens, or behavior that were not described.
- Closing phrases in the support section are allowed if they feel natural and helpful.
- Do not add a "Technologies used" section.
- Do not add an "Author" section.
- End with a support section. If a contact was provided, use it as a mailto link.
- Output only the Markdown. No preamble, no explanation.
`.trim();
}

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------

export async function generateGuide(info: ProjectInfo, apiKey: string, language: string = "Spanish"): Promise<string> {
  const prompt = buildPrompt(info, language);

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error("Invalid Groq API key. Run docgen again to enter a new one.");
    }
    if (response.status === 429) {
      throw new Error("Groq rate limit reached. Wait a moment and try again.");
    }
    throw new Error(`Groq API error (${response.status}): ${error}`);
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response.");

  return content.trim();
}