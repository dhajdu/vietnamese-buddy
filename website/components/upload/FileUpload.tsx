'use client'

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { useFileUpload } from '@/lib/upload/hooks'
import { FilePreview } from './FilePreview'

interface FileUploadProps {
  /** Called with the public URL and storage path after a successful upload. */
  onUpload: (url: string, path: string) => void
  /** Comma-separated MIME types or extensions for the file input, e.g. "image/*,application/pdf" */
  accept?: string
  /** Supabase Storage folder prefix. Defaults to "uploads" in the API route. */
  folder?: string
  className?: string
}

/**
 * FileUpload
 *
 * Drag-and-drop + click-to-browse upload component backed by Supabase Storage.
 * Uses native HTML5 drag events — no external DnD library required.
 *
 * TODO: Replace Tailwind classes with project design system.
 */
export function FileUpload({
  onUpload,
  accept,
  folder,
  className = '',
}: FileUploadProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const { upload, isUploading, progress, error, reset } = useFileUpload()

  // ── File selection helpers ──────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      setSelectedFile(file)
      try {
        const { url, path } = await upload(file, folder)
        onUpload(url, path)
      } catch {
        // error is surfaced via the `error` state from useFileUpload
      }
    },
    [upload, folder, onUpload],
  )

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    reset()
    if (inputRef.current) inputRef.current.value = ''
  }, [reset])

  // ── Input onChange ──────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  // ── Native HTML5 drag events ────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (isUploading) return

      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [isUploading, handleFile],
  )

  const handleZoneClick = useCallback(() => {
    if (!isUploading) inputRef.current?.click()
  }, [isUploading])

  // ── Render ──────────────────────────────────────────────────────────────

  const showPreview = selectedFile !== null
  const isDisabled = isUploading

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Drop zone — hidden while a file is selected and uploading */}
      {!showPreview && (
        <div
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          aria-disabled={isDisabled}
          aria-label="Upload file — click or drag and drop"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleZoneClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleZoneClick()
          }}
          className={[
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
            isDisabled ? 'pointer-events-none opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* Upload icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 text-gray-400"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>

          <div>
            <p className="text-sm font-medium text-gray-700">
              Drag and drop a file, or{' '}
              <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {accept ? `Accepted: ${accept}` : 'Images and PDFs supported'}
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={isDisabled}
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* File preview (shown after selection) */}
      {showPreview && selectedFile && (
        <FilePreview
          file={selectedFile}
          onRemove={handleClear}
        />
      )}

      {/* Progress bar */}
      {isUploading && (
        <div className="overflow-hidden rounded-full bg-gray-200" aria-label="Upload progress">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ width: `${progress}%` }}
            className="h-1.5 rounded-full bg-blue-500 transition-all duration-150"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
