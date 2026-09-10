// lib/markdown/plugins.ts
// Shared plugin configuration for ReactMarkdown.
// Import these in MarkdownRenderer — do not duplicate per component.

export { default as remarkGfm } from 'remark-gfm'
export { default as rehypeHighlight } from 'rehype-highlight'
export { default as rehypeSlug } from 'rehype-slug'
export { default as rehypeExternalLinks } from 'rehype-external-links'

/**
 * Options for rehype-external-links.
 * Opens external links in a new tab safely.
 */
export const externalLinksOptions = {
  target: '_blank',
  rel: ['noopener', 'noreferrer'],
} as const
