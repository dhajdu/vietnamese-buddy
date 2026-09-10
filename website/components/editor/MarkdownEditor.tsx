// components/editor/MarkdownEditor.tsx
'use client'
import dynamic from 'next/dynamic'

// Dynamic import required — @uiw/react-md-editor uses browser APIs (SSR unsafe)
// follows bundle-dynamic-imports best practice for heavy components
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default),
  { ssr: false }
)

interface Props {
  value: string
  onChange: (value: string) => void
  /** Editor height in pixels (default: 400) */
  height?: number
  /** Show preview panel by default (default: 'live' split view) */
  preview?: 'live' | 'edit' | 'preview'
  placeholder?: string
}

/**
 * Plug-and-play Markdown editor with live preview.
 * Wraps @uiw/react-md-editor with consistent defaults.
 *
 * Usage:
 * ```tsx
 * const [content, setContent] = useState('')
 * <MarkdownEditor value={content} onChange={setContent} />
 * ```
 */
export function MarkdownEditor({
  value,
  onChange,
  height = 400,
  preview = 'live',
  placeholder = 'Write your content in Markdown…',
}: Props) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        height={height}
        preview={preview}
        textareaProps={{ placeholder }}
        visibleDragbar={false}
      />
    </div>
  )
}
