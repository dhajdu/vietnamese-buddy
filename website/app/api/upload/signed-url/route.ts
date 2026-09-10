import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { UPLOAD_CONFIG } from '@/lib/upload/config'

interface SignedUrlRequest {
  fileName: string
  contentType: string
  folder?: string
}

/**
 * Sanitise a file name to prevent path traversal and special character injection.
 * Keeps alphanumerics, dots, hyphens, and underscores only.
 */
function sanitiseFileName(name: string): string {
  return name
    .replace(/\.\.\//g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^[._-]+/, '')
}

/**
 * POST /api/upload/signed-url
 *
 * Receives { fileName, contentType, folder? }, validates the file type,
 * builds a unique path, and returns a Supabase signed upload URL.
 * The client then PUTs directly to Supabase Storage — this server never
 * receives the file bytes.
 *
 * Returns: { signedUrl: string; path: string; token: string }
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Partial<SignedUrlRequest>
  try {
    body = (await request.json()) as Partial<SignedUrlRequest>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { fileName, contentType, folder } = body

  if (!fileName || typeof fileName !== 'string') {
    return NextResponse.json({ error: 'fileName is required' }, { status: 400 })
  }

  if (!contentType || typeof contentType !== 'string') {
    return NextResponse.json({ error: 'contentType is required' }, { status: 400 })
  }

  // Validate MIME type against allow-list
  if (!UPLOAD_CONFIG.allowedTypes.includes(contentType)) {
    return NextResponse.json(
      {
        error: `File type '${contentType}' is not allowed. Allowed types: ${UPLOAD_CONFIG.allowedTypes.join(', ')}`,
      },
      { status: 400 },
    )
  }

  const sanitised = sanitiseFileName(fileName)
  if (!sanitised) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
  }

  const uploadFolder = folder ? sanitiseFileName(folder) : 'uploads'
  const path = `${uploadFolder}/${user.id}/${Date.now()}-${sanitised}`

  const { data, error } = await supabase.storage
    .from(UPLOAD_CONFIG.bucket)
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error('[upload/signed-url] Supabase error:', error)
    return NextResponse.json(
      { error: 'Failed to create signed upload URL' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
  })
}
