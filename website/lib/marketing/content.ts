// lib/marketing/content.ts
// Copy for the two landing pages. One shape, two languages, so the sections are
// written once. Keyword choices follow the SEO lens in the plan: the brand name
// belongs in the H1 and the schema, and the title tag is keyword-led.
import type { Locale, PairId } from '@/lib/pairs'

export interface Contrast { wrong: string; right: string; note: string }
export interface Step { title: string; body: string }
export interface Faq { q: string; a: string }

export interface Landing {
  locale: Locale
  pair: PairId
  path: string
  titleTag: string
  metaDescription: string
  keywords: string[]
  eyebrow: string
  h1: string
  lede: string
  ctaPrimary: string
  ctaSecondary: string
  contrastHeading: string
  contrastSub: string
  contrastWrongLabel: string
  contrastRightLabel: string
  contrasts: Contrast[]
  stepsHeading: string
  steps: Step[]
  sampleHeading: string
  sampleSub: string
  sampleFile: string
  accumulateHeading: string
  accumulateSub: string
  accumulate: { stat: string; label: string }[]
  pricingHeading: string
  pricingBody: string
  faqHeading: string
  faqs: Faq[]
  closingHeading: string
  closingBody: string
}

export const EN: Landing = {
  locale: 'en',
  pair: 'en-vi',
  path: '/',
  titleTag: 'Learn Conversational Southern Vietnamese — Daily Situation-Based Lessons',
  metaDescription:
    'Learn conversational Southern Vietnamese through daily lessons built around your real situations: ordering, dating, work, Grab rides. Three free lessons a week. No textbook Vietnamese.',
  keywords: ['learn conversational Vietnamese', 'Southern Vietnamese lessons', 'how to speak Vietnamese in Ho Chi Minh City', 'Vietnamese phrases for daily life'],
  eyebrow: 'Southern Vietnamese, daily',
  h1: 'Learn the Vietnamese people actually speak in Saigon',
  lede: 'Tell it what you expect to talk about today. Get the phrases a local would really use, what each one signals socially, and one grammar pattern you can reuse tomorrow.',
  ctaPrimary: 'Start free',
  ctaSecondary: 'See a real lesson',

  contrastHeading: 'Textbook Vietnamese is not what you will hear',
  contrastSub: 'Every lesson teaches the spoken Southern form, and tells you why it lands differently.',
  contrastWrongLabel: 'What the textbook says',
  contrastRightLabel: 'What Saigon says',
  contrasts: [
    { wrong: 'xem phim', right: 'coi phim', note: 'Both mean “watch a film”. Only one sounds like you live here.' },
    { wrong: 'không', right: 'hông', note: 'The Southern softening of the question word. Using it marks you instantly.' },
    { wrong: 'rẽ phải', right: 'quẹo phải', note: '“Turn right”, the way a Grab driver will understand it first time.' },
  ],

  stepsHeading: 'How a day works',
  steps: [
    { title: 'Say what is coming up', body: 'One box. “I am meeting my girlfriend’s parents on Sunday.” Anything you will actually have to say.' },
    { title: 'Get the lesson for that', body: 'Ten to fifteen phrases with the tone each one carries, the vocabulary worth keeping, and one grammar pattern the situation happens to teach.' },
    { title: 'Review the cards', body: 'Every phrase and word becomes a flashcard. Answer them, and the streak and vocabulary count take care of themselves.' },
  ],

  sampleHeading: 'A real lesson, not a mock-up',
  sampleSub: 'This is generated output from the situation “asking someone you like out to dinner”.',
  sampleFile: 'dinner.json',

  accumulateHeading: 'Disconnected days become a curriculum',
  accumulateSub: 'There is no fixed syllabus. What you needed to say becomes what you know, and the app keeps the running total.',
  accumulate: [
    { stat: '10–15', label: 'phrases a lesson' },
    { stat: '12–20', label: 'words a lesson' },
    { stat: '1', label: 'grammar pattern a day' },
  ],

  pricingHeading: 'Three lessons a week, free',
  pricingBody: 'No card to start. Upgrade when a situation a day has become the habit.',

  faqHeading: 'Questions people ask',
  faqs: [
    { q: 'How is Southern Vietnamese different from Northern Vietnamese?', a: 'Pronunciation, vocabulary and particles all differ. The South says coi phim where the North says xem phim, softens không to hông in questions, and leans on particles like nha and nè to set the tone. Learn the Northern forms in Saigon and you will be understood, but you will sound like a textbook.' },
    { q: 'Can I learn Vietnamese without studying grammar first?', a: 'Yes. Every lesson starts from a situation you are about to be in and teaches one grammar pattern that happens to appear in it. You learn the structure because you needed the sentence, not before you needed it.' },
    { q: 'How much Vietnamese do I need to live in Ho Chi Minh City?', a: 'You can get by on almost none, which is why most expats never progress. A few hundred well-chosen phrases covering Grab rides, ordering, small talk and work will change how people treat you far more than a large passive vocabulary.' },
    { q: 'Is Vietnamese Buddy free?', a: 'Three lessons a week are free with no card. Paid plans add unlimited lessons and the ability to rewrite any lesson with your own note.' },
    { q: 'What makes situation-based lessons better than a fixed curriculum?', a: 'A fixed curriculum teaches colours and family members in week one whether or not you need them. Situation-based lessons teach what you are about to say, which means you use it within a day, and using it is what makes it stick.' },
  ],

  closingHeading: 'What are you going to say today?',
  closingBody: 'Start with the conversation you are actually about to have.',
}

export const VI: Landing = {
  locale: 'vi',
  pair: 'vi-en',
  path: '/vi',
  titleTag: 'Học Tiếng Anh Giao Tiếp Theo Tình Huống — Mỗi Ngày Một Bài',
  metaDescription:
    'Học tiếng Anh giao tiếp qua bài học tạo riêng cho tình huống của bạn: đi làm, họp online, phỏng vấn, đi ăn, du lịch. Ba bài miễn phí mỗi tuần. Không học vẹt.',
  keywords: ['học tiếng Anh giao tiếp hàng ngày', 'luyện nói tiếng Anh theo tình huống', 'cách nói tiếng Anh tự nhiên', 'tiếng Anh cho người đi làm'],
  eyebrow: 'Tiếng Anh giao tiếp mỗi ngày',
  h1: 'Học tiếng Anh mà người bản xứ thật sự nói',
  lede: 'Bạn cho biết hôm nay cần dùng tiếng Anh trong tình huống nào. Ứng dụng tạo bài học riêng: câu nói tự nhiên, sắc thái của từng câu, và một điểm ngữ pháp dùng lại được ngày mai.',
  ctaPrimary: 'Học thử miễn phí',
  ctaSecondary: 'Xem một bài học thật',

  contrastHeading: 'Dịch thẳng từ tiếng Việt là lỗi thường gặp nhất',
  contrastSub: 'Mỗi câu đều giải thích vì sao cách nói kia nghe không tự nhiên.',
  contrastWrongLabel: 'Dịch thẳng',
  contrastRightLabel: 'Người bản xứ nói',
  contrasts: [
    { wrong: 'I very like it', right: 'I really like it', note: '“Rất” không dịch thành “very” trước động từ. Đây là lỗi phổ biến nhất của người Việt.' },
    { wrong: 'I very tired', right: 'I’m really tired', note: 'Tiếng Anh bắt buộc có “to be” trước tính từ, dù tiếng Việt thì không.' },
    { wrong: 'I have ever been to Da Nang', right: 'I’ve been to Da Nang', note: '“Đã từng” không dịch thành “have ever”. Câu hỏi mới dùng “ever”.' },
  ],

  stepsHeading: 'Một ngày học diễn ra thế nào',
  steps: [
    { title: 'Nói tình huống sắp tới', body: 'Một ô nhập. “Ngày mai tôi họp online với khách hàng người Mỹ.” Bất cứ điều gì bạn sắp phải nói.' },
    { title: 'Nhận bài học cho đúng tình huống đó', body: 'Mười đến mười lăm câu kèm sắc thái, từ vựng đáng giữ, và một điểm ngữ pháp xuất hiện tự nhiên trong tình huống.' },
    { title: 'Ôn bằng thẻ ghi nhớ', body: 'Mỗi câu và mỗi từ đều thành một thẻ. Bạn chỉ cần trả lời, phần chuỗi ngày và số từ đã học tự động theo.' },
  ],

  sampleHeading: 'Bài học thật, không phải ảnh minh hoạ',
  sampleSub: 'Đây là bài được tạo cho tình huống “nói chuyện với đồng nghiệp nước ngoài”.',
  sampleFile: 'vi-en/coworker.json',

  accumulateHeading: 'Những ngày rời rạc trở thành một lộ trình',
  accumulateSub: 'Không có giáo trình cố định. Điều bạn cần nói trở thành điều bạn biết, và ứng dụng giữ tổng số giúp bạn.',
  accumulate: [
    { stat: '10–15', label: 'câu mỗi bài' },
    { stat: '12–20', label: 'từ mỗi bài' },
    { stat: '1', label: 'điểm ngữ pháp mỗi ngày' },
  ],

  pricingHeading: 'Miễn phí trong thời gian thử nghiệm',
  pricingBody: 'Không cần thẻ. Chiều học tiếng Anh đang miễn phí hoàn toàn.',

  faqHeading: 'Câu hỏi thường gặp',
  faqs: [
    { q: 'Vì sao người Việt nói tiếng Anh hay bị người nghe không hiểu?', a: 'Phần lớn là do nuốt âm cuối và bỏ cụm phụ âm: “like” thành “lie”, “streets” thành “street”. Thêm vào đó là thiếu “s” số nhiều và “-ed” quá khứ. Mỗi bài học đều chỉ ra lỗi này ngay tại câu bạn đang học.' },
    { q: 'Tôi có cần học ngữ pháp trước không?', a: 'Không. Mỗi bài bắt đầu từ tình huống bạn sắp gặp và dạy một điểm ngữ pháp xuất hiện tự nhiên trong đó. Bạn học cấu trúc vì bạn cần câu nói, chứ không phải học trước rồi mới dùng.' },
    { q: 'Ứng dụng này khác gì lớp học tiếng Anh?', a: 'Lớp học đi theo giáo trình cố định. Ở đây bạn quyết định nội dung mỗi ngày bằng tình huống thật của mình, nên bạn dùng được ngay trong ngày, và dùng được mới nhớ lâu.' },
    { q: 'Ứng dụng có miễn phí không?', a: 'Chiều học tiếng Anh hiện miễn phí hoàn toàn trong thời gian thử nghiệm, không cần thẻ.' },
    { q: 'Giải thích bằng tiếng Việt hay tiếng Anh?', a: 'Bằng tiếng Việt. Câu cần học là tiếng Anh, còn phần giải thích sắc thái và lỗi thường gặp đều viết bằng tiếng Việt để bạn hiểu đúng ngay từ đầu.' },
  ],

  closingHeading: 'Hôm nay bạn muốn nói gì?',
  closingBody: 'Bắt đầu từ đúng cuộc trò chuyện bạn sắp có.',
}

export const LANDINGS = { en: EN, vi: VI }
