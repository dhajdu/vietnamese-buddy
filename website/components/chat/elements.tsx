// components/chat/elements.tsx
// Local stand-ins for the AI Elements registry components (`@ai-sdk/elements`
// is not an npm package — the registry vendors components via shadcn).
// Replace with `npx ai-elements@latest add response reasoning` if the full
// versions are needed later.
'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Response({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
}

export function Reasoning({ children }: { children: string }) {
  return <div className="whitespace-pre-wrap">{children}</div>
}
