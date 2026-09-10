# AI Chatbot — Manual QA Checklist

Use this checklist when integrating the multi-session chatbot template into a project. Run through it after completing setup (migration applied, env vars configured, `npm run dev` running) and logging in as a test user.

Open `http://localhost:3000/chat`.

---

## Sidebar

- [ ] **Sidebar renders** — "New Chat" button visible, session list is empty on a fresh account
- [ ] **New Chat creates a session** — clicking "+ New Chat" calls `POST /api/sessions` and the session immediately appears in the sidebar with title "New Chat"
- [ ] **Session list order** — most recently updated session appears at the top (sorted by `updated_at DESC`)

## Sending messages

- [ ] **Sending a message streams a response** — text appears progressively in the chat window, not all at once
- [ ] **Streaming indicator shows** — pulsing dots are visible while the response is in-flight; disappear on completion
- [ ] **Input is disabled during streaming** — cannot send a second message before the first response completes
- [ ] **Enter submits, Shift+Enter adds a newline** — keyboard behaviour is correct
- [ ] **Empty input does not submit** — pressing Enter on a blank or whitespace-only textarea sends nothing

## Auto-title

- [ ] **Auto-title fires on first exchange** — after the first assistant response completes, the sidebar title updates from "New Chat" to a generated title (≤6 words)
- [ ] **Subsequent messages do not re-title** — sending more messages in the same session does not change the title

## Session switching

- [ ] **Switching sessions loads correct history** — clicking a session in the sidebar loads its messages from Supabase
- [ ] **No cross-session bleed** — messages from session A are not visible in session B
- [ ] **Loading skeleton shows** — while history is fetching, a skeleton placeholder appears instead of an empty list

## Rename and delete

- [ ] **Rename** — hovering over a session item reveals the ✏️ button; clicking it enters rename mode; pressing Enter saves the new title via `PATCH /api/sessions/[id]`; pressing Escape cancels
- [ ] **Delete** — hovering over a session item reveals the 🗑️ button; clicking it calls `DELETE /api/sessions/[id]` and removes the session from the sidebar
- [ ] **Deleting the active session** — the chat pane shows the empty state after deletion (no orphaned messages visible)

## Persistence

- [ ] **Reload page** — sessions persist after full page reload; clicking a session re-loads its full message history
- [ ] **History cap** — confirm the messages query caps at 100 rows (inspect network tab: `limit=100` in the query)

## Scroll behaviour

- [ ] **Auto-scroll to bottom** — new messages cause the chat pane to scroll to the bottom automatically
- [ ] **Manual scroll up prevents auto-scroll** — scrolling up while streaming stops the auto-scroll until the user returns to the bottom

## Auth guards

- [ ] **Unauthenticated API call returns 401** — in browser devtools, fetch `GET /api/sessions` without a session cookie; confirm `401 Unauthorized`
- [ ] **Session ownership guard** — cannot fetch or stream messages for a session belonging to another user (tested by swapping session UUIDs in devtools)

## Accessibility

- [ ] **Session items are keyboard-navigable** — Tab key focuses session buttons; Enter/Space activates them
- [ ] **Streaming indicator has aria-label** — inspect `<div aria-label="AI is responding">` during streaming
- [ ] **Loading skeleton has aria-busy** — inspect `<div aria-busy="true">` while history loads

---

## Setup notes for developers copying this template

1. **Run migration**: `npx supabase db push` — applies `supabase/migrations/20260522000000_chat_tables.sql`
2. **Install deps**: `npm install ai @ai-sdk/react @ai-sdk/elements zustand`
3. **Install test deps**: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`
4. **Configure AI Gateway**: run `vercel env pull .env.local` (preferred — OIDC) or add a manual API key from `vercel.com/[team]/~/ai-gateway/api-keys`
5. **Supabase client**: ensure `lib/supabase/server.ts` exports `createClient()` using the SSR pattern from `@supabase/ssr`
6. **Path aliases**: ensure `tsconfig.json` has `"@/*": ["./*"]` so `@/lib/...` and `@/components/...` resolve

### Default models (see `lib/chat/constants.ts`)

| Constant | Value | Used for |
|---|---|---|
| `DEFAULT_CHAT_MODEL` | `anthropic/claude-sonnet-4.6` | All chat sessions |
| `TITLE_MODEL` | `anthropic/claude-haiku-4.5` | Auto-title generation |

Change these constants to switch providers or models for the entire template.
