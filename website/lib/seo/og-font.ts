// lib/seo/og-font.ts — loads a Google Font as TTF for ImageResponse (Satori), subset to the glyphs used.
export async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`,
    // An old UA makes Google serve TTF, which Satori can read (it cannot read woff2).
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:5.0) Gecko/20100101 Firefox/5.0' } },
  ).then(r => r.text())
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype|woff)'\)/)?.[1]
  if (!url) throw new Error(`No TTF url for ${family}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`)
  return res.arrayBuffer()
}
