import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProfileGrid from './components/ProfileGrid'

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

  const [{ data: widgets }, { data: collections }, { data: items }, { data: places }] = await Promise.all([
    supabase
      .from('profile_widgets')
      .select(`
        id, widget_size, widget_title, display_order,
        item:items(id, title, image_url, type, status, metadata, created_at),
        collection:collections(id, name, type, description)
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
    isOwner
      ? supabase
          .from('items')
          .select('id, title, type, image_url, status')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as { id: string; title: string | null; type: string; image_url: string | null; status: string | null }[] }),
    supabase
      .from('items')
      .select('id, title, metadata')
      .eq('user_id', profile.id)
      .eq('type', 'place'),
  ])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Profile header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center font-serif text-lg font-medium text-stone-500 shrink-0">
              {profile.full_name?.[0] ?? profile.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-stone-900">
                {profile.full_name ?? profile.username}
              </h1>
              <p className="font-mono text-xs text-stone-400 mt-0.5">@{profile.username}</p>
              {profile.bio && (
                <p className="font-serif mt-1.5 text-sm text-stone-600">{profile.bio}</p>
              )}
            </div>
          </div>

          {isOwner && (
            <Link
              href="/library"
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 font-mono text-xs text-stone-600 hover:bg-stone-50 shadow-sm transition"
            >
              Library
            </Link>
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
    </div>
  )
}
