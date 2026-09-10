// app/icon.tsx — favicon. A capital Đ, the letter English keyboards can't type, on the accent green.
import { ImageResponse } from 'next/og'
import { loadGoogleFont } from '@/lib/seo/og-font'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default async function Icon() {
  const font = await loadGoogleFont('Be Vietnam Pro', 700, 'Đ')
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#AF0D0E', borderRadius: 14, color: '#FFFFFF',
        fontFamily: 'Be Vietnam Pro', fontSize: 44, fontWeight: 700, lineHeight: 1, paddingBottom: 4,
      }}>
        Đ
      </div>
    ),
    { ...size, fonts: [{ name: 'Be Vietnam Pro', data: font, weight: 700, style: 'normal' }] },
  )
}
