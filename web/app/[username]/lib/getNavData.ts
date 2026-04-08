import { SupabaseClient } from '@supabase/supabase-js'
import { SECTIONS } from './sections'

export async function getNavData(
  profileId: string,
  isOwner: boolean,
  supabase: SupabaseClient
) {
  const [{ data: typeRows }, { data: collections }] = await Promise.all([
    supabase.from('items').select('type').eq('user_id', profileId),
    isOwner
      ? supabase
          .from('collections')
          .select('id, name, is_public')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false })
      : supabase
          .from('collections')
          .select('id, name, is_public')
          .eq('user_id', profileId)
          .eq('is_public', true)
          .order('created_at', { ascending: false }),
  ])

  const presentTypes = new Set((typeRows ?? []).map(r => r.type))
  const activeSections = SECTIONS.filter(s => presentTypes.has(s.type))

  return {
    sections: activeSections as { slug: string; label: string }[],
    collections: (collections ?? []) as { id: string; name: string; is_public: boolean }[],
  }
}
