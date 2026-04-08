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

  const [{ data: items }, { data: collections }, navData] = await Promise.all([
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
  ])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <LibraryView
          items={items ?? []}
          collections={collections ?? []}
          username={profile.username}
          navSections={navData.sections}
          navCollections={navData.collections}
        />
      </div>
    </div>
  )
}
