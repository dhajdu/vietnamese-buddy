// components/editor/MDXEditorFull.tsx
// Production-grade WYSIWYG Markdown editor based on @mdxeditor/editor (Lexical).
// Live-tested reference — see docs/guide/markdown-editor-implementation-guide.md
'use client'

import React, {
  useRef, useState, forwardRef, useImperativeHandle,
  useCallback, createContext, useContext,
} from 'react'
import '@mdxeditor/editor/style.css'
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  Separator,
  thematicBreakPlugin,
  CreateLink,
  codeBlockPlugin,
  codeMirrorPlugin,
  CodeMirrorEditor,
  tablePlugin,
  imagePlugin,
  frontmatterPlugin,
  searchPlugin,
  InsertTable,
  InsertImage,
  InsertFrontmatter,
  InsertCodeBlock,
  InsertThematicBreak,
  ButtonWithTooltip,
  directivesPlugin,
} from '@mdxeditor/editor'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MDXEditorFullProps {
  value: string
  onChange: (value: string) => void
  /** Show edit/preview toggle button (default: true) */
  showPreviewToggle?: boolean
  /** Minimum editor height (default: "280px") */
  minHeight?: string
  placeholder?: React.ReactNode
  className?: string
  contentEditableClassName?: string
  /** Auto-focus on mount (default: true) */
  autoFocus?: boolean
}

export interface MDXEditorFullHandle {
  /** Returns the current markdown string. Use for imperative reads (form submit etc.) */
  getMarkdown: () => string
}

// ---------------------------------------------------------------------------
// Custom code block extensions
// ---------------------------------------------------------------------------

function parseTitleFromMeta(meta: string | null | undefined): string | null {
  if (!meta?.trim()) return null
  const match = meta.match(/title\s*=\s*["']([^"']*)["']/)
  return match ? match[1].trim() || null : null
}

function PlainTextCodeBlockEditor(props: React.ComponentProps<typeof CodeMirrorEditor>) {
  return <CodeMirrorEditor {...props} />
}

function CodeBlockEditorWithTitle(props: React.ComponentProps<typeof CodeMirrorEditor>) {
  const title = parseTitleFromMeta(props.meta)
  const editor =
    props.language == null || props.language === ''
      ? <PlainTextCodeBlockEditor {...props} />
      : <CodeMirrorEditor {...props} />
  return (
    <div className="flex flex-col gap-1">
      {title && (
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          {title}
        </div>
      )}
      <div className="min-h-0">{editor}</div>
    </div>
  )
}

const codeBlockWithTitleDescriptor = {
  priority: 0,
  match: () => true,
  Editor: CodeBlockEditorWithTitle,
} as const

const plainTextCodeBlockDescriptor = {
  priority: -10,
  match: (language: string | null | undefined) => language == null || language === '',
  Editor: PlainTextCodeBlockEditor,
} as const

// ---------------------------------------------------------------------------
// Attachments directive extension
// ---------------------------------------------------------------------------

function AttachmentsDirectiveEditor() {
  return (
    <div
      className="flex items-center gap-2 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
      data-attachments-placeholder
    >
      {/* TODO: replace Paperclip icon with your icon library */}
      <span className="shrink-0">📎</span>
      <span>Attachments will appear here</span>
    </div>
  )
}

const attachmentsDirectiveDescriptor = {
  testNode: (node: { name?: string }) => node.name === 'attachments',
  name: 'Attachments',
  attributes: [],
  hasChildren: false,
  type: 'leafDirective' as const,
  Editor: AttachmentsDirectiveEditor,
}

function hasAttachmentsPlaceholder(md: string): boolean {
  return /::\s*attachments|:::\s*attachments/.test(md)
}

// ---------------------------------------------------------------------------
// Toolbar context (allows toolbar buttons to call editor methods)
// ---------------------------------------------------------------------------

const AttachmentsInsertContext = createContext<{ insertAttachments: () => void } | null>(null)

function InsertAttachmentsToolbarButton() {
  const ctx = useContext(AttachmentsInsertContext)
  if (!ctx) return null
  return (
    <ButtonWithTooltip title="Insert attachments placeholder" onClick={ctx.insertAttachments}>
      <span>📎</span>
    </ButtonWithTooltip>
  )
}

// ---------------------------------------------------------------------------
// Clipboard helpers — skip CodeMirror code blocks
// ---------------------------------------------------------------------------

function isInsideCodeMirror(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return Boolean(el?.closest?.('.cm-editor, .cm-content'))
}

// ---------------------------------------------------------------------------
// Plugin stack (module-level to avoid recreation on render)
// ---------------------------------------------------------------------------

const PLUGINS = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  codeBlockPlugin({
    defaultCodeBlockLanguage: 'text',
    codeBlockEditorDescriptors: [codeBlockWithTitleDescriptor, plainTextCodeBlockDescriptor],
  }),
  codeMirrorPlugin({
    codeBlockLanguages: {
      text: 'Plain text', js: 'JavaScript', jsx: 'JSX',
      ts: 'TypeScript', tsx: 'TypeScript (React)',
      css: 'CSS', json: 'JSON', md: 'Markdown',
      html: 'HTML', bash: 'Bash', shell: 'Shell', sh: 'Shell',
      sql: 'SQL', python: 'Python', py: 'Python',
      yaml: 'YAML', yml: 'YAML',
    },
  }),
  linkPlugin(),
  linkDialogPlugin(),
  tablePlugin(),
  imagePlugin(),
  frontmatterPlugin(),
  searchPlugin(),
  markdownShortcutPlugin(),
  directivesPlugin({ directiveDescriptors: [attachmentsDirectiveDescriptor] }),
]

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Production-grade WYSIWYG Markdown editor with edit/preview toggle.
 *
 * Uses @mdxeditor/editor (Lexical-based). Exposes getMarkdown() via ref
 * for imperative form reads without lifting state.
 *
 * @example
 * const editorRef = useRef<MDXEditorFullHandle>(null)
 * <MDXEditorFull ref={editorRef} value={content} onChange={setContent} />
 * const md = editorRef.current?.getMarkdown() ?? ''
 */
export const MDXEditorFull = forwardRef<MDXEditorFullHandle | null, MDXEditorFullProps>(
  function MDXEditorFull(
    {
      value,
      onChange,
      showPreviewToggle = true,
      minHeight = '280px',
      placeholder,
      className = '',
      contentEditableClassName,
      autoFocus = true,
    },
    ref
  ) {
    const [mode, setMode] = useState<'edit' | 'preview'>('edit')
    const editorRef = useRef<MDXEditorMethods>(null)
    const [copyFeedback, setCopyFeedback] = useState(false)

    useImperativeHandle(ref, () => ({
      getMarkdown: () => editorRef.current?.getMarkdown() ?? '',
    }), [])

    const insertAttachments = useCallback(() => {
      const md = editorRef.current?.getMarkdown() ?? ''
      if (hasAttachmentsPlaceholder(md)) return
      editorRef.current?.insertMarkdown('\n\n::attachments\n\n')
    }, [])

    const handlePasteCapture = useCallback((e: React.ClipboardEvent) => {
      if (isInsideCodeMirror(e.target)) return
      const raw = e.clipboardData?.getData('text/plain')
      if (!raw || !editorRef.current) return
      e.preventDefault()
      e.stopPropagation()
      editorRef.current.insertMarkdown(raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n'))
    }, [])

    const handleCopyCapture = useCallback((e: React.ClipboardEvent) => {
      if (isInsideCodeMirror(e.target)) return
      const markdown = editorRef.current?.getSelectionMarkdown?.()
      if (markdown == null || markdown === '' || !e.clipboardData) return
      e.preventDefault()
      e.stopPropagation()
      e.clipboardData.setData('text/plain', markdown)
    }, [])

    const handleToolbarCopy = useCallback(async () => {
      const md = editorRef.current?.getMarkdown() ?? ''
      await navigator.clipboard.writeText(md)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    }, [])

    const toolbarPluginInstance = toolbarPlugin({
      toolbarContents: () => (
        <>
          <UndoRedo />
          <Separator />
          <BlockTypeSelect />
          <Separator />
          <BoldItalicUnderlineToggles />
          <Separator />
          <ListsToggle />
          <Separator />
          <CreateLink />
          <Separator />
          <InsertCodeBlock />
          <InsertTable />
          <InsertImage />
          <InsertThematicBreak />
          <InsertFrontmatter />
          <Separator />
          <InsertAttachmentsToolbarButton />
          <Separator />
          <ButtonWithTooltip
            title={copyFeedback ? 'Copied!' : 'Copy markdown'}
            onClick={handleToolbarCopy}
          >
            <span className="text-xs">{copyFeedback ? '✓' : '⎘'}</span>
          </ButtonWithTooltip>
        </>
      ),
    })

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {showPreviewToggle && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`rounded px-3 py-1 text-sm ${mode === 'edit' ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`rounded px-3 py-1 text-sm ${mode === 'preview' ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
            >
              Preview
            </button>
          </div>
        )}

        {mode === 'edit' ? (
          <AttachmentsInsertContext.Provider value={{ insertAttachments }}>
            <div
              className="rounded-sm border border-gray-200 bg-white"
              style={{ minHeight }}
              onPasteCapture={handlePasteCapture}
              onCopyCapture={handleCopyCapture}
            >
              <MDXEditor
                ref={editorRef}
                className="min-h-full"
                contentEditableClassName={[
                  'prose prose-gray max-w-none text-sm',
                  contentEditableClassName,
                ].filter(Boolean).join(' ')}
                markdown={value}
                onChange={onChange}
                autoFocus={autoFocus}
                placeholder={placeholder as string}
                plugins={[...PLUGINS, toolbarPluginInstance]}
              />
            </div>
          </AttachmentsInsertContext.Provider>
        ) : (
          <div
            className="overflow-auto rounded-sm border border-gray-200 bg-white px-4 py-3"
            style={{ minHeight }}
          >
            <MarkdownRenderer content={value || '_No content yet_'} />
          </div>
        )}
      </div>
    )
  }
)
