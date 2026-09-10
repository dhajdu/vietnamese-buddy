// lib/lessons/suggestions.ts — situation chips for the Home input.
const POOL = [
  'Talking to a Grab driver', 'Ordering cơm tấm at a street stall', 'Making weekend plans with a friend',
  'Small talk at the gym', 'Asking a coworker to lunch', 'Meeting my partner’s parents', 'Bargaining at Bến Thành market',
  'Explaining what I do for work', 'Telling a friend about my weekend', 'At the pharmacy with a cold',
  'Getting a haircut', 'Asking for the wifi password at a café', 'Renewing my visa at an agent', 'Complimenting someone’s cooking',
  'Cancelling plans politely', 'Asking a neighbour about the parking rules',
]

/** Four chips the learner hasn't obviously covered, rotating daily. */
export function pickSuggestions(existingSituations: string[], seedDay: number): string[] {
  const seen = existingSituations.map(s => s.toLowerCase())
  const fresh = POOL.filter(p => !seen.some(s => s.includes(p.toLowerCase().split(' ').slice(-2).join(' '))))
  const pool = fresh.length >= 4 ? fresh : POOL
  const start = seedDay % pool.length
  return Array.from({ length: 4 }, (_, i) => pool[(start + i * 3) % pool.length])
}

export function greeting(tz: string, name: string | null, now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', hour12: false }).format(now))
  const chao = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  return name ? `${chao}, ${name}.` : `${chao}.`
}
