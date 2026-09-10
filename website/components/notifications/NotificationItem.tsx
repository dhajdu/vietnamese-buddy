'use client'

// TODO: npm install date-fns  (if not already installed)
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/lib/notifications/queries'

// TODO: replace Tailwind classes below with project design system tokens

const TYPE_STYLES: Record<Notification['type'], string> = {
  info: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200',
}

const TYPE_DOT: Record<Notification['type'], string> = {
  info: 'bg-blue-400',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  error: 'bg-red-400',
}

interface Props {
  notification: Notification
  onRead: () => void
  onActionClick: () => void
}

export function NotificationItem({ notification, onRead, onActionClick }: Props) {
  const { id, type, title, body, read_at, action_url, created_at } = notification
  const isUnread = read_at === null

  const relativeTime = formatDistanceToNow(new Date(created_at), {
    addSuffix: true,
  })

  function handleClick() {
    if (isUnread) onRead()
    if (action_url) onActionClick()
  }

  const content = (
    <div
      className={[
        'flex gap-3 px-4 py-3 border-l-2 transition-colors',
        isUnread ? TYPE_STYLES[type] : 'bg-white border-transparent',
      ].join(' ')}
    >
      {/* Unread dot */}
      <span className="mt-1 flex-shrink-0">
        <span
          className={[
            'block h-2 w-2 rounded-full',
            isUnread ? TYPE_DOT[type] : 'bg-transparent',
          ].join(' ')}
          aria-hidden="true"
        />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>

        {body && (
          <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{body}</p>
        )}

        <p className="mt-1 text-xs text-gray-400">{relativeTime}</p>
      </div>
    </div>
  )

  if (action_url) {
    return (
      <a
        href={action_url}
        onClick={handleClick}
        className="block hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
        aria-label={`${title}${isUnread ? ' (unread)' : ''}`}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={isUnread ? onRead : undefined}
      className="block w-full text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
      aria-label={`${title}${isUnread ? ' (unread)' : ''}`}
      data-notification-id={id}
    >
      {content}
    </button>
  )
}
