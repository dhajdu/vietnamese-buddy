// components/app/Speak.tsx — speaker button. Plays FPT.AI Southern audio via /api/tts,
// falls back to the browser's Vietnamese voice when the server has no TTS key.
'use client'
import { useEffect, useRef, useState } from 'react'
import { Volume2, Loader2 } from 'lucide-react'
import { PAIRS, DEFAULT_PAIR, type PairId } from '@/lib/pairs'

const urlCache = new Map<string, string>()
// 10ms of silent WAV. Starting it inside the tap unlocks the element on iOS, so the real
// clip can still play after the fetch resolves and the gesture is over.
const SILENCE = 'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='

/** Fallback when no provider is configured. Picks a voice in the target language. */
function speakInBrowser(text: string, pair: PairId) {
  if (typeof speechSynthesis === 'undefined') return
  const target = PAIRS[pair].targetField === 'vietnamese' ? 'vi' : 'en'
  const u = new SpeechSynthesisUtterance(text)
  u.lang = target === 'vi' ? 'vi-VN' : 'en-US'
  u.rate = 0.9
  const voices = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith(target))
  const female = voices.find(v => /female|nữ|linh|hoai|my|samantha|nova|joanna/i.test(v.name)) ?? voices[0]
  if (female) u.voice = female
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}

export function Speak({ text, pair = DEFAULT_PAIR, size = 'md', className = '', dark = false, autoPlay = false }: { text: string; pair?: PairId; size?: 'sm' | 'md' | 'lg'; className?: string; dark?: boolean; autoPlay?: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  // One element for the life of the button: iOS unlocks an element, not the page.
  const audio = useRef<HTMLAudioElement | null>(null)
  // Bumped by every play and by cleanup, so a slow fetch for an old card never plays over the new one.
  const run = useRef(0)
  // The ::after box widens the phone hit area to 44px without changing the circle.
  const px = size === 'sm' ? 'h-6 w-6 after:-inset-2.5' : size === 'lg' ? 'h-10 w-10 after:-inset-0.5' : 'h-8 w-8 after:-inset-1.5'
  const icon = size === 'sm' ? 12 : size === 'lg' ? 18 : 15

  /** `tap` is true inside a click. iOS only starts media in the gesture, so the unlock runs before any await. */
  async function play(tap: boolean) {
    const id = run.current + 1
    run.current = id
    const a = (audio.current ??= new Audio())
    a.pause()
    a.onended = null
    a.onerror = null
    const cacheKey = `${pair}:${text}`
    let url = urlCache.get(cacheKey)
    if (tap && !url) {
      a.src = SILENCE
      a.play().catch(() => {})
      // Browser speech needs the same unlock in case the server sends us there.
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.speak(new SpeechSynthesisUtterance(''))
    }
    try {
      if (!url) {
        setState('loading')
        const res = await fetch(`/api/tts?pair=${pair}&text=${encodeURIComponent(text)}`)
        if (id !== run.current) return
        if (res.status === 503) { speakInBrowser(text, pair); setState('idle'); return }
        if (!res.ok) throw new Error(String(res.status))
        url = (await res.json()).url as string
        urlCache.set(cacheKey, url)
        if (id !== run.current) return
      }
      a.src = url
      a.onended = () => setState('idle')
      a.onerror = () => setState('idle')
      setState('playing')
      await a.play()
    } catch (err) {
      if (id !== run.current) return
      setState('idle')
      // A refused autoplay or an interrupted clip stays quiet rather than falling back to browser speech.
      const quiet = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'AbortError')
      if (!quiet) speakInBrowser(text, pair)
    }
  }

  useEffect(() => {
    if (!autoPlay) return
    const t = setTimeout(() => { play(false) }, 250)
    return () => { clearTimeout(t); run.current += 1; audio.current?.pause() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoPlay])

  const skin = dark
    ? 'border-on-dark-line bg-on-dark-soft text-sand hover:bg-on-dark-line focus-visible:ring-sand'
    : 'border-sand bg-cream-warm text-red hover:bg-sand focus-visible:ring-red'
  return (
    <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); play(true) }} aria-label={`Play “${text}”`}
      className={`relative inline-grid shrink-0 place-items-center rounded-full border after:absolute sm:after:hidden focus:outline-none focus-visible:ring-2 ${skin} ${px} ${state === 'playing' ? 'ring-4 ring-[color:var(--focus-ring)]' : ''} ${className}`}>
      {state === 'loading' ? <Loader2 size={icon} className="motion-safe:animate-spin" /> : <Volume2 size={icon} />}
    </button>
  )
}
