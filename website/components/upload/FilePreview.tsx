'use client'

import { useEffect, useMemo } from 'react'

interface FilePreviewProps {
  file: File
  onRemove: () => void
  className?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

function FileIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-gray-400"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

/**
 * FilePreview
 *
 * - Image files: shows a thumbnail via URL.createObjectURL
 * - Non-image files: shows a file icon with name and size
 * - Always shows a remove button (calls onRemove)
 *
 * TODO: Replace Tailwind classes with project design system.
 */
export function FilePreview({
  file,
  onRemove,
  className = '',
}: FilePreviewProps): React.ReactElement {
  const isImage = IMAGE_MIME_TYPES.has(file.type)

  // Derived, not state: calling setState inside an effect triggers a cascading
  // render, and the thumbnail would flash the file icon on first paint.
  const objectUrl = useMemo(
    () => (isImage ? URL.createObjectURL(file) : null),
    [file, isImage]
  )

  // Revoke the previous URL whenever it changes, and on unmount.
  useEffect(() => {
    if (!objectUrl) return
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 ${className}`}
    >
      {/* Thumbnail or file icon */}
      <div className="shrink-0">
        {isImage && objectUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={objectUrl}
            alt={file.name}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <FileIcon />
        )}
      </div>

      {/* File name + size */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
        <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  )
}
