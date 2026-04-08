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

  const [{ data: widgets }, { data: collections }, { data: items }, { data: places }, navData] = await Promise.all([
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
  ])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* Nav */}
      <div className="block mb-8">
        <ProfileNav
          username={profile.username}
          sections={navData.sections}
          collections={navData.collections}
          isOwner={isOwner}
        />
      </div>

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
      />
    </div>
  )
}
