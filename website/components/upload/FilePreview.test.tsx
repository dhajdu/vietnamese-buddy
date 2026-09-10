// components/upload/FilePreview.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FilePreview } from './FilePreview'

const createObjectURL = vi.fn(() => 'blob:mock-url')
const revokeObjectURL = vi.fn()

beforeEach(() => {
  createObjectURL.mockClear()
  revokeObjectURL.mockClear()
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
})
afterEach(() => vi.unstubAllGlobals())

function makeFile(name: string, type: string, size = 2048): File {
  const f = new File(['x'], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('FilePreview', () => {
  it('renders a thumbnail for image files', () => {
    render(<FilePreview file={makeFile('shot.png', 'image/png')} onRemove={() => {}} />)
    const img = screen.getByAltText('shot.png') as HTMLImageElement
    expect(img.src).toBe('blob:mock-url')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('renders an icon and no object URL for non-image files', () => {
    render(<FilePreview file={makeFile('notes.pdf', 'application/pdf')} onRemove={() => {}} />)
    expect(screen.queryByAltText('notes.pdf')).toBeNull()
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('shows the file name and a human-readable size', () => {
    render(<FilePreview file={makeFile('notes.pdf', 'application/pdf', 2048)} onRemove={() => {}} />)
    expect(screen.getByText('notes.pdf')).toBeTruthy()
    expect(screen.getByText('2.0 KB')).toBeTruthy()
  })

  it('revokes the object URL on unmount so blobs are not leaked', () => {
    const { unmount } = render(
      <FilePreview file={makeFile('shot.png', 'image/png')} onRemove={() => {}} />
    )
    expect(revokeObjectURL).not.toHaveBeenCalled()
    unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('revokes the previous URL when the file changes', () => {
    let n = 0
    createObjectURL.mockImplementation(() => `blob:url-${++n}`)
    const { rerender } = render(
      <FilePreview file={makeFile('a.png', 'image/png')} onRemove={() => {}} />
    )
    rerender(<FilePreview file={makeFile('b.png', 'image/png')} onRemove={() => {}} />)
    // the first blob must be released, and the second must be showing
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url-1')
    expect((screen.getByAltText('b.png') as HTMLImageElement).src).toBe('blob:url-2')
  })

  it('calls onRemove when the remove button is clicked', () => {
    const onRemove = vi.fn()
    render(<FilePreview file={makeFile('shot.png', 'image/png')} onRemove={onRemove} />)
    screen.getByLabelText('Remove shot.png').click()
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
