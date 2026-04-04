'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadPhoto(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  const title = formData.get('title') as string
  const username = formData.get('username') as string

  if (!file || !title) return { error: 'Missing file or title' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('photos')
    .getPublicUrl(path)

  const { data: item, error: insertError } = await supabase
    .from('items')
    .insert({
      user_id: user.id,
      type: 'photo',
      title,
      image_url: publicUrl,
      external_id: path,
      metadata: {},
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  revalidatePath(`/${username}`)
  return { success: true, itemId: item?.id }
}
