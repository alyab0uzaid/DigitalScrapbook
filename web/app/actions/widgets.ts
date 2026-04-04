'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addWidget({
  itemId,
  collectionId,
  widgetSize,
  username,
}: {
  itemId?: string | null
  collectionId?: string | null
  widgetSize: '1x1' | '1x2' | '2x1' | '2x2'
  username: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('profile_widgets').insert({
    user_id: user.id,
    item_id: itemId ?? null,
    collection_id: collectionId ?? null,
    widget_size: widgetSize,
  })

  if (error) return { error: error.message }

  revalidatePath(`/${username}`)
  return { success: true }
}

export async function removeWidget(widgetId: string, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profile_widgets')
    .delete()
    .eq('id', widgetId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/${username}`)
  return { success: true }
}

export async function updateWidgetSize(widgetId: string, widgetSize: '1x1' | '1x2' | '2x1', username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profile_widgets')
    .update({ widget_size: widgetSize })
    .eq('id', widgetId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/${username}`)
  return { success: true }
}
