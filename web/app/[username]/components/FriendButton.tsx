'use client'

import { useState, useTransition } from 'react'
import { sendFriendRequest, cancelFriendRequest, removeFriend, acceptFriendRequest } from '@/app/actions/friends'
import { useRouter } from 'next/navigation'

type FriendStatus =
  | 'none'           // not connected
  | 'request_sent'   // current user sent a pending request
  | 'request_received' // profile user sent a pending request to current user
  | 'friends'        // accepted

export default function FriendButton({
  profileUserId,
  initialStatus,
  pendingRequestId,
}: {
  profileUserId: string
  initialStatus: FriendStatus
  pendingRequestId?: string | null
}) {
  const [status, setStatus] = useState(initialStatus)
  const [reqId, setReqId] = useState(pendingRequestId ?? null)
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  function act(fn: () => Promise<{ error?: string; success?: boolean }>, optimisticStatus: FriendStatus) {
    const prev = status
    setStatus(optimisticStatus)
    startTransition(async () => {
      const res = await fn()
      if (res?.error) {
        setStatus(prev) // revert on error
      } else {
        router.refresh()
      }
    })
  }

  if (status === 'friends') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowConfirm(v => !v)}
          className="rounded-lg px-4 py-1.5 font-mono text-xs text-stone-500 border border-stone-200 hover:border-stone-300 transition"
        >
          Friends ✓
        </button>
        {showConfirm && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg p-3 z-10 min-w-[160px]">
            <p className="font-mono text-[10px] text-stone-400 mb-2">Remove friend?</p>
            <button
              onClick={() => {
                setShowConfirm(false)
                act(() => removeFriend(profileUserId), 'none')
              }}
              disabled={isPending}
              className="w-full text-left font-mono text-xs text-red-500 hover:text-red-700 transition"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    )
  }

  if (status === 'request_sent') {
    return (
      <button
        onClick={() => act(() => cancelFriendRequest(profileUserId), 'none')}
        disabled={isPending}
        className="rounded-lg px-4 py-1.5 font-mono text-xs text-stone-400 border border-stone-200 hover:border-stone-300 transition disabled:opacity-50"
      >
        {isPending ? '…' : 'Request Sent'}
      </button>
    )
  }

  if (status === 'request_received' && reqId) {
    return (
      <button
        onClick={() => act(async () => {
          const res = await acceptFriendRequest(reqId)
          if (res?.success) setStatus('friends')
          return res
        }, 'friends')}
        disabled={isPending}
        className="rounded-lg bg-stone-900 px-4 py-1.5 font-mono text-xs text-white hover:bg-stone-700 transition disabled:opacity-50"
      >
        {isPending ? '…' : 'Accept Request'}
      </button>
    )
  }

  // none
  return (
    <button
      onClick={() => {
        act(async () => {
          const res = await sendFriendRequest(profileUserId)
          return res
        }, 'request_sent')
      }}
      disabled={isPending}
      className="rounded-lg bg-stone-900 px-4 py-1.5 font-mono text-xs text-white hover:bg-stone-700 transition disabled:opacity-50"
    >
      {isPending ? '…' : 'Add Friend'}
    </button>
  )
}
