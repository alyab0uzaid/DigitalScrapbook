import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileGrid from './components/ProfileGrid'
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
    .select('id, username, full_name, bio, avatar_url')
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
      .select('id, title, type, image_url, status')
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

      {/* Profile header */}
      <div className="mb-10">
        <div className="flex items-center gap-5 mb-3">
          <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center font-serif text-2xl font-medium text-stone-500 shrink-0">
            {profile.full_name?.[0] ?? profile.username[0].toUpperCase()}
          </div>
          <h1 className="font-serif text-6xl text-stone-900 leading-none">
            {profile.full_name ?? profile.username}
          </h1>
        </div>
        {profile.bio && (
          <p className="font-serif text-sm text-stone-500 mt-2 max-w-lg">{profile.bio}</p>
        )}
      </div>

      {/* Bento grid */}
      <ProfileGrid
        widgets={(widgets ?? []) as unknown as Parameters<typeof ProfileGrid>[0]['widgets']}
        username={profile.username}
        isOwner={isOwner}
        collections={collections ?? []}
        items={items ?? []}
        places={(places ?? []) as { id: string; title: string | null; metadata: Record<string, unknown> }[]}
      />
    </div>
  )
}
