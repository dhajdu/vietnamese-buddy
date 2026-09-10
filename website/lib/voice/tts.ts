// lib/voice/tts.ts — Southern Vietnamese speech via FPT.AI, cached in Supabase Storage.
// FPT synthesises asynchronously (5s to 2min); we poll the file URL, then store the mp3
// under audio/<voice>/<sha1(text)>.mp3 so every later play is a plain CDN hit.
import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const TTS_VOICE = process.env.TTS_VOICE ?? 'lannhi' // FPT.AI Southern female. Alternative: linhsan.
const BUCKET = 'audio'

export function ttsConfigured() {
  return Boolean(process.env.FPT_AI_API_KEY)
}

function keyFor(text: string) {
  return `${TTS_VOICE}/${createHash('sha1').update(text.normalize('NFC').trim()).digest('hex')}.mp3`
}

function publicUrl(key: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`
}

async function exists(url: string) {
  const r = await fetch(url, { method: 'HEAD', cache: 'no-store' })
  return r.ok
}

async function synthesize(text: string): Promise<ArrayBuffer> {
  const res = await fetch('https://api.fpt.ai/hmi/tts/v5', {
    method: 'POST',
    headers: { api_key: process.env.FPT_AI_API_KEY!, voice: TTS_VOICE, speed: '-1', format: 'mp3' },
    body: text,
  })
  const json = (await res.json()) as { error: number; async?: string; message?: string }
  if (!res.ok || json.error !== 0 || !json.async) throw new Error(`FPT TTS failed: ${json.message ?? res.status}`)

  // Poll until the file lands (FPT says 5s to 2min; short phrases are usually under 10s).
  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    const audio = await fetch(json.async, { cache: 'no-store' })
    if (audio.ok) {
      const buf = await audio.arrayBuffer()
      if (buf.byteLength > 1000) return buf
    }
    await new Promise(r => setTimeout(r, 1500))
  }
  throw new Error('FPT TTS timed out')
}

const inflight = new Map<string, Promise<string>>()

/** Returns a public mp3 URL for the text, synthesising and caching on first request. */
export async function getAudioUrl(text: string): Promise<string> {
  const key = keyFor(text)
  const url = publicUrl(key)
  if (await exists(url)) return url
  if (inflight.has(key)) return inflight.get(key)!

  const job = (async () => {
    const buf = await synthesize(text)
    const db = createAdminClient()
    const { error } = await db.storage.from(BUCKET).upload(key, Buffer.from(buf), {
      contentType: 'audio/mpeg', cacheControl: '31536000', upsert: true,
    })
    if (error) throw new Error(`audio upload failed: ${error.message}`)
    return url
  })().finally(() => inflight.delete(key))
  inflight.set(key, job)
  return job
}

/** Pre-generate every Vietnamese string in a lesson. Errors are logged, never thrown. */
export async function warmLessonAudio(texts: string[]) {
  if (!ttsConfigured()) return
  const unique = [...new Set(texts.map(t => t.trim()).filter(t => t.length >= 3))]
  // FPT is async on their side; a few at a time keeps us under rate limits.
  for (let i = 0; i < unique.length; i += 4) {
    await Promise.all(unique.slice(i, i + 4).map(t => getAudioUrl(t).catch(e => console.error('warm audio failed', t, e))))
  }
}
