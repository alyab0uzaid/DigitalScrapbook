'use client'

import { useState, useTransition } from 'react'
import { acceptFriendRequest, declineFriendRequest, markNotificationsRead } from '@/app/actions/friends'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  actor_id: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
  actor?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  } | null
  request_id?: string | null
}

export default function NotificationBell({
  notifications: initial,
}: {
  notifications: Notification[]
}) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(initial)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const unread = notifications.filter(n => !n.read_at)

  function handleOpen() {
    setOpen(v => !v)
    // Mark all as read when opened
    const unreadIds = unread.map(n => n.id)
    if (unreadIds.length > 0) {
      startTransition(async () => {
        await markNotificationsRead(unreadIds)
        setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n))
      })
    }
  }

  function handleAccept(requestId: string, notifId: string) {
    startTransition(async () => {
      await acceptFriendRequest(requestId)
      setNotifications(prev => prev.filter(n => n.id !== notifId))
      router.refresh()
    })
  }

  function handleDecline(requestId: string, notifId: string) {
    startTransition(async () => {
      await declineFriendRequest(requestId)
      setNotifications(prev => prev.filter(n => n.id !== notifId))
    })
  }

  function actorName(n: Notification) {
    return n.actor?.full_name ?? n.actor?.username ?? 'Someone'
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
        aria-label="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v2.25L2 9.5v.5h12v-.5l-1.5-1.25V6A4.5 4.5 0 0 0 8 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
          <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        </svg>
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-stone-900 rounded-full flex items-center justify-center font-mono text-[8px] text-white leading-none">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl z-40 overflow-hidden">
            <div className="px-4 pt-4 pb-2 border-b border-stone-100">
              <p className="font-serif text-sm font-medium text-stone-900">Notifications</p>
            </div>

            {notifications.length === 0 ? (
              <p className="font-mono text-xs text-stone-400 text-center py-8">All caught up.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-stone-50">
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 ${!n.read_at ? 'bg-stone-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      {/* Actor avatar */}
                      <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden shrink-0 mt-0.5">
                        {n.actor?.avatar_url ? (
                          <Image src={n.actor.avatar_url} alt={n.actor.username} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-serif text-sm text-stone-500">
                            {(n.actor?.full_name?.[0] ?? n.actor?.username?.[0] ?? '?').toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm text-stone-900 leading-snug">
                          {n.type === 'friend_request' && (
                            <><span className="font-medium">{actorName(n)}</span> wants to be your friend</>
                          )}
                          {n.type === 'friend_accepted' && (
                            <><span className="font-medium">{actorName(n)}</span> accepted your friend request</>
                          )}
                        </p>
                        <p className="font-mono text-[9px] text-stone-400 mt-0.5">{formatDate(n.created_at)}</p>

                        {n.type === 'friend_request' && n.request_id && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleAccept(n.request_id!, n.id)}
                              className="font-mono text-[10px] bg-stone-900 text-white px-2.5 py-1 rounded-lg hover:bg-stone-700 transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(n.request_id!, n.id)}
                              className="font-mono text-[10px] text-stone-400 hover:text-stone-600 transition"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
