// lib/voice/tts.ts — speech for whichever language is being learned, cached in Supabase Storage.
//
// Two providers behind one interface. FPT.AI speaks Southern Vietnamese and is
// asynchronous, so we poll for the file. OpenAI speaks English and returns the
// audio in the response. Either way the mp3 lands at audio/<voice>/<sha1>.mp3 and
// every later play is a plain CDN hit.
import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPair, type PairId } from '@/lib/pairs'

const BUCKET = 'audio'

function voiceFor(pairId: PairId) {
  return getPair(pairId).tts
}

export function ttsConfigured(pairId: PairId) {
  const v = voiceFor(pairId)
  if (!v) return false
  if (v.provider === 'fpt') return Boolean(process.env.FPT_AI_API_KEY)
  return Boolean(process.env.OPENAI_API_KEY)
}

function keyFor(voice: string, text: string) {
  return `${voice}/${createHash('sha1').update(text.normalize('NFC').trim()).digest('hex')}.mp3`
}

function publicUrl(key: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`
}

async function exists(url: string) {
  const r = await fetch(url, { method: 'HEAD', cache: 'no-store' })
  return r.ok
}

/** FPT.AI: async. It returns a URL that may not exist yet, so poll it. */
async function synthesizeFpt(text: string, voice: string): Promise<ArrayBuffer> {
  const res = await fetch('https://api.fpt.ai/hmi/tts/v5', {
    method: 'POST',
    headers: { api_key: process.env.FPT_AI_API_KEY!, voice, speed: '-1', format: 'mp3' },
    body: text,
  })
  const json = (await res.json()) as { error: number; async?: string; message?: string }
  if (!res.ok || json.error !== 0 || !json.async) throw new Error(`FPT TTS failed: ${json.message ?? res.status}`)

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

/** OpenAI: synchronous, returns the mp3 bytes directly. */
async function synthesizeOpenAI(text: string, voice: string): Promise<ArrayBuffer> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY!}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: text, response_format: 'mp3', speed: 0.95 }),
  })
  if (!res.ok) throw new Error(`OpenAI TTS failed: ${res.status} ${await res.text()}`)
  return res.arrayBuffer()
}

const inflight = new Map<string, Promise<string>>()

/** Public mp3 URL for the text, synthesising and caching on first request. */
export async function getAudioUrl(text: string, pairId: PairId): Promise<string> {
  const v = voiceFor(pairId)
  if (!v) throw new Error(`No voice configured for ${pairId}`)
  const key = keyFor(v.voice, text)
  const url = publicUrl(key)
  if (await exists(url)) return url
  if (inflight.has(key)) return inflight.get(key)!

  const job = (async () => {
    const buf = v.provider === 'fpt' ? await synthesizeFpt(text, v.voice) : await synthesizeOpenAI(text, v.voice)
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

/** Pre-generate every target-language string in a lesson. Errors are logged, never thrown. */
export async function warmLessonAudio(texts: string[], pairId: PairId) {
  if (!ttsConfigured(pairId)) return
  const unique = [...new Set(texts.map(t => t.trim()).filter(t => t.length >= 3))]
  for (let i = 0; i < unique.length; i += 4) {
    await Promise.all(unique.slice(i, i + 4).map(t => getAudioUrl(t, pairId).catch(e => console.error('warm audio failed', t, e))))
  }
}
