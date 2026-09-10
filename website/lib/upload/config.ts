// TODO: Replace '$BUCKET_NAME' with your Supabase Storage bucket name at scaffold time.
// TODO: Adjust maxFileSizeMb and allowedTypes for your use case.

export const UPLOAD_CONFIG = {
  bucket: '$BUCKET_NAME',
  maxFileSizeMb: 10,
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ] as readonly string[],
  publicUrl: (path: string): string =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/$BUCKET_NAME/${path}`,
} as const

export type UploadConfig = typeof UPLOAD_CONFIG
