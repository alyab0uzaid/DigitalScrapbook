import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfilePageClient from './components/ProfilePageClient'
import ProfileNav from './components/ProfileNav'
import { getNavData } from './lib/getNavData'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, full_name, bio, avatar_url, is_public')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  const { data: currentUserProfile } = user && !isOwner
    ? await supabase.from('users').select('username').eq('id', user.id).single()
    : { data: null }

  const [{ data: widgets }, { data: collections }, { data: items }, { data: places }, navData, { data: friendRequest }] = await Promise.all([
    supabase
      .from('profile_widgets')
      .select(`
        id, widget_size, widget_title, display_order, item_type,
        item:items(id, title, image_url, type, status, metadata, created_at),
        collection:collections(
          id, name, type, description,
          collection_items(display_order, item:items(id, title, image_url, type))
        )
      `)
      .eq('user_id', profile.id)
      .order('display_order', { ascending: true }),
    isOwner
      ? supabase
          .from('collections')
          .select('id, name, type')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as { id: string; name: string; type: string }[] }),
    supabase
      .from('items')
      .select('id, title, type, image_url, status, metadata')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('items')
      .select('id, title, metadata')
      .eq('user_id', profile.id)
      .eq('type', 'place'),
    getNavData(profile.id, isOwner, supabase),
    // Fetch the relationship between current user and profile owner
    user && !isOwner
      ? supabase
          .from('friend_requests')
          .select('id, from_id, to_id, status')
          .or(`and(from_id.eq.${user.id},to_id.eq.${profile.id}),and(from_id.eq.${profile.id},to_id.eq.${user.id})`)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // Derive friend status for the FriendButton
  type FriendStatus = 'none' | 'request_sent' | 'request_received' | 'friends'
  let friendStatus: FriendStatus = 'none'
  let pendingRequestId: string | null = null

  if (friendRequest) {
    if (friendRequest.status === 'accepted') {
      friendStatus = 'friends'
    } else if (friendRequest.status === 'pending') {
      if (friendRequest.from_id === user?.id) {
        friendStatus = 'request_sent'
      } else {
        friendStatus = 'request_received'
        pendingRequestId = friendRequest.id
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-20 sm:pb-10">

      {/* Nav — desktop pill (mobile bottom bar rendered by same component) */}
      <div className="hidden sm:block mb-8">
        <ProfileNav
          username={profile.username}
          sections={navData.sections}
          collections={navData.collections}
          isOwner={isOwner}
          currentUsername={currentUserProfile?.username ?? null}
        />
      </div>
      <ProfileNav
        username={profile.username}
        sections={navData.sections}
        collections={navData.collections}
        isOwner={isOwner}
        currentUsername={currentUserProfile?.username ?? null}
      />

      <ProfilePageClient
        username={profile.username}
        fullName={profile.full_name}
        bio={profile.bio}
        avatarUrl={profile.avatar_url}
        isOwner={isOwner}
        widgets={(widgets ?? []).filter((w, i, arr) => arr.findIndex(x => x.id === w.id) === i) as unknown as Parameters<typeof ProfilePageClient>[0]['widgets']}
        collections={collections ?? []}
        items={items ?? []}
        places={(places ?? []) as { id: string; title: string | null; metadata: Record<string, unknown> }[]}
        friendStatus={friendStatus}
        profileUserId={profile.id}
        pendingRequestId={pendingRequestId}
        isLoggedIn={!!user}
      />
    </div>
  )
}
