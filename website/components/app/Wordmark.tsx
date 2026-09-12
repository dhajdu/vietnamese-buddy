// components/app/Wordmark.tsx
import Link from 'next/link'

export function Wordmark({ dark = true, href = '/app' }: { dark?: boolean; href?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2 font-serif text-[17px] ${dark ? 'text-sand' : 'text-ink'}`}>
      <span className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-red pb-[2px] font-vn text-base font-extrabold text-white">Đ</span>
      Vietnamese Buddy
    </Link>
  )
}
