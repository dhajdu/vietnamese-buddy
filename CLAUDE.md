# Vietnamese Buddy — Project Instructions

This file is the entry point Claude Code reads when this repo is opened. It defines roles, folder conventions, and publishing/engineering workflows.

## Stack
- Website: Next.js + Tailwind + shadcn (`website/`)
- Database: Supabase (`website/supabase/`)
- Deployment: Vercel (auto-deploys when a PR merges to `main` — nobody pushes to `main` directly)

<!-- BEGIN: AGENT-DELEGATION (managed by infiniteleverage skills — do not delete this block) -->
## Agent delegation (auto-routing)

When you receive a request, **delegate to the right specialist agent** before doing the work yourself. The 4 agents and their triggers:

| Agent | Delegate when the request involves… |
|---|---|
| **product-manager** | roadmap, vision, epics, daily plan, project-status.html, scope changes, approval triage, stakeholder updates |
| **developer** | writing/changing code, fixing bugs, refactoring, scaffolding pages, API endpoints, Supabase migrations, env-vars wiring, **publishing posts to the live site** |
| **qa** | testing, regression checks, browser matrix, accessibility, QA plans, "verify this works" |
| **devops** | CI/CD, deployments, secret management, infra escalations, Vercel/GitHub workflow issues |

**Delegation rules:**
1. Pick exactly **one** agent per turn — don't run two in parallel unless the operator explicitly says so.
2. If a request spans agents (e.g., "build it *and* verify it"), call them **in sequence**: developer → qa.
3. If unclear which agent fits, **ask the operator** before assuming.
4. Cross-cutting engineering rules live in `.claude/rules/global-engineering.md` — every agent honors them.
5. Project-level persona overrides for each agent live in `agents/<name>/context/persona.md` — read these on first invocation.
6. Trigger phrases: `@product-manager`, `@developer`, etc. — but auto-route even without the `@` when intent is clear.
<!-- END: AGENT-DELEGATION -->


## Folder conventions
See `FOLDER-STRUCTURE.md` at the project root for the canonical structure every project follows. Agents MUST honor it — do not invent new top-level folders.

## Publishing workflow
Read source content from `content/topics/<slug>/` → optimize images → the developer runs `web-publisher-publish` (writes the App Router page under `website/app/blog/`, updates the blog index, commits on a `publish/{slug}` branch, opens a PR, verifies the Vercel build).

