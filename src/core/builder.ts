// docgen/src/core/builder.ts

export interface Section {
  name: string;
  description: string;
  purpose?: string;
  context?: string;
  steps?: string[];
  commonMistake?: string;
  role?: string;
  subsections?: Section[];
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

function renderSection(section: Section, level = 3): string {
  const lines: string[] = [];
  const hashes = "#".repeat(level);

  lines.push(`${hashes} ${section.name}\n`);
  lines.push(`${normalizeText(section.description)}\n`);

  if (section.steps?.length) {
    section.steps.forEach((step, i) => {
      lines.push(`${i + 1}. ${normalizeText(step)}`);
    });
    lines.push("");
  }

  if (section.commonMistake) {
    lines.push(`> **Nota:** ${normalizeText(section.commonMistake)}\n`);
  }

  if (section.subsections?.length) {
    for (const sub of section.subsections) {
      lines.push(renderSection(sub, level + 1));
    }
  }

  return lines.join("\n");
}

export function buildUserGuide(info: ProjectInfo): string {
  const lines: string[] = [];

  lines.push(`# ${info.name} — Guía de usuario\n`);
  lines.push(`${normalizeText(info.summary)}\n`);
  lines.push(`**¿Para quién es esta guía?** ${info.audience}\n`);
  lines.push("---\n");

  lines.push("## Cómo acceder\n");
  lines.push(`${normalizeText(info.entryPoint)}\n`);

  if (info.orderedSteps?.length) {
    lines.push("## Antes de comenzar\n");
    lines.push("Complete los siguientes pasos en orden:\n");
    info.orderedSteps.forEach((step, i) => {
      lines.push(`${i + 1}. ${normalizeText(step)}`);
    });
    lines.push("");
  }

  if (info.hasLogin) {
    lines.push("## Inicio de sesión\n");
    lines.push("Para acceder a la plataforma:\n");
    lines.push("1. Abra la aplicación en su navegador.");
    lines.push("2. Ingrese su correo electrónico y contraseña.");
    lines.push("3. Presione el botón Iniciar sesión.\n");
  }

  const hasRoles = info.roles && info.roles.length > 1;

  if (hasRoles) {
    const general = info.sections.filter(s => !s.role);
    const roleGroups = info.roles!.map(role => ({
      role,
      sections: info.sections.filter(s => s.role === role),
    }));

    if (general.length > 0) {
      lines.push("## Funciones generales\n");
      for (const section of general) lines.push(renderSection(section));
    }

    for (const group of roleGroups) {
      if (!group.sections.length) continue;
      lines.push(`## Funciones para ${group.role}\n`);
      for (const section of group.sections) lines.push(renderSection(section));
    }
  } else {
    lines.push("## ¿Qué puedes hacer?\n");
    for (const section of info.sections) lines.push(renderSection(section));
  }

  if (info.hasLogout) {
    lines.push("## Cerrar sesión\n");
    lines.push("Para salir de su cuenta:\n");
    lines.push("1. Abra el menú principal.");
    lines.push("2. Presione Cerrar sesión.\n");
  }

  lines.push("---\n");
  lines.push("## Soporte\n");
  if (info.supportContact) {
    lines.push(`Si tiene algún problema, comuníquese con: ${info.supportContact}`);
  } else {
    lines.push("Si tiene algún problema, comuníquese con la persona que le dio acceso a esta aplicación.");
  }

  return lines.join("\n");
}