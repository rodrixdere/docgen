// docgen/src/builder.ts
// Handles data types and markdown generation — no I/O here.

export interface Section {
  name: string;
  description: string;
  purpose?: string;   // what problem does this solve for the user?
  context?: string;   // anything important to know before using this section?
  steps?: string[];
  commonMistake?: string;
  role?: string;
}

export interface ProjectInfo {
  name: string;
  summary: string;
  benefit?: string;
  audience: string;
  roles?: string[];
  entryPoint: string;
  sections: Section[];
  hasLogin?: boolean;
  hasLogout?: boolean;
  orderedSteps?: string[];
  supportContact?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return capitalized.endsWith(".") || capitalized.endsWith("?") || capitalized.endsWith("!")
    ? capitalized
    : capitalized + ".";
}

function buildLoginSection(): Section {
  return {
    name: "Inicio de sesión",
    description: "Para acceder a la plataforma:",
    steps: [
      "Abra la aplicación en su navegador.",
      "Ingrese su correo electrónico y contraseña.",
      "Presione el botón Iniciar sesión.",
    ],
  };
}

function buildLogoutSection(): Section {
  return {
    name: "Cerrar sesión",
    description: "Para salir de su cuenta:",
    steps: [
      "Abra el menú principal.",
      "Presione Cerrar sesión.",
    ],
  };
}

function renderSection(section: Section): string {
  const lines: string[] = [];

  lines.push(`### ${section.name}\n`);
  lines.push(`${normalizeText(section.description)}\n`);

  if (section.steps && section.steps.length > 0) {
    section.steps.forEach((step, i) => {
      lines.push(`${i + 1}. ${normalizeText(step)}`);
    });
    lines.push("");
  }

  if (section.commonMistake) {
    lines.push(`> **Nota:** ${normalizeText(section.commonMistake)}\n`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

export function buildUserGuide(info: ProjectInfo): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${info.name} — Guía de usuario\n`);
  lines.push(`${normalizeText(info.summary)}\n`);
  lines.push(`**¿Para quién es esta guía?** ${info.audience}\n`);
  lines.push("---\n");

  // Getting started
  lines.push("## Cómo acceder\n");
  lines.push(`${normalizeText(info.entryPoint)}\n`);

  // Pre-requisite ordered steps
  if (info.orderedSteps && info.orderedSteps.length > 0) {
    lines.push("## Antes de comenzar\n");
    lines.push("Complete los siguientes pasos en orden:\n");
    info.orderedSteps.forEach((step, i) => {
      lines.push(`${i + 1}. ${normalizeText(step)}`);
    });
    lines.push("");
  }

  // Login section (auto-generated)
  if (info.hasLogin) {
    lines.push("## Inicio de sesión\n");
    const loginSection = buildLoginSection();
    lines.push(`${normalizeText(loginSection.description)}\n`);
    loginSection.steps!.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
    lines.push("");
  }

  // Sections — grouped by role if roles are defined
  const hasRoles = info.roles && info.roles.length > 1;

  if (hasRoles) {
    // Sections with no role go first under a general header
    const general = info.sections.filter((s) => !s.role);
    const roleGroups = info.roles!.map((role) => ({
      role,
      sections: info.sections.filter((s) => s.role === role),
    }));

    if (general.length > 0) {
      lines.push("## Funciones generales\n");
      for (const section of general) {
        lines.push(renderSection(section));
      }
    }

    for (const group of roleGroups) {
      if (group.sections.length === 0) continue;
      lines.push(`## Funciones para ${group.role}\n`);
      for (const section of group.sections) {
        lines.push(renderSection(section));
      }
    }
  } else {
    lines.push("## ¿Qué puedes hacer?\n");
    for (const section of info.sections) {
      lines.push(renderSection(section));
    }
  }

  // Logout section (auto-generated)
  if (info.hasLogout) {
    lines.push("## Cerrar sesión\n");
    const logoutSection = buildLogoutSection();
    lines.push(`${normalizeText(logoutSection.description)}\n`);
    logoutSection.steps!.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
    lines.push("");
  }

  // Support
  lines.push("---\n");
  lines.push("## Soporte\n");
  if (info.supportContact) {
    lines.push(`Si tiene algún problema, comuníquese con: ${info.supportContact}`);
  } else {
    lines.push(
      "Si tiene algún problema, comuníquese con la persona que le dio acceso a esta aplicación."
    );
  }

  return lines.join("\n");
}