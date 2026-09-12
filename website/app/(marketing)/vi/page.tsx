// app/(marketing)/vi/page.tsx — Vietnamese landing. Full copy lands in the marketing PR.
import Link from 'next/link'

export const metadata = { title: 'Học tiếng Anh giao tiếp' }

export default function LandingViPage() {
  return (
    <section lang="vi" className="mx-auto max-w-3xl px-6 py-24">
      <p className="eyebrow">Tiếng Anh giao tiếp mỗi ngày</p>
      <h1 className="t-title text-4xl sm:text-5xl">Học tiếng Anh mà người bản xứ thật sự nói</h1>
      <p className="gloss mt-4 max-w-[60ch] text-xl">
        Bạn nói hôm nay bạn cần dùng tiếng Anh trong tình huống nào, ứng dụng sẽ tạo bài học riêng cho tình huống đó:
        câu nói tự nhiên, từ vựng dùng lại được, một điểm ngữ pháp, và thẻ ghi nhớ để giữ chuỗi ngày học.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/signup" className="btn-red">Học thử miễn phí</Link>
        <Link href="/pricing" className="btn-quiet">Xem giá</Link>
      </div>
    </section>
  )
}
