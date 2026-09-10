// app/opengraph-image.tsx — 1200×630 social card. Also reused by app/twitter-image.tsx.
import { ImageResponse } from 'next/og'
import { loadGoogleFont } from '@/lib/seo/og-font'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo/metadata'

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PHRASE = 'Tối nay đi ăn hông?'
const GLOSS = 'Want to grab dinner tonight?'
const NOTE = 'hông, not không. That’s how Saigon actually says it.'

export default async function OgImage() {
  const [display, body] = await Promise.all([
    loadGoogleFont('Be Vietnam Pro', 700, PHRASE + SITE_NAME + 'Đ'),
    loadGoogleFont('Playfair Display', 400, GLOSS + NOTE + SITE_TAGLINE),
  ])
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: '#FEF9EF', color: '#111111', padding: '64px 72px', fontFamily: 'Playfair Display',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: '#AF0D0E', color: '#FFFFFF', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontFamily: 'Be Vietnam Pro', fontSize: 38, fontWeight: 700, paddingBottom: 4,
          }}>Đ</div>
          <div style={{ fontFamily: 'Be Vietnam Pro', fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: 'Be Vietnam Pro', fontSize: 104, fontWeight: 700, color: '#111111', letterSpacing: -3, lineHeight: 1.05 }}>{PHRASE}</div>
          <div style={{ fontSize: 40, color: '#3D3A37' }}>{GLOSS}</div>
          <div style={{ fontSize: 28, color: '#9E9A93', marginTop: 6 }}>{NOTE}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #EEE6DC', paddingTop: 26 }}>
          <div style={{ fontSize: 27, color: '#111111', flex: 1, paddingRight: 24 }}>{SITE_TAGLINE}</div>
          <div style={{ fontFamily: 'Be Vietnam Pro', fontSize: 22, fontWeight: 700, color: '#AF0D0E', whiteSpace: 'nowrap' }}>vietnamese-buddy.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Be Vietnam Pro', data: display, weight: 700, style: 'normal' },
        { name: 'Playfair Display', data: body, weight: 400, style: 'normal' },
      ],
    },
  )
}
