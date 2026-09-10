// app/api/chat/route.ts
import { convertToModelMessages, generateText, streamText, type UIMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { TITLE_MODEL } from '@/lib/chat/constants'
// No provider import needed — AI Gateway is the default provider in ai v6

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { message, sessionId }: { message: UIMessage; sessionId: string } =
    await req.json()

  // Verify session ownership
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('model')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) return new Response('Not Found', { status: 404 })

  // Count existing messages to detect first response
  const { count } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const isFirstMessage = (count ?? 0) === 0

  // Save incoming user message
  await supabase.from('chat_messages').insert({
    session_id: sessionId,
    user_id: user.id,
    role: 'user',
    parts: message.parts,
  })

  // Load full history (including just-saved user message)
  const { data: history } = await supabase
    .from('chat_messages')
    .select('id, role, parts')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(100)

  const messages: UIMessage[] = (history ?? []).map(row => ({
    id: row.id,
    role: row.role as UIMessage['role'],
    parts: row.parts,
  }))

  const result = streamText({
    model: session.model, // AI Gateway routes 'anthropic/...', 'openai/...', etc. automatically
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ responseMessage }) => {
      // Save assistant message
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        role: 'assistant',
        parts: responseMessage.parts,
      })

      // Bump updated_at on session
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)

      // Auto-title on first exchange (fire-and-forget)
      if (isFirstMessage) {
        const firstTextPart = message.parts.find(p => p.type === 'text')
        const firstUserText =
          firstTextPart && 'text' in firstTextPart ? firstTextPart.text : ''

        if (firstUserText) {
          generateText({
            model: TITLE_MODEL,
            prompt: `Summarise this message in 6 words or fewer as a chat title. Reply with ONLY the title, no quotes:\n\n${firstUserText}`,
          })
            .then(({ text }) =>
              supabase
                .from('chat_sessions')
                .update({ title: text.trim() })
                .eq('id', sessionId)
            )
            .catch(() => {/* auto-title failure is non-critical */})
        }
      }
    },
  })
}
