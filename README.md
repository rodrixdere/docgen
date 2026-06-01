# docwizard

Scan your project and get a plain-language `USER_GUIDE.md` in seconds.

docwizard reads your source code — folder structure, roles, sections, auth — and generates a clean user guide your clients can actually read. No templates, no copy-pasting.

Powered by [Groq](https://groq.com) — free, no credit card required.

---

## Requirements

- Node.js 18+
- A free Groq API key — get one at [console.groq.com](https://console.groq.com/keys)

## Installation

```bash
npm install -g docwizard
```

## Usage

```bash
# Scan the current directory and generate USER_GUIDE.md
docwizard

# Scan a specific project
docwizard --scan /path/to/your/project

# Generate a file with a custom name
docwizard my-guide.md

# Combine both
docwizard my-guide.md --scan /path/to/your/project

# Update to the latest version
docwizard --update

# Show available commands
docwizard --help
```

The first time you run it, docwizard will ask for your Groq API key and save it to `~/.docgen/config.json`. You won't be asked again.

## What it detects automatically

- **Framework** — React, Next.js, Vue, Nuxt, Svelte, Angular, Express
- **Sections and subsections** — from your pages, views, screens, scenes, or routes folders
- **User roles** — from role checks in your code (`role === "admin"`, `rol === "profesor"`, etc.)
- **Auth** — login and logout from file names, folder names, and code patterns
- **Project name and summary** — from `package.json` and `README.md`

Questions are only asked for what the scanner cannot infer.

## Demo

```
$ docwizard --scan ./my-app

docwizard
Scans your project and generates a plain-language user guide.

✔ Guide language: English
  Scanning /home/user/my-app...
  ✓ Scan complete.
  Name: Aula Joven
  Roles: admin, estudiante, profesor
  Login detected.
  Sections: Admin (Calendario, Estudiantes, Grupos, Profesores) | Estudiante (Actividades, Calendario, Material, Materias) | ...

✔ Project name: Aula Joven
✔ Support contact: (optional) support@aulajoven.org

  Generating guide... done

  ✓ USER_GUIDE.md written.
```

## Supported languages

Type the language name when prompted:

```
Spanish, English, French, Portuguese, Chinese, Japanese, German, Italian...
```

The guide will be written entirely in that language. The CLI prompts are available in Spanish and English — other languages fall back to English.

## Supported frameworks

| Framework | Section detection |
|-----------|------------------|
| React | `pages/`, `views/`, `screens/`, `scenes/`, `layouts/` |
| Next.js | `app/`, `pages/` |
| Vue / Nuxt | `views/`, `pages/` |
| Svelte | `routes/` |
| Angular | `*.component.ts` files |
| Express | `routes/` |

## Project structure

```
src/
├── index.ts              # Entry point — arg parsing, orchestration
├── cli/
│   ├── prompts.ts        # Terminal input functions
│   └── setup.ts          # First-run API key setup
├── core/
│   ├── builder.ts        # Data types and markdown renderer
│   ├── generator.ts      # Groq API call and prompt builder
│   └── scanner/
│       ├── index.ts      # Scan orchestrator
│       ├── detect.ts     # Framework, roles, auth, name detection
│       └── sections.ts   # Section and subsection detection
└── config/
    └── config.ts         # Read/write ~/.docgen/config.json
```

## Running locally

```bash
git clone https://github.com/your-username/docwizard.git
cd docwizard
npm install
npm run dev -- --scan /path/to/project
```

## Running tests

```bash
npm test
```

## License

MIT