'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const full_name = formData.get('full_name') as string | null
  const bio = formData.get('bio') as string | null
  const avatarFile = formData.get('avatar') as File | null

  let avatar_url: string | undefined

  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true })

    if (uploadError) return { error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    avatar_url = publicUrl
  }

  const updates: Record<string, string | null> = {}
  if (full_name !== null) updates.full_name = full_name || null
  if (bio !== null) updates.bio = bio || null
  if (avatar_url) updates.avatar_url = avatar_url

  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/${profile?.username}`)
  return { success: true }
}
