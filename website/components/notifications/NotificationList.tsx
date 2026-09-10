'use client'

import { useNotifications, useMarkAsRead } from '@/lib/notifications/queries'
import { NotificationItem } from './NotificationItem'

interface Props {
  onClose: () => void
}

export function NotificationList({ onClose }: Props) {
  const { data: notifications, isLoading } = useNotifications()
  const { mutate: markAsRead } = useMarkAsRead()

  const unread = notifications?.filter((n) => n.read_at === null) ?? []

  function handleMarkAllRead() {
    unread.forEach((n) => markAsRead(n.id))
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900">Notifications</span>
        {unread.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {isLoading && (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">Loading…</p>
        )}

        {!isLoading && (!notifications || notifications.length === 0) && (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            No notifications yet.
          </p>
        )}

        {!isLoading &&
          notifications?.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => {
                markAsRead(notification.id)
              }}
              onActionClick={onClose}
            />
          ))}
      </div>
    </div>
  )
}
