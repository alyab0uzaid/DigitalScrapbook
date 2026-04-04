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

export async function uploadItemImage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  const title = (formData.get('title') as string) || ''
  const brand = (formData.get('brand') as string) || null
  const url = (formData.get('url') as string) || ''
  const description = (formData.get('description') as string) || null
  const status = (formData.get('status') as string) || null
  const username = formData.get('username') as string

  let imageUrl: string | null = null

  if (file && file.size > 0) {
    const path = `${user.id}/${Date.now()}.png`
    const { error: uploadError } = await supabase.storage
      .from('items')
      .upload(path, file, { contentType: 'image/png', upsert: false })

    if (uploadError) return { error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage.from('items').getPublicUrl(path)
    imageUrl = publicUrl
  }

  const { data: item, error: insertError } = await supabase
    .from('items')
    .insert({
      user_id: user.id,
      type: 'item',
      title: title || null,
      image_url: imageUrl,
      external_id: url,
      status: status || null,
      metadata: { brand: brand || null, url, description: description || null },
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  revalidatePath(`/${username}`)
  return { success: true, itemId: item?.id, imageUrl }
}

export async function savePlace(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const city = formData.get('city') as string
  const country = formData.get('country') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const status = formData.get('status') as string
  const username = formData.get('username') as string

  // Insert the place item
  const { data: item, error: itemError } = await supabase
    .from('items')
    .insert({
      user_id: user.id,
      type: 'place',
      title: city,
      status,
      metadata: { lat, lng, city, country },
    })
    .select('id')
    .single()

  if (itemError) return { error: itemError.message }

  // Find or create the user's single "My Places" collection
  let collectionId: string

  const { data: existingCol } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'map')
    .limit(1)
    .single()

  if (existingCol) {
    collectionId = existingCol.id
  } else {
    const { data: newCol, error: colError } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: 'My Places', type: 'map' })
      .select('id')
      .single()

    if (colError) return { error: colError.message }
    collectionId = newCol.id
  }

  // Link place to collection
  await supabase.from('collection_items').insert({
    collection_id: collectionId,
    item_id: item.id,
  })

  revalidatePath(`/${username}`)
  return { success: true, itemId: item.id, collectionId }
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
