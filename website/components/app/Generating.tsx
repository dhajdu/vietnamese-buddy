// components/app/Generating.tsx — the wait state for any lesson generation.
// Used by the create form and by Adjust, so a 45-second call never reads as a hang.
'use client'
import { useEffect, useState } from 'react'

export function Generating({ echo, lines, dark = false }: { echo: string; lines: string[]; dark?: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % lines.length), 4000)
    return () => clearInterval(t)
  }, [lines.length])

  return (
    <div className={`space-y-3 rounded-card p-4 ${dark ? 'bg-on-dark-soft' : 'bg-white shadow-float'}`} aria-live="polite">
      <p className={`t-gloss text-[17px] italic ${dark ? 'text-sand' : ''}`}>&ldquo;{echo}&rdquo;</p>
      <div className={`h-1.5 w-full overflow-hidden rounded ${dark ? 'bg-on-dark-line' : 'bg-sand'}`}>
        <div className={`h-full w-1/2 animate-pulse ${dark ? 'bg-red-bright' : 'bg-red'}`} />
      </div>
      <p className={`text-sm ${dark ? 'text-sand-70' : 'text-body'}`}>{lines[i]}</p>
    </div>
  )
}
