'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addItem({
  collectionId,
  type,
  title,
  image_url,
  external_id,
  status,
  metadata,
  username,
}: {
  collectionId?: string | null
  type: string
  title: string
  image_url: string | null
  external_id: string
  status?: string | null
  metadata: Record<string, unknown>
  username: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: item, error } = await supabase
    .from('items')
    .insert({
      collection_id: collectionId ?? null,
      user_id: user.id,
      type,
      title,
      image_url,
      external_id,
      status: status ?? null,
      metadata,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // If collection specified, also add to collection_items junction
  if (collectionId && item) {
    await supabase.from('collection_items').insert({
      collection_id: collectionId,
      item_id: item.id,
    })
  }

  revalidatePath(`/${username}`)
  return { success: true, itemId: item?.id }
}

export async function addItemToCollection(itemId: string, collectionId: string, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('collection_items')
    .insert({ collection_id: collectionId, item_id: itemId })

  if (error) return { error: error.message }

  revalidatePath(`/${username}`)
  return { success: true }
}

export async function deleteItem(itemId: string, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/${username}`)
  return { success: true }
}
