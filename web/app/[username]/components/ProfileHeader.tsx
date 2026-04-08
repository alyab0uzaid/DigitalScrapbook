'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'
import FriendButton from './FriendButton'

type FriendStatus = 'none' | 'request_sent' | 'request_received' | 'friends'

type Props = {
  username: string
  fullName: string | null
  bio: string | null
  avatarUrl: string | null
  isOwner: boolean
  editMode: boolean
  onEditToggle: () => void
  friendStatus?: FriendStatus
  profileUserId?: string
  pendingRequestId?: string | null
  isLoggedIn?: boolean
}

export default function ProfileHeader({ username, fullName, bio, avatarUrl, isOwner, editMode, onEditToggle, friendStatus, profileUserId, pendingRequestId, isLoggedIn }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [localName, setLocalName] = useState(fullName ?? '')
  const [localBio, setLocalBio] = useState(bio ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const avatarFileRef = useRef<File | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const bioRef = useRef<HTMLTextAreaElement>(null)

  const displayName = localName || username
  const initials = (localName?.[0] ?? username[0]).toUpperCase()

  // Focus name input when entering edit mode
  useEffect(() => {
    if (editMode) setTimeout(() => nameInputRef.current?.focus(), 0)
  }, [editMode])

  // Auto-resize textarea
  useEffect(() => {
    const el = bioRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [localBio, editMode])

  function handleDiscard() {
    setLocalName(fullName ?? '')
    setLocalBio(bio ?? '')
    setAvatarPreview(avatarUrl)
    avatarFileRef.current = null
    setError(null)
    onEditToggle()
  }

  function handleSave() {
    setSaving(true)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('full_name', localName)
      fd.append('bio', localBio)
      if (avatarFileRef.current) fd.append('avatar', avatarFileRef.current)
      const result = await updateProfile(fd)
      if (result?.error) {
        setError(result.error)
        setSaving(false)
        return
      }
      avatarFileRef.current = null
      setSaving(false)
      onEditToggle()
      router.refresh()
    })
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    avatarFileRef.current = file
    setAvatarPreview(URL.createObjectURL(file))
  }

  return (
    <div className="mb-10">
      <div className="flex items-start justify-between gap-4">
        {/* Avatar + name */}
        <div className="flex items-start gap-5 min-w-0">
          <div className="relative shrink-0 group/avatar mt-1">
            <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center font-serif text-3xl text-stone-500 overflow-hidden">
              {avatarPreview
                ? <img src={avatarPreview} alt={displayName} className="w-full h-full object-cover" />
                : initials
              }
            </div>
            {editMode && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-white">
                  <path d="M11 2L14 5L5 14H2V11L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="min-w-0">
            {editMode ? (
              <input
                ref={nameInputRef}
                value={localName}
                onChange={e => setLocalName(e.target.value)}
                placeholder={username}
                className="font-serif text-6xl font-light text-stone-900 bg-stone-50 outline-none border-none w-full rounded px-1 -mx-1 placeholder:text-stone-300 leading-tight"
              />
            ) : (
              <h1 className="font-serif text-6xl font-light text-stone-900 leading-tight">
                {displayName}
              </h1>
            )}
            <p className="font-mono text-xs text-stone-400 mt-1">@{username}</p>
            {editMode ? (
              <textarea
                ref={bioRef}
                value={localBio}
                onChange={e => setLocalBio(e.target.value)}
                placeholder="Write something about yourself…"
                rows={1}
                className="w-full font-serif text-sm text-stone-500 bg-stone-50 outline-none border-none resize-none placeholder:text-stone-300 rounded px-1 -mx-1 leading-relaxed overflow-hidden mt-1"
              />
            ) : (
              bio && <p className="font-serif mt-1.5 text-sm text-stone-600">{bio}</p>
            )}
            {error && <p className="font-mono text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>

        {/* Friend button — shown to logged-in non-owners */}
        {!isOwner && isLoggedIn && profileUserId && friendStatus !== undefined && (
          <div className="shrink-0">
            <FriendButton
              profileUserId={profileUserId}
              initialStatus={friendStatus}
              pendingRequestId={pendingRequestId}
            />
          </div>
        )}

        {/* Edit Profile / Save + Cancel */}
        {isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-stone-900 px-4 py-1.5 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={handleDiscard}
                  disabled={saving}
                  className="rounded-lg px-4 py-1.5 font-mono text-xs text-stone-400 hover:text-stone-700 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={onEditToggle}
                className="rounded-lg px-4 py-1.5 font-mono text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
