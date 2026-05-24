# docwizard

Answer a few questions about your project and get a plain-language `USER_GUIDE.md` instantly.

Powered by [Groq](https://groq.com) — free, no credit card required.

---

## What it does

`docwizard` walks you through a short CLI interview about your app — what it does, who uses it, what sections it has — and generates a clean, readable user guide written in natural language.

No templates. No copy-pasting. Just answer the questions and get a guide your client can actually read.

## Requirements

- Node.js 18+
- A free Groq API key — get one at [console.groq.com](https://console.groq.com/keys)

## Installation

```bash
npm install -g docwizard
```

## Usage

```bash
# Generate USER_GUIDE.md in the current directory
docgen

# Generate a file with a custom name
docgen my-guide.md
```

The first time you run it, docwizard will ask for your Groq API key and save it to `~/.docgen/config.json`. You won't be asked again.

## Demo

```
docgen
Generates a plain-language user guide for your project.

Guide language: English
Project name: ShiftBoard
What does it do? A scheduling tool that lets managers create and publish weekly work shifts
What makes it useful or different from doing this manually? Replaces spreadsheets and group chats — staff get notified automatically when their schedule is published
Who is going to use it? managers and employees
How does a user access it for the first time? Your HR manager sends you an invitation link by email to create your account

Does the app require users to log in? Yes
Does it have a logout option? Yes

Detected multiple roles: managers, employees
Do different users have access to different sections? Yes

Describe the main sections of your app.
How many sections does it have? 2

Section 1 of 2
  Name: Schedule
  What can the user do here? View the current and upcoming weekly shifts assigned to them
  Who can access this section? employees
  Does this section involve a sequence of steps? No
  Any common mistake or thing the user should NOT do? (optional)
  What problem does this solve for the user? Employees always know when they work without having to ask or check a group chat
  Anything important the user should know before using this section? Shifts are published every Sunday for the following week

Section 2 of 2
  Name: Shift builder
  What can the user do here? Create, edit and publish the weekly shift schedule for the team
  Who can access this section? managers
  Does this section involve a sequence of steps? Yes
  List the steps, separated by commas: Open Shift builder, select the week, assign employees to each time slot, press Publish
  Any common mistake or thing the user should NOT do? Publishing notifies all staff immediately — review the schedule before confirming
  What problem does this solve for the user? Managers can build the full week schedule in minutes instead of manually coordinating over messages
  Anything important the user should know before using this section? (optional)

Are there steps the user must complete before using the app? No
Support contact: help@shiftboard.io

  Generating guide... done

  USER_GUIDE.md written.
```

The generated `USER_GUIDE.md`:

```markdown
# ShiftBoard — User Guide

ShiftBoard is a scheduling tool designed for managers and employees to simplify
the creation and distribution of weekly work shifts. Instead of coordinating over
spreadsheets or group chats, ShiftBoard gives everyone a single place to see and
manage the schedule — with automatic notifications when something changes.

## Getting started

Your HR manager will send you an invitation link by email. Follow the link to
create your account and access the platform.

## Login

...

## Features for employees

### Schedule

The Schedule section shows your current and upcoming weekly shifts in one place.
You no longer need to ask a manager or check a group chat to know when you work —
your shifts are always up to date here. New schedules are published every Sunday
for the following week, so you can plan ahead with confidence.

## Features for managers

### Shift builder

The Shift builder is where managers create and publish the weekly schedule for
the entire team. Instead of building shifts manually across messages or files,
you can assign every employee to their time slots in a single view and publish
with one click — automatically notifying all staff.

To build and publish a schedule:

1. Open the Shift builder section.
2. Select the week you want to schedule.
3. Assign employees to each available time slot.
4. Press Publish to send the schedule to your team.

> **Note:** Publishing notifies all staff immediately. Review the full schedule
> carefully before confirming — changes after publishing may cause confusion.

## Support

If you run into any issues, reach out to [help@shiftboard.io](mailto:help@shiftboard.io).
```

## Supported languages

When asked for the guide language, type the language name in English:

```
Spanish, English, French, Portuguese, Chinese, Japanese, German, Italian...
```

The guide will be written in that language. The CLI questions are available in Spanish and English — other languages fall back to English.

## Project structure

```
src/
├── index.ts           # Entry point, orchestrates the flow
├── cli/
│   ├── prompts.ts     # All terminal input functions
│   └── setup.ts       # First-run API key setup
├── core/
│   ├── builder.ts     # Data types and markdown fallback
│   └── generator.ts   # Groq API call and prompt
└── config/
    └── config.ts      # Read/write ~/.docgen/config.json
```

## Running tests

```bash
npm test
```

## License

MIT