# Vietnamese Daily design system

The visual language for Vietnamese Daily, built on the ĀRCA Wellness palette
(sampled from [arcawellness.com](https://www.arcawellness.com/), see the ĀRCA
design system in `~/code-projects/arca-wellness/docs/design/`). An HTML twin
with live swatches and every component sits alongside this file:
[design-system.html](./design-system.html). The redesign mockup that applies
it is [docs/features/vibrant-redesign/mockup.html](../features/vibrant-redesign/mockup.html).

**Source of truth for values, once implemented:** `website/app/globals.css`.
No component may hold a raw hex; everything reads a token.

## 1. Character

Quiet, premium, warm. Cream paper, warm black, and one saturated red for the
single action that matters on each screen. The Vietnamese language is the
hero of every view: it is set heaviest and largest, in ink on cream and in
sand on dark. English is the caption, set in a serif so it never competes.

Rules of thumb:

- **One red per view.** The primary action is red. Nothing else is red except
  the streak flame and an eyebrow label.
- **Vietnamese is ink, English is serif.** Vietnamese in Be Vietnam Pro 800,
  English in Playfair Display 400. Never bold Playfair.
- **Cream is the canvas, white is the card, warm black is the room.** Dark
  sections (hero, flashcard session, grammar block) use ink-warm; headline text
  on dark is sand, not white.
- **Pills for buttons and chips; 12px corners for cards.** No other radii.
- **Flat by default.** Cards rest with a sand border. Only the one card that
  floats over the hero gets elevation.

## 2. Colour

### Brand primitives

| Token | Value | Use |
|---|---|---|
| `--red` | `#AF0D0E` | Primary action, eyebrow labels, streak flame, today marker |
| `--red-deep` | `#8F0A0B` | Hover on red |
| `--red-bright` | `#C8191A` | Red on dark surfaces |
| `--ink` | `#111111` | Vietnamese text on light, headings, dark pill |
| `--ink-warm` | `#1C1A17` | Hero, flashcard session, grammar block, nav |
| `--body` | `#3D3A37` | English body and explanations (charcoal at 85% over cream) |
| `--cream` | `#FEF9EF` | Page canvas |
| `--cream-warm` | `#FFF5EA` | Tinted bands, hover fills, chip fills |
| `--white` | `#FFFFFF` | Cards, inputs |
| `--sand` | `#EEE6DC` | Vietnamese text on dark, borders, soft accent |
| `--sand-deep` | `#E3D7C6` | Strong lines, pressed sand, calendar "studied" cell |
| `--stone` | `#9E9A93` | Muted labels, placeholders, meta |
| `--paper` | `#F4F3F3` | Neutral inset (pattern chip) |

### On-dark helpers

| Token | Value | Use |
|---|---|---|
| `--on-dark-line` | `rgba(255,255,255,.10)` | Hairlines on ink-warm |
| `--on-dark-soft` | `rgba(255,255,255,.06)` | Resting fills on ink-warm |
| `--sand-70` | `rgba(238,230,220,.70)` | Secondary text on dark |
| `--scrim` | `rgba(28,26,23,.45)` | Modals |

### Status and tone hues

Functional only. Never used as decoration.

| Role | Background | Ink | Use |
|---|---|---|---|
| ok | `#D8F3E8` | `#157A5A` | Known, completed, "casual" tone tag |
| amber | `#FAEEDA` | `#854F0B` | Learning, "warm" tone tag, cards-due nudge |
| pink | `#FBE6F1` | `#B03571` | "playful" tone tag |
| info | `#E2ECFD` | `#1E4FA3` | "polite / professional" tone tag |
| err | `#FDE4E4` | `#B0332F` | Errors, "Again" on light |

### Elevation

| Token | Value |
|---|---|
| `--elevation-1` | `0 1px 2px rgba(28,26,23,.06), 0 1px 3px rgba(28,26,23,.08)` |
| `--elevation-2` | `0 6px 24px rgba(28,26,23,.10)` |
| `--elevation-dark` | `0 12px 32px rgba(0,0,0,.40)` |
| `--focus-ring` | `rgba(175,13,14,.25)` |

## 3. Type

| Role | Face | Size | Weight | Notes |
|---|---|---|---|---|
| Vietnamese, hero | Be Vietnam Pro | 30 to 46px | 800 | tracking -0.03em, line-height 1.05 |
| Vietnamese, phrase | Be Vietnam Pro | 22px | 800 | ink on light, sand on dark |
| Vietnamese, vocab / list | Be Vietnam Pro | 16px | 700 | |
| Flashcard front | Be Vietnam Pro | 34px | 800 | ink |
| Page title (English) | Playfair Display | clamp(28px, 4vw, 40px) | 400 | line-height 1.1 |
| Section title | Playfair Display | 22 to 26px | 400 | |
| English gloss | Playfair Display | 16 to 17px | 400 | body colour |
| Explanation | Inter | 14.5px | 400 | body colour, line-height 1.5 |
| UI, buttons, nav | Inter | 14 to 15px | 600 | |
| Eyebrow / label | Inter | 11px | 600 | uppercase, tracking 0.18em, red (70% sand on dark) |
| Stat | Be Vietnam Pro | 24 to 56px | 800 | tabular numerals, 11px uppercase stone label |
| Note / meta | Inter | 12 to 13px | 400 | stone |

Fonts via `next/font/google` with the `vietnamese` subset on all three.
Fallbacks: Georgia for Playfair, system-ui for the sans faces.

Why three faces: Be Vietnam Pro was designed for Vietnamese diacritics and
carries the language; Playfair is the ĀRCA brand voice for English headings
and glosses; Inter does the quiet UI work. Each has one job.

## 4. Space, radius, elevation

- Container: 720px content, 24px side padding (phone: 16px).
- Vertical rhythm on an 8px grid. Section gap 24px on phone, 32px on desktop.
- Hero padding: 22px 22px 60px on phone; 40px 36px 84px on desktop, so the
  input card can overlap it by 40px / 56px.
- Card padding: 14px 16px (list rows), 16px (lesson sections), 28px (flashcard).
- Radii: `--radius` 12px (cards, inputs, sections), `--radius-btn` 40px
  (pills, chips), 50% for dots. Flashcard 20px.
- Borders: 1px sand on light, 1px `--on-dark-line` on dark.
- Elevation: resting cards flat. The input card over the hero gets
  `--elevation-2`; the flashcard on the dark session gets `--elevation-dark`.

## 5. Components

| Component | Spec |
|---|---|
| Primary pill | Red fill, white text, Inter 600 15px, 14px 22px, radius 40. Hover red-deep. On dark: red-bright. One per view. |
| Dark pill | Ink fill, white text. Secondary actions on light. |
| Ghost on dark | Transparent, sand text, 1.5px sand border at 35%. |
| Quiet button | Transparent, body text, 1px sand border. Tertiary. |
| Eyebrow | 11px Inter 600 uppercase tracking 0.18em, red. |
| Streak pill | Red fill, white, 🔥 + number, Be Vietnam Pro 800. The only red on Home until the user types. |
| Input card | White, radius 12, elevation-2, floats 40px over the hero. Serif placeholder in stone. Suggestion chips (cream-warm pill, 12px) beneath. |
| Stat tile | White, sand border, radius 12. Value Be Vietnam Pro 800 24px tabular; label 10.5px uppercase stone. Cards-due tile flips to amber when above zero. |
| Lesson row | White, sand border, radius 12, 6px left stripe: ok = reviewed, amber = new words waiting, red = cards due. |
| Phrase row | Tone tag (status pill, 10.5px uppercase), Vietnamese 22/800 ink, gloss Playfair 16 body, explanation Inter 14.5 body. Sand hairline between rows. |
| Grammar block | Ink-warm, radius 12. Eyebrow 70% sand. Pattern chip red-bright text on `--on-dark-soft`. Explanation sand-70 Playfair. |
| Flashcard | White card on ink-warm room, radius 20, elevation-dark. Front: Vietnamese 34/800 ink. Back: Playfair gloss, hairline, Inter explanation. Know it = red pill; Again = ghost on dark; Skip = 70% sand text. |
| Calendar | 10-column grid, 6px radius cells. Empty = white with sand border; studied = sand-deep; full day (lesson + review) = ink; today = red. |
| Nav (desktop) | Ink-warm, 60px, wordmark in sand; active item sand with red 3px underline. |
| Nav (phone) | Fixed bottom, ink-warm; icons 70% sand, active red. Labels: Today, Lessons, Cards, Words, Streak. Hidden during a flashcard session. |
| Milestone card | White, radius 12, 5px red left border. "200 words · 13 to go" in Be Vietnam Pro 800, note in Playfair. |

## 6. Motion

One animation: the streak number pulsing once when it increments at the end of
a review session. Everything else is instant. `prefers-reduced-motion` removes
even that.

## 7. Voice

The app speaks Vietnamese first when it can: time-of-day greeting (chào buổi
sáng / chiều / tối), review encouragements (giỏi lắm, ráng lên, gần xong rồi)
with English on long-press. English copy is short declaratives. Controls say
what happens: "Create today's lesson", "Know it", "Mark complete".

## 8. Where to look

- Tokens: `website/app/globals.css` (after implementation)
- Component reference: `website/components/app/`
- Live swatches and specimens: `docs/brand/design-system.html`
- Applied mockup: `docs/features/vibrant-redesign/mockup.html`
