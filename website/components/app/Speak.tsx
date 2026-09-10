// components/app/Speak.tsx — speaker button. Plays FPT.AI Southern audio via /api/tts,
// falls back to the browser's Vietnamese voice when the server has no TTS key.
'use client'
import { useEffect, useRef, useState } from 'react'
import { Volume2, Loader2 } from 'lucide-react'

const urlCache = new Map<string, string>()

function speakInBrowser(text: string) {
  if (typeof speechSynthesis === 'undefined') return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'vi-VN'
  u.rate = 0.9
  const voices = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('vi'))
  const female = voices.find(v => /female|nữ|linh|hoai|my/i.test(v.name)) ?? voices[0]
  if (female) u.voice = female
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}

export function Speak({ text, size = 'md', className = '', dark = false, autoPlay = false }: { text: string; size?: 'sm' | 'md' | 'lg'; className?: string; dark?: boolean; autoPlay?: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const audio = useRef<HTMLAudioElement | null>(null)
  const px = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'
  const icon = size === 'sm' ? 12 : size === 'lg' ? 18 : 15

  async function play(e?: React.MouseEvent) {
    e?.preventDefault(); e?.stopPropagation()
    if (state === 'loading') return
    audio.current?.pause()
    try {
      let url = urlCache.get(text)
      if (!url) {
        setState('loading')
        const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`)
        if (res.status === 503) { speakInBrowser(text); setState('idle'); return }
        if (!res.ok) throw new Error(String(res.status))
        url = (await res.json()).url as string
        urlCache.set(text, url)
      }
      const a = new Audio(url)
      audio.current = a
      setState('playing')
      a.onended = () => setState('idle')
      a.onerror = () => setState('idle')
      await a.play()
    } catch {
      setState('idle')
      speakInBrowser(text)
    }
  }

  useEffect(() => {
    if (!autoPlay) return
    const t = setTimeout(() => { play() }, 250)
    return () => { clearTimeout(t); audio.current?.pause() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoPlay])

  const skin = dark
    ? 'border-on-dark-line bg-on-dark-soft text-sand hover:bg-on-dark-line'
    : 'border-sand bg-cream-warm text-red hover:bg-sand'
  return (
    <button type="button" onClick={play} aria-label={`Play “${text}”`} title="Listen (Southern voice)"
      className={`inline-grid shrink-0 place-items-center rounded-full border focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)] ${skin} ${px} ${state === 'playing' ? 'ring-4 ring-[color:var(--focus-ring)]' : ''} ${className}`}>
      {state === 'loading' ? <Loader2 size={icon} className="animate-spin" /> : <Volume2 size={icon} />}
    </button>
  )
}
