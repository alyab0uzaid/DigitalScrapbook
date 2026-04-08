import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    if (profile?.username) {
      redirect(`/${profile.username}`)
    } else {
      redirect('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-serif font-semibold text-stone-900 tracking-tight mb-3">Cubbi</h1>
        <p className="text-stone-500 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
          Your personal scrapbook. Reads, flicks, photos, music, places — everything that makes you, you.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/auth/signup"
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 transition"
          >
            Get started
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
