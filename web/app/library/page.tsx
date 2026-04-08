import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LibraryView from './components/LibraryView'
import { getNavData } from '@/app/[username]/lib/getNavData'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, username')
    .eq('id', user.id)
    .single()

  if (!profile?.username) redirect('/onboarding')

  const [
    { data: items },
    { data: collections },
    navData,
    { data: friendRequestsRaw },
    { data: notificationsRaw },
  ] = await Promise.all([
    supabase
      .from('items')
      .select('id, title, image_url, type, status, metadata, collection_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('collections')
      .select('id, name, type, description, is_public, created_at, collection_items(item_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    getNavData(profile.id, true, supabase),
    // All accepted/pending friend requests involving this user
    supabase
      .from('friend_requests')
      .select('id, from_id, to_id, status')
      .or(`from_id.eq.${user.id},to_id.eq.${user.id}`),
    // Recent notifications (last 30)
    supabase
      .from('notifications')
      .select('id, type, actor_id, data, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  // Collect all actor IDs from notifications for batch fetch
  const actorIds = [...new Set((notificationsRaw ?? []).map(n => n.actor_id))]
  const { data: actorProfiles } = actorIds.length > 0
    ? await supabase.from('users').select('id, username, full_name, avatar_url').in('id', actorIds)
    : { data: [] }

  // Collect friend user IDs for batch fetch
  const friendRequests = friendRequestsRaw ?? []
  const friendUserIds = friendRequests
    .filter(r => r.status === 'accepted')
    .map(r => r.from_id === user.id ? r.to_id : r.from_id)
  const pendingFromOthers = friendRequests.filter(r => r.status === 'pending' && r.to_id === user.id)
  const pendingFromIds = pendingFromOthers.map(r => r.from_id)

  const allUserIds = [...new Set([...friendUserIds, ...pendingFromIds])]
  const { data: friendProfiles } = allUserIds.length > 0
    ? await supabase.from('users').select('id, username, full_name, avatar_url').in('id', allUserIds)
    : { data: [] }

  // Shape data for LibraryView
  const friends = friendRequests
    .filter(r => r.status === 'accepted')
    .map(r => {
      const friendId = r.from_id === user.id ? r.to_id : r.from_id
      const u = friendProfiles?.find(p => p.id === friendId)
      if (!u) return null
      return { request_id: r.id, user: u }
    })
    .filter(Boolean) as { request_id: string; user: { id: string; username: string; full_name: string | null; avatar_url: string | null } }[]

  const pendingRequests = pendingFromOthers
    .map(r => {
      const u = friendProfiles?.find(p => p.id === r.from_id)
      if (!u) return null
      return { id: r.id, from_user: u }
    })
    .filter(Boolean) as { id: string; from_user: { id: string; username: string; full_name: string | null; avatar_url: string | null } }[]

  // Build notification request_id lookup: find pending request from actor to current user
  const pendingRequestByActor = Object.fromEntries(
    friendRequests
      .filter(r => r.status === 'pending' && r.to_id === user.id)
      .map(r => [r.from_id, r.id])
  )

  const notifications = (notificationsRaw ?? []).map(n => ({
    ...n,
    actor: actorProfiles?.find(a => a.id === n.actor_id) ?? null,
    request_id: n.type === 'friend_request' ? (pendingRequestByActor[n.actor_id] ?? null) : null,
    data: (n.data ?? {}) as Record<string, unknown>,
  }))

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <LibraryView
          items={items ?? []}
          collections={collections ?? []}
          username={profile.username}
          navSections={navData.sections}
          navCollections={navData.collections}
          friends={friends}
          pendingRequests={pendingRequests}
          notifications={notifications}
        />
      </div>
    </div>
  )
}
