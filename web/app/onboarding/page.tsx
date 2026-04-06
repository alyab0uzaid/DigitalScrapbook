'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setPending(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const { error: insertError } = await supabase.from('users').upsert({
      id: user.id,
      username: username.toLowerCase().trim(),
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('That username is taken. Try another.')
      } else {
        setError(insertError.message)
      }
      setPending(false)
      return
    }

    router.push(`/${username.toLowerCase().trim()}`)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Pick a username</h1>
          <p className="mt-2 text-stone-500 text-sm">This is your public address. Choose wisely.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-medium text-stone-700">
                Username
              </label>
              <div className="flex items-center rounded-lg border border-stone-200 focus-within:ring-2 focus-within:ring-stone-900 focus-within:border-transparent transition overflow-hidden">
                <span className="pl-3.5 text-sm text-stone-400 select-none">cubbi.me/</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, ''))}
                  className="flex-1 py-2.5 pr-3.5 text-sm text-stone-900 focus:outline-none bg-transparent"
                  placeholder="yourname"
                  minLength={3}
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-stone-400">Letters, numbers, and underscores only.</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={pending || username.length < 3}
              className="mt-1 w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 transition"
            >
              {pending ? 'Saving…' : 'Claim username'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
