# Canonical Project Folder Structure

> **Authoritative spec.** Every Infinite Leverage project follows this layout. The PM agent, developer agent, and `il-project` skill must honor it exactly. Do not invent new top-level folders. New per-project additions go inside the existing slots.

## Fixed filenames (DO NOT rename)

These files have hard-coded names that skills and agents reference by path:

| Path | Owner | Updated by |
|------|-------|------------|
| `docs/product/product.md` | PM agent | `pm-documentation` skill |
| `docs/product/epics.md` | PM agent | `pm-epic-writing` skill |
| `docs/product/epic-status.md` | PM agent | `pm-epic-writing` skill |
| `docs/project-status.html` | PM agent | `pm-project-status` skill |
| `CLAUDE.md` | All agents | Manual / `/init` — the **root** one. `website/CLAUDE.md` is a different, create-next-app-generated file; never edit one thinking it is the other |
| `README.md` | Developer agent | Manual |
| `.gitignore` | Developer agent | Manual |
| `docs/brand/style-guide.md` | All agents | Manual (PM-guided during setup) |
| `context/general-project-agent-context/publish-log.md` | developer agent | Append-only (`web-publisher-publish` skill) |
| `.specify/memory/constitution.md` | PM agent | `pm-constitution-sync` skill |
| `.specify/features/{slug}/spec.md` | PM agent | `pm-epic-writing` skill |
| `.specify/features/{slug}/impl-plan.md` | Developer agent | `dev-feature-plan` skill |
| `.specify/features/{slug}/tasks.md` | Developer agent | `dev-feature-plan` skill |

## Full tree

```
<project>/
├── .claude/                                    ← Claude Code local config
│   ├── agents/                                 ← Project-scoped agent overrides (.md files)
│   │   └── PH-project-agent.md
│   ├── rules/
│   │   └── global-engineering.md               ← Engineering guardrails
│   ├── skills/                                 ← Project-scoped skills
│   │   └── PH-skill-name/
│   │       └── SKILL.md
│   └── worktrees/                              ← git-worktree workspaces (gitignored)
│
├── .specify/                                   ← spec-kit working directory (gitignored internals)
│   ├── features/                               ← One folder per feature slug
│   │   └── {slug}/
│   │       ├── spec.md                         ← Written by pm-epic-writing
│   │       ├── dev-findings.md                 ← Written by pm-epic-writing (dev-layer findings)
│   │       ├── impl-plan.md                    ← Written by dev-feature-plan
│   │       └── tasks.md                        ← Written by dev-feature-plan
│   ├── memory/
│   │   └── constitution.md                     ← Written by pm-constitution-sync
│   ├── templates/                              ← spec-kit internal templates
│   └── extensions/
│       └── git/
│           └── git-config.yml                  ← All auto-commits disabled by default
│
├── agents/                                     ← Per-agent project context + optional local skills
│   ├── <agent-name>/                           ← One folder per agent (product-manager, developer, …)
│   │   ├── context/
│   │   │   └── persona.md                      ← Project overrides loaded by the global agent on first run
│   │   └── skills/                             ← Optional: add project-specific skills here
│   │       └── <skill-name>/SKILL.md           ← Loaded AFTER global skills; project rules take precedence
│
├── content/                                    ← Source-of-truth content
│   ├── content-calendar/
│   │   └── PH-content-calendar.md
│   └── topics/                                  ← One folder per topic bundle
│       └── YYYY-MM-DD-PH-topic-slug/
│           ├── brief.md                         ← Content brief (input)
│           ├── blog.md                          ← Drafted post
│           ├── seo.md                           ← Title/meta/keywords
│           ├── social-twitter.md
│           ├── social-linkedin.md
│           └── social-facebook.md
│
├── context/                                    ← Agent-only context (not project docs)
│   ├── general-project-agent-context/
│   │   ├── publish-log.md                       ← Append-only publish ledger
│   │   └── blog-index.md                        ← Pointer to website blog index
│   └── source-material/                         ← All raw material agents scan for relevance
│       ├── working_files/                        ← Agent scratch space (gitignored — never committed)
│       ├── research/                             ← Optional: operator-curated selections (marked items = priority)
│       │   └── YYYY-MM-DD-<N>.md                ← Checked/ticked items take precedence; unchecked = skip
│       └── PH-research-topic/
│           └── PH-notes.md                      ← Raw notes, interviews, PDFs dropped by operator
│
├── docs/                                       ← Human-readable project docs
│   ├── brand/
│   │   └── style-guide.md                       ← Brand voice, palette, typography, visual rules — read by all agents
│   ├── product/                                 ← PM agent territory
│   │   ├── product.md                           [FIXED]
│   │   ├── epics.md                             [FIXED — created/updated by pm-epic-writing]
│   │   ├── epic-status.md                       [FIXED — created/updated by pm-epic-writing]
│   │   └── constitution.md                      [copy of .specify/memory/constitution.md — pm-constitution-sync]
│   ├── project-status.html                      [FIXED — single-file dashboard]
│   ├── architecture/
│   │   ├── README.md
│   │   ├── plans/PH-plan-name.md
│   │   ├── readings/PH-reading-topic.md
│   │   ├── templates/PH-template-name.md
│   │   └── workflows/PH-workflow-name.md
│   ├── archive/                                 ← Superseded docs
│   ├── engineering/
│   │   ├── changes/YYYY-MM-DD-PH-change.md
│   │   └── prompts/PH-setup-prompt.md
│   ├── features/                                ← One folder per feature (human-readable proposals)
│   │   └── PH-feature-slug/
│   │       ├── proposal.md
│   │       └── design.md
│   ├── plans/PH-plan-name.md
│   └── qa/
│       ├── qa-plan.md
│       └── PH-regression-report.md
│
├── resources/                                  ← Design system, brand assets, masters
│   └── README.md
│
├── website/                                    ← Next.js app: starter kit (chat, notifications,
│   ├── app/                                     markdown, Supabase migrations, tests) merged with a
│   ├── components/                              fresh create-next-app install (--no-src-dir) — see
│   ├── lib/                                     il-project SKILL.md Step 9
│   ├── supabase/
│   ├── docs/
│   ├── vitest.config.mts                        [ESM — .mts, not .ts; see Step 9]
│   ├── vitest.setup.ts
│   ├── AGENTS.md                                [create-next-app generates this — NOT IL-owned]
│   ├── CLAUDE.md                                [create-next-app: just `@AGENTS.md` — NOT the root CLAUDE.md]
│   └── README.md
│
├── CLAUDE.md                                   [FIXED]
├── README.md                                   [FIXED]
└── .gitignore                                  [FIXED]
```

## Naming conventions

- **Dates**: `YYYY-MM-DD` everywhere. Briefings folders: `YYYY-MM/`.
- **Slugs**: lowercase, hyphenated, no spaces. `2026-04-13-horse-wedding`, not `2026_04_13_HorseWedding`.
- **Placeholders**: files prefixed `PH-` are placeholders in this template. Real projects rename them.
- **spec-kit slugs**: kebab-case, no date prefix. `user-auth`, `email-notifications`.

## Rules for agents

1. **Never invent new top-level folders.** New work goes inside an existing slot. If a slot doesn't fit, raise it to the PM agent first.
2. **Honor fixed filenames.** Never rename `product.md`, `epics.md`, `epic-status.md`, `project-status.html`. Skills break otherwise.
2b. **`website/AGENTS.md` and `website/CLAUDE.md` belong to Next.js, not to us.** create-next-app writes them, and `next dev` rewrites the block inside `AGENTS.md`. They carry framework guidance for whatever Next version is installed — leave them in place, commit them, and do not hand-edit or confuse them with the repo-root `CLAUDE.md` (agent delegation) or a repo-root `AGENTS.md` (installed by `plan-protocol`).
3. **Per-agent context lives under `agents/<agent>/context/`**, not under `docs/`. `docs/` is for humans.
4. **Project-local skills** go in `agents/<agent>/skills/<skill-name>/SKILL.md`. These are loaded after global skills and take precedence — do not duplicate global skill names, only add new project-specific capabilities.
5. **Source content → `content/topics/<slug>/`. Published artifacts → `website/`.** Never publish directly from `content/`.
6. **Working scratch files → `context/source-material/working_files/`** (gitignored). Never commit. Keeping scratch space alongside source material avoids a second top-level folder and makes it obvious it's ephemeral.
7. **Worktrees → `.claude/worktrees/`** (gitignored). One per parallel task.
8. **spec-kit artifacts → `.specify/features/{slug}/`.** Never write spec.md, impl-plan.md, or tasks.md outside `.specify/`.

## When to deviate

Only the PM agent can approve deviations, and any deviation must be recorded in `docs/engineering/changes/YYYY-MM-DD-folder-structure-deviation.md` with reason and rollback plan.
