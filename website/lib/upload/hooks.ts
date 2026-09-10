'use client'

import { useState, useCallback } from 'react'
import { UPLOAD_CONFIG } from './config'

export interface UploadResult {
  url: string
  path: string
}

export interface UseFileUploadReturn {
  upload: (file: File, folder?: string) => Promise<UploadResult>
  isUploading: boolean
  progress: number
  error: string | null
  reset: () => void
}

interface SignedUrlResponse {
  signedUrl: string
  path: string
  token: string
}

/**
 * Client-side upload hook.
 *
 * Flow:
 *   1. POST /api/upload/signed-url  →  { signedUrl, path }
 *   2. PUT <signedUrl> (XHR for onprogress tracking)
 *   3. Return public URL via UPLOAD_CONFIG.publicUrl(path)
 *
 * Files never pass through the Next.js server.
 */
export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  const upload = useCallback(
    async (file: File, folder?: string): Promise<UploadResult> => {
      setIsUploading(true)
      setProgress(0)
      setError(null)

      try {
        // Step 1: get a signed upload URL from our API route
        const signingRes = await fetch('/api/upload/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            folder,
          }),
        })

        if (!signingRes.ok) {
          const { error: serverError } = (await signingRes.json()) as {
            error?: string
          }
          throw new Error(serverError ?? `Failed to get upload URL (${signingRes.status})`)
        }

        const { signedUrl, path } =
          (await signingRes.json()) as SignedUrlResponse

        // Step 2: PUT directly to Supabase Storage via XHR (for progress tracking)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setProgress(Math.round((event.loaded / event.total) * 100))
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setProgress(100)
              resolve()
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }

          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.onabort = () => reject(new Error('Upload was aborted'))

          xhr.open('PUT', signedUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          // Prevent silent overwrites at the storage layer
          xhr.setRequestHeader('X-Upsert', 'false')
          xhr.send(file)
        })

        // Step 3: derive the public URL — no extra round-trip needed
        const url = UPLOAD_CONFIG.publicUrl(path)
        return { url, path }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [],
  )

  return { upload, isUploading, progress, error, reset }
}
