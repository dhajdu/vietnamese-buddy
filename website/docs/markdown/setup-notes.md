# Rich-Text — Setup Notes

## Two editor options

| Editor | Package | Best for |
|---|---|---|
| **MDXEditorFull** | `@mdxeditor/editor` | CMS, content editing, rich WYSIWYG with toolbar |
| **MarkdownEditor** | `@uiw/react-md-editor` | Admin forms, quick input, split preview |

Use `MDXEditorFull` for user-facing content creation. Use `MarkdownEditor` for internal admin forms.

---

## MDXEditorFull (production WYSIWYG)

### Install
```bash
npm install @mdxeditor/editor
```

### CSS — import in `app/layout.tsx`
```ts
import '@mdxeditor/editor/style.css'
```

### Usage
```tsx
import { MDXEditorFull, type MDXEditorFullHandle } from '@/components/editor/MDXEditorFull'

const editorRef = useRef<MDXEditorFullHandle>(null)
<MDXEditorFull ref={editorRef} value={content} onChange={setContent} />
// Imperative read for form submit:
const md = editorRef.current?.getMarkdown() ?? ''
```

### Features included
- Full toolbar: headings, bold/italic/underline, lists, links, code blocks, tables, images, frontmatter, search
- CodeMirror syntax highlighting inside code blocks (16 languages)
- Title extraction from fenced code meta: ` ```ts title="Example" `
- Attachments placeholder directive
- Clipboard interception (paste/copy markdown-aware, skips CodeMirror)
- Edit/preview toggle (preview uses MarkdownRenderer)
- `forwardRef` + `getMarkdown()` for imperative form reads

See full implementation: `components/editor/MDXEditorFull.tsx`
See full design decisions: `docs/guide/markdown-editor-implementation-guide.md`

---

## MarkdownEditor (lightweight)

### Install
```bash
npm install @uiw/react-md-editor
```

### CSS — import in `app/layout.tsx`
```ts
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-md-editor/markdown.css'
```

### Usage
```tsx
import { MarkdownEditor } from '@/components/editor/MarkdownEditor'
const [content, setContent] = useState('')
<MarkdownEditor value={content} onChange={setContent} height={400} />
```

---

## MarkdownRenderer

### Install
```bash
npm install react-markdown remark-gfm rehype-highlight rehype-slug rehype-external-links
```

### Syntax highlighting theme — `app/globals.css`
```css
@import 'highlight.js/styles/github-dark.css';
```
Pick any theme from https://highlightjs.org/demo

### Tailwind Typography
```bash
npm install -D @tailwindcss/typography
```
```ts
// tailwind.config.ts
plugins: [require('@tailwindcss/typography')]
```

### Usage
```tsx
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
<MarkdownRenderer content={post.body} />
```

---

## External images

Add remote domains to `next.config.ts`:
```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.your-cdn.com' },
    // TODO: add your image hosting domains
  ]
}
```
