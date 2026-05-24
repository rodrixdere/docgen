// docgen/src/builder.test.ts

import { buildUserGuide, ProjectInfo } from "./core/builder.js";

function makeBasicInfo(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    name: "MyApp",
    summary: "A tool that helps users manage their tasks.",
    audience: "Office workers with no technical background",
    entryPoint: "Open the link you received and create an account.",
    sections: [
      { name: "Dashboard", description: "See all your tasks at a glance." },
      {
        name: "Settings",
        description: "Update your name and password.",
        commonMistake: "Do not change your email here — contact support instead.",
      },
    ],
    ...overrides,
  };
}

const tests: [string, () => void][] = [
  // -- Existing --
  ["includes project name", () => {
    const guide = buildUserGuide(makeBasicInfo());
    if (!guide.includes("MyApp")) throw new Error("Missing project name");
  }],

  ["includes summary", () => {
    const guide = buildUserGuide(makeBasicInfo());
    if (!guide.includes("manage their tasks")) throw new Error("Missing summary");
  }],

  ["includes audience", () => {
    const guide = buildUserGuide(makeBasicInfo());
    if (!guide.includes("Office workers")) throw new Error("Missing audience");
  }],

  ["includes section names", () => {
    const guide = buildUserGuide(makeBasicInfo());
    if (!guide.includes("Dashboard")) throw new Error("Missing Dashboard");
    if (!guide.includes("Settings")) throw new Error("Missing Settings");
  }],

  ["includes common mistake", () => {
    const guide = buildUserGuide(makeBasicInfo());
    if (!guide.includes("Do not change your email")) throw new Error("Missing mistake");
  }],

  ["no note block when no mistake", () => {
    const info = makeBasicInfo({
      sections: [{ name: "Home", description: "Main screen." }],
    });
    const guide = buildUserGuide(info);
    if (guide.includes("**Nota:**")) throw new Error("Should not include Nota block");
  }],

  ["includes ordered steps", () => {
    const info = makeBasicInfo({ orderedSteps: ["Create account.", "Verify email."] });
    const guide = buildUserGuide(info);
    if (!guide.includes("Create account.")) throw new Error("Missing step");
    if (!guide.includes("Antes de comenzar")) throw new Error("Missing section header");
  }],

  ["no 'Antes de comenzar' when no steps", () => {
    const guide = buildUserGuide(makeBasicInfo());
    if (guide.includes("Antes de comenzar")) throw new Error("Should not include ordered steps section");
  }],

  ["includes support contact", () => {
    const info = makeBasicInfo({ supportContact: "support@myapp.com" });
    const guide = buildUserGuide(info);
    if (!guide.includes("support@myapp.com")) throw new Error("Missing contact");
  }],

  ["default support text when none", () => {
    const guide = buildUserGuide(makeBasicInfo());
    if (!guide.includes("persona que le dio acceso")) throw new Error("Missing default support text");
  }],

  // -- Steps inside sections --
  ["renders numbered steps inside section", () => {
    const info = makeBasicInfo({
      sections: [
        {
          name: "Login",
          description: "Access the app.",
          steps: ["Open the app", "Enter your email", "Press login"],
        },
      ],
    });
    const guide = buildUserGuide(info);
    if (!guide.includes("1. Open the app")) throw new Error("Missing step 1");
    if (!guide.includes("2. Enter your email")) throw new Error("Missing step 2");
    if (!guide.includes("3. Press login")) throw new Error("Missing step 3");
  }],

  ["no numbered list when section has no steps", () => {
    const info = makeBasicInfo({
      sections: [{ name: "Dashboard", description: "See all tasks." }],
    });
    const guide = buildUserGuide(info);
    // Should not have a numbered list for this section
    if (guide.includes("1. See all tasks")) throw new Error("Should not number a description");
  }],

  // -- Login / Logout auto-sections --
  ["includes login section when hasLogin is true", () => {
    const info = makeBasicInfo({ hasLogin: true });
    const guide = buildUserGuide(info);
    if (!guide.includes("Inicio de sesión")) throw new Error("Missing login section");
    if (!guide.includes("Ingrese su correo")) throw new Error("Missing login step");
  }],

  ["no login section when hasLogin is false", () => {
    const info = makeBasicInfo({ hasLogin: false });
    const guide = buildUserGuide(info);
    if (guide.includes("Inicio de sesión")) throw new Error("Should not include login section");
  }],

  ["includes logout section when hasLogout is true", () => {
    const info = makeBasicInfo({ hasLogin: true, hasLogout: true });
    const guide = buildUserGuide(info);
    if (!guide.includes("Cerrar sesión")) throw new Error("Missing logout section");
  }],

  ["no logout section when hasLogout is false", () => {
    const info = makeBasicInfo({ hasLogin: true, hasLogout: false });
    const guide = buildUserGuide(info);
    if (guide.includes("Cerrar sesión")) throw new Error("Should not include logout section");
  }],

  // -- Role grouping --
  ["groups sections by role when roles are defined", () => {
    const info = makeBasicInfo({
      roles: ["students", "teachers"],
      sections: [
        { name: "Grades", description: "View grades.", role: "students" },
        { name: "Publish", description: "Publish content.", role: "teachers" },
      ],
    });
    const guide = buildUserGuide(info);
    if (!guide.includes("Funciones para students")) throw new Error("Missing student role header");
    if (!guide.includes("Funciones para teachers")) throw new Error("Missing teacher role header");
  }],

  ["general sections appear before role sections", () => {
    const info = makeBasicInfo({
      roles: ["students", "teachers"],
      sections: [
        { name: "Home", description: "Main screen." }, // no role
        { name: "Grades", description: "View grades.", role: "students" },
      ],
    });
    const guide = buildUserGuide(info);
    const generalIdx = guide.indexOf("Funciones generales");
    const roleIdx = guide.indexOf("Funciones para");
    if (generalIdx === -1) throw new Error("Missing general section header");
    if (generalIdx > roleIdx) throw new Error("General sections should appear before role sections");
  }],

  ["no role grouping when only one role", () => {
    const info = makeBasicInfo({
      roles: ["students"],
      sections: [{ name: "Grades", description: "View grades.", role: "students" }],
    });
    const guide = buildUserGuide(info);
    if (guide.includes("Funciones para")) throw new Error("Should not group by role with single role");
  }],

  // -- Text normalization --
  ["capitalizes first letter of summary", () => {
    const info = makeBasicInfo({ summary: "a tool for tasks." });
    const guide = buildUserGuide(info);
    if (!guide.includes("A tool for tasks.")) throw new Error("Summary not capitalized");
  }],

  ["adds period when summary has none", () => {
    const info = makeBasicInfo({ summary: "A tool for tasks" });
    const guide = buildUserGuide(info);
    if (!guide.includes("A tool for tasks.")) throw new Error("Missing period on summary");
  }],
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);