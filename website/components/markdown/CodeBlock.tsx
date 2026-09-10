// components/markdown/CodeBlock.tsx
'use client'
import { useState } from 'react'

interface Props {
  children?: React.ReactNode
  className?: string
}

/**
 * Custom code block with language label and copy-to-clipboard button.
 * Used as the `pre` override in MarkdownRenderer.
 */
export function CodeBlock({ children, className, ...props }: Props) {
  const [copied, setCopied] = useState(false)

  // Extract plain text from children for clipboard
  function getTextContent(node: React.ReactNode): string {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(getTextContent).join('')
    if (node && typeof node === 'object' && 'props' in (node as React.ReactElement)) {
      return getTextContent(
        (node as React.ReactElement<{ children?: React.ReactNode }>).props.children
      )
    }
    return ''
  }

  // Extract language from className (e.g. "language-typescript" → "typescript")
  const language = className?.replace('language-', '') ?? ''

  async function handleCopy() {
    const text = getTextContent(children)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-950">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        {language && (
          <span className="text-xs font-mono text-gray-400">{language}</span>
        )}
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="ml-auto text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className={`${className ?? ''} overflow-x-auto p-4 text-sm`} {...props}>
        {children}
      </pre>
    </div>
  )
}
