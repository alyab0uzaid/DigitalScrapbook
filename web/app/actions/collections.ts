'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCollection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { data: collection, error } = await supabase
    .from('collections')
    .insert({ user_id: user.id, name, type: 'collection', description: description || null })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  revalidatePath(`/${profile?.username}`)
  return { success: true, collectionId: collection.id, username: profile?.username }
}

export async function updateCollection(collectionId: string, formData: FormData, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { error } = await supabase
    .from('collections')
    .update({ name, description: description || null })
    .eq('id', collectionId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/${username}`)
  return { success: true }
}

export async function toggleCollectionPublic(collectionId: string, isPublic: boolean, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('collections')
    .update({ is_public: isPublic })
    .eq('id', collectionId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/${username}`)
  return { success: true }
}

export async function deleteCollection(collectionId: string, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/${username}`)
  return { success: true }
}
