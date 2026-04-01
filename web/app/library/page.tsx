import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LibraryView from './components/LibraryView'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile?.username) redirect('/onboarding')

  const [{ data: items }, { data: collections }] = await Promise.all([
    supabase
      .from('items')
      .select('id, title, image_url, type, status, metadata, collection_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('collections')
      .select('id, name, type, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <LibraryView
          items={items ?? []}
          collections={collections ?? []}
          username={profile.username}
        />
      </div>
    </div>
  )
}
