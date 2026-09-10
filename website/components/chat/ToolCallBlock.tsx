// components/chat/ToolCallBlock.tsx
import type { UIMessage } from 'ai'

// UIMessage['parts'][number] gives the union of all part types;
// tool parts (static `tool-*` and dynamic-tool) are the ones with a toolCallId
type AnyPart = UIMessage['parts'][number]
type ToolPart = Extract<AnyPart, { toolCallId: string }>

interface Props {
  part: ToolPart
}

export function ToolCallBlock({ part }: Props) {
  const toolName =
    'toolName' in part ? part.toolName : part.type.replace(/^tool-/, '')

  return (
    <div className="my-2 rounded border border-gray-200 bg-gray-50 p-3 text-sm font-mono">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span className="font-semibold text-gray-700">{toolName}</span>
        <span className="rounded bg-gray-200 px-1">{part.state}</span>
      </div>

      {(part.state === 'input-available' || part.state === 'output-available') && (
        <div className="mb-1">
          <span className="text-gray-500">Input: </span>
          <pre className="inline whitespace-pre-wrap break-all">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        </div>
      )}

      {part.state === 'output-available' && (
        <div>
          <span className="text-gray-500">Output: </span>
          <pre className="inline whitespace-pre-wrap break-all">
            {JSON.stringify(part.output, null, 2)}
          </pre>
        </div>
      )}

      {part.state === 'output-error' && (
        <div className="text-red-600">Tool call failed.</div>
      )}
    </div>
  )
}
