// components/chat/MessageBubble.tsx
'use client'
import { isToolUIPart, type UIMessage } from 'ai'
import { Response, Reasoning } from './elements'
import { ToolCallBlock } from './ToolCallBlock'

interface Props {
  message: UIMessage
}

export function MessageBubble({ message }: Props) {
  return (
    <div
      className={
        message.role === 'user'
          ? 'user-bubble ml-auto max-w-[75%] rounded-2xl bg-blue-500 px-4 py-2 text-white'
          : 'ai-bubble mr-auto max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2 text-gray-900'
      }
    >
      {message.parts.map((part, i) => {
        if (part.type === 'text') {
          return <Response key={i}>{part.text}</Response>
        }
        if (part.type === 'reasoning') {
          return (
            <details key={i} className="text-xs text-gray-500 mt-1">
              <summary>Reasoning</summary>
              <Reasoning>{part.text}</Reasoning>
            </details>
          )
        }
        if (isToolUIPart(part)) {
          return <ToolCallBlock key={part.toolCallId} part={part} />
        }
        return null
      })}
    </div>
  )
}
