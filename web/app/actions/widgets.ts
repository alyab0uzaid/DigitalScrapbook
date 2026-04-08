'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addWidget({
  itemId,
  collectionId,
  itemType,
  widgetSize,
  username,
}: {
  itemId?: string | null
  collectionId?: string | null
  itemType?: string | null
  widgetSize: '1x1' | '1x2' | '2x1' | '2x2'
  username: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('profile_widgets')
    .select('display_order')
    .eq('user_id', user.id)
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = existing ? (existing.display_order ?? 0) + 1 : 0

  const { error } = await supabase.from('profile_widgets').insert({
    user_id: user.id,
    item_id: itemId ?? null,
    collection_id: collectionId ?? null,
    item_type: itemType ?? null,
    widget_size: widgetSize,
    display_order: nextOrder,
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

export async function reorderWidgets(orderedIds: string[], username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('profile_widgets')
        .update({ display_order: index })
        .eq('id', id)
        .eq('user_id', user.id)
    )
  )

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
