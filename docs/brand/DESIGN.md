# Vietnamese Daily design tokens

Source of truth: `website/app/globals.css` (CSS variables, exposed to Tailwind via `@theme`). Never use a raw hex in a component; use the Tailwind color names below.

## Palette

| Token | Tailwind | Light | Dark | Use |
|---|---|---|---|---|
| bg | `bg-bg` | #F6F7F3 | #141915 | page ground |
| surface | `bg-surface` | #FFFFFF | #1B211C | cards, inputs, nav |
| ink | `text-ink` | #1B211C | #EDF0EA | primary text, filled buttons |
| ink-2 | `text-ink-2` | #4A544C | #B7C0B8 | English, explanations |
| ink-3 | `text-ink-3` | #7C867E | #7F8A81 | labels, meta |
| line | `border-line` | #DDE2DB | #2C352E | hairlines |
| accent | `text-accent` | #1F6B4F | #6FC49C | links, focus ring, today marker |
| accent-soft | `bg-accent-soft` | #E3EFE8 | #1E3128 | hover fills, pattern chip |
| vn | `.vn` | #8A4B12 | #E0A365 | Vietnamese text |
| warn | `text-warn` | #9A5B00 | #E0A94A | errors |

Dark theme follows `prefers-color-scheme`; both palettes live in `globals.css`.

## Type

- **Be Vietnam Pro** (`font-display`): headings, Vietnamese text, all UI controls. Built for Vietnamese diacritics.
- **Newsreader** (`font-body`, default on `body`): English body and explanations. Serif keeps English visibly secondary.
- **JetBrains Mono** (`font-mono`): grammar pattern chip and card side labels only.

Scale used: 11 (labels) · 13 · 14 · 15 · 16 · 17 (body) · 20 (phrase Vietnamese) · 24 · 30.

## Components (`website/app/globals.css` `@layer components`)

- `.card` bordered surface, 8px radius, no shadow. Lesson sections, list rows, flashcard.
- `.btn-primary` filled ink. One per screen.
- `.btn-ghost` ink outline. `.btn-quiet` line outline, muted text.
- `.label` 11px uppercase letter-spaced.
- `.vn` Be Vietnam Pro semibold in the Vietnamese colour.
- `.tabular` tabular numerals for any counter.

Reference components: `website/components/app/` (StatTiles, LessonList, ReviewSession, StatusToggle, Nav).
