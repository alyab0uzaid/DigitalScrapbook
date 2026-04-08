'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendFriendRequest(toUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (user.id === toUserId) return { error: 'Cannot add yourself' }

  // Check for existing request in either direction
  const { data: existing } = await supabase
    .from('friend_requests')
    .select('id, status')
    .or(`and(from_id.eq.${user.id},to_id.eq.${toUserId}),and(from_id.eq.${toUserId},to_id.eq.${user.id})`)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'accepted') return { error: 'Already friends' }
    if (existing.status === 'pending') return { error: 'Request already pending' }
    // Declined — allow re-requesting by deleting and re-inserting
    await supabase.from('friend_requests').delete().eq('id', existing.id)
  }

  const { error } = await supabase
    .from('friend_requests')
    .insert({ from_id: user.id, to_id: toUserId, status: 'pending' })

  if (error) return { error: error.message }

  // Notify recipient
  await supabase.from('notifications').insert({
    user_id: toUserId,
    type: 'friend_request',
    actor_id: user.id,
    data: {},
  })

  revalidatePath('/')
  return { success: true }
}

export async function acceptFriendRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch request, ensure we're the recipient
  const { data: request } = await supabase
    .from('friend_requests')
    .select('id, from_id, to_id')
    .eq('id', requestId)
    .eq('to_id', user.id)
    .eq('status', 'pending')
    .single()

  if (!request) return { error: 'Request not found' }

  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)

  if (error) return { error: error.message }

  // Notify the sender that their request was accepted
  await supabase.from('notifications').insert({
    user_id: request.from_id,
    type: 'friend_accepted',
    actor_id: user.id,
    data: {},
  })

  // Fetch both users for person items
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, username, avatar_url')
    .in('id', [request.from_id, request.to_id])

  const fromUser = users?.find(u => u.id === request.from_id)
  const toUser = users?.find(u => u.id === request.to_id)

  // Create person items in both libraries (ignore errors — they might already exist)
  if (fromUser && toUser) {
    await supabase.from('items').insert([
      {
        user_id: request.from_id,
        type: 'person',
        title: toUser.full_name ?? toUser.username,
        image_url: toUser.avatar_url,
        metadata: { cubbi_user_id: toUser.id, username: toUser.username },
        status: 'friend',
      },
      {
        user_id: request.to_id,
        type: 'person',
        title: fromUser.full_name ?? fromUser.username,
        image_url: fromUser.avatar_url,
        metadata: { cubbi_user_id: fromUser.id, username: fromUser.username },
        status: 'friend',
      },
    ])
  }

  revalidatePath('/library')
  return { success: true }
}

export async function declineFriendRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId)
    .eq('to_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/library')
  return { success: true }
}

export async function cancelFriendRequest(toUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('friend_requests')
    .delete()
    .eq('from_id', user.id)
    .eq('to_id', toUserId)
    .eq('status', 'pending')

  revalidatePath('/')
  return { success: true }
}

export async function removeFriend(friendUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Delete the accepted request in either direction
  await supabase
    .from('friend_requests')
    .delete()
    .or(`and(from_id.eq.${user.id},to_id.eq.${friendUserId}),and(from_id.eq.${friendUserId},to_id.eq.${user.id})`)
    .eq('status', 'accepted')

  // Also remove the person items from both libraries
  await supabase
    .from('items')
    .delete()
    .eq('user_id', user.id)
    .eq('type', 'person')
    .contains('metadata', { cubbi_user_id: friendUserId })

  revalidatePath('/library')
  return { success: true }
}

export async function markNotificationsRead(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', user.id)

  return { success: true }
}
