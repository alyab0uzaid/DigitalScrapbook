'use client'

import { useState } from 'react'
import ProfileHeader from './ProfileHeader'
import ProfileGrid from './ProfileGrid'

type Widget = Parameters<typeof ProfileGrid>[0]['widgets'][number]
type PlaceItem = { id: string; title: string | null; metadata: Record<string, unknown> }

type Props = {
  username: string
  fullName: string | null
  bio: string | null
  avatarUrl: string | null
  isOwner: boolean
  widgets: Widget[]
  collections: { id: string; name: string; type: string }[]
  items: { id: string; title: string | null; type: string; image_url: string | null; status: string | null; metadata?: Record<string, unknown> | null }[]
  places: PlaceItem[]
}

export default function ProfilePageClient({
  username, fullName, bio, avatarUrl, isOwner,
  widgets, collections, items, places,
}: Props) {
  const [editMode, setEditMode] = useState(false)

  return (
    <>
      <ProfileHeader
        username={username}
        fullName={fullName}
        bio={bio}
        avatarUrl={avatarUrl}
        isOwner={isOwner}
        editMode={editMode}
        onEditToggle={() => setEditMode(e => !e)}
      />
      <ProfileGrid
        widgets={widgets}
        username={username}
        isOwner={isOwner}
        collections={collections}
        items={items}
        places={places}
        editMode={editMode}
        onEditToggle={() => setEditMode(e => !e)}
      />
    </>
  )
}
