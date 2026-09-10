// components/markdown/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown'
import type { PluggableList } from 'unified'
import Image from 'next/image'
import {
  remarkGfm,
  rehypeHighlight,
  rehypeSlug,
  rehypeExternalLinks,
  externalLinksOptions,
} from '@/lib/markdown/plugins'
import { CodeBlock } from './CodeBlock'

interface Props {
  content: string
  /** Additional className for the wrapper div */
  className?: string
}

// Hoist static plugin arrays to module level to prevent re-creation on every render
// (follows rerender-memo + rendering-hoist-jsx best practices)
const remarkPlugins: PluggableList = [remarkGfm]

const rehypePlugins: PluggableList = [
  rehypeHighlight,
  rehypeSlug,
  [rehypeExternalLinks, externalLinksOptions],
]

/**
 * Renders a Markdown string with:
 * - GitHub Flavoured Markdown (tables, strikethrough, task lists)
 * - Syntax highlighting (highlight.js — import a theme in globals.css)
 * - Heading anchor IDs (rehype-slug)
 * - External links open in new tab safely (rehype-external-links)
 * - next/image for images
 * - Code blocks with copy button and language label
 * - Table overflow scroll wrapper
 */
export function MarkdownRenderer({ content, className }: Props) {
  return (
    <div className={`prose prose-gray max-w-none ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          // Code blocks: custom component with copy button
          pre: ({ children, className: cls, ...props }) => (
            <CodeBlock className={cls} {...props}>{children}</CodeBlock>
          ),

          // Inline code: consistent styling
          code: ({ children, className: cls, ...props }) => (
            <code
              className={`${cls ?? ''} rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800`}
              {...props}
            >
              {children}
            </code>
          ),

          // Images: use next/image for local images, passthrough for external
          img: ({ src, alt }) => {
            if (!src || typeof src !== 'string') return null
            const isExternal = src.startsWith('http')
            return isExternal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ''} className="rounded-lg max-w-full" />
            ) : (
              <Image
                src={src}
                alt={alt ?? ''}
                width={800}
                height={450}
                className="rounded-lg"
              />
            )
          },

          // Tables: wrap in scrollable container to prevent overflow
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-200 text-sm" {...props}>
                {children}
              </table>
            </div>
          ),

          // Headings: add anchor link on hover
          h1: ({ children, id }) => (
            <h1 id={id} className="group flex items-center gap-2">
              {children}
              {id && <AnchorLink id={id} />}
            </h1>
          ),
          h2: ({ children, id }) => (
            <h2 id={id} className="group flex items-center gap-2">
              {children}
              {id && <AnchorLink id={id} />}
            </h2>
          ),
          h3: ({ children, id }) => (
            <h3 id={id} className="group flex items-center gap-2">
              {children}
              {id && <AnchorLink id={id} />}
            </h3>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Hoisted static component — no props change between renders for the anchor icon itself
function AnchorLink({ id }: { id: string }) {
  return (
    <a
      href={`#${id}`}
      aria-label={`Link to section ${id}`}
      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity text-lg no-underline"
    >
      #
    </a>
  )
}
