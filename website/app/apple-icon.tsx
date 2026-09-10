// app/apple-icon.tsx — 180px home-screen icon, same mark as app/icon.tsx.
import { ImageResponse } from 'next/og'
import { loadGoogleFont } from '@/lib/seo/og-font'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const font = await loadGoogleFont('Be Vietnam Pro', 700, 'Đ')
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#AF0D0E', color: '#FFFFFF',
        fontFamily: 'Be Vietnam Pro', fontSize: 124, fontWeight: 700, lineHeight: 1, paddingBottom: 10,
      }}>
        Đ
      </div>
    ),
    { ...size, fonts: [{ name: 'Be Vietnam Pro', data: font, weight: 700, style: 'normal' }] },
  )
}
