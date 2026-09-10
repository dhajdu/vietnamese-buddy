// lib/ai/schema.ts
import { z } from 'zod'

const Phrase = z.object({
  vietnamese: z.string().min(1),
  english: z.string().min(1),
  explanation: z.string().min(20),
})
const Vocab = z.object({
  vietnamese: z.string().min(1),
  english: z.string().min(1),
})

export const LessonSchema = z.object({
  title: z.string().min(3).max(80),
  situation: z.string().min(3),
  phrases: z.array(Phrase).min(10).max(15),
  vocabulary: z.array(Vocab).min(12).max(20),
  grammar: z.object({
    title: z.string().min(3),
    pattern: z.string().min(2),
    explanation: z.string().min(40),
    examples: z.array(Phrase).min(3).max(5),
  }),
})

export type Lesson = z.infer<typeof LessonSchema>
export type LessonPhrase = z.infer<typeof Phrase>
