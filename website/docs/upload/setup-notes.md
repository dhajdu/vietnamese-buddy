# File Upload — Setup Notes

Reference for developers setting up or customising the Supabase Storage upload scaffold.

---

## 1. Supabase Storage bucket

### Option A — Supabase Dashboard (quickest)

1. Open your Supabase project → **Storage** → **New bucket**
2. **Name**: `uploads` (or whatever you chose at scaffold time)
3. **Public bucket**: enabled (so public URLs work without extra signed read URLs)
4. **File size limit**: e.g. `10485760` (10 MB)
5. **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

### Option B — SQL migration

Create `supabase/migrations/<timestamp>_storage_bucket.sql`:

```sql
-- Create the public storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  true,
  10485760,  -- 10 MB; adjust as needed
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- Authenticated users may upload into their own sub-folder only
create policy "auth users can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users may update or delete their own objects
create policy "users own their objects"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (bucket is public, so this is informational)
create policy "public read"
  on storage.objects for select
  to public
  using (bucket_id = 'uploads');
```

Then run: `npx supabase db push`

---

## 2. next.config.js — remote image hostnames

Add a `remotePatterns` entry so `next/image` can render images served from Supabase Storage.

```js
// next.config.js  (or next.config.ts)
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
```

Without this entry, `<Image src={supabasePublicUrl} />` will throw a hostname error at runtime.

---

## 3. Environment variables

The upload config reads one variable at runtime:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Base URL for constructing public Storage URLs |

This is the same variable used by the rest of the Supabase client setup — no new variables are needed.

---

## 4. Bucket name placeholder

`lib/upload/config.ts` ships with the literal string `'$BUCKET_NAME'`. Replace it with your actual bucket name before deploying:

```ts
// lib/upload/config.ts
export const UPLOAD_CONFIG = {
  bucket: 'uploads',   // ← replace $BUCKET_NAME
  ...
}
```

The `publicUrl` helper also contains the bucket name inline — update both occurrences.

---

## 5. Upload flow — architecture note

Files **never pass through the Next.js server**:

```
Browser
  │
  ├─ POST /api/upload/signed-url   →  Next.js API route (auth + validation only)
  │                                     returns { signedUrl, path, token }
  │
  └─ PUT <signedUrl>               →  Supabase Storage directly (XHR from browser)
```

This keeps the Next.js function invocation cheap and eliminates the memory and timeout pressure of piping large files through the server.

---

## 6. Post-scaffold TODOs

| File | Action |
|---|---|
| `lib/upload/config.ts` | Replace `$BUCKET_NAME`; adjust `maxFileSizeMb` and `allowedTypes` |
| `app/api/upload/signed-url/route.ts` | Confirm `createClient` import path matches your project |
| `components/upload/FileUpload.tsx` | Replace Tailwind utility classes with project design system tokens |
| `components/upload/FilePreview.tsx` | Replace Tailwind utility classes with project design system tokens |
| `next.config.js` | Add `remotePatterns` entry (see section 2 above) |
