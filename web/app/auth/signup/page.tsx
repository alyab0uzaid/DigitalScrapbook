'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUp, null)

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-semibold text-stone-900 tracking-tight">Cubbi</h1>
          <p className="mt-2 text-stone-500 text-sm">Create your scrapbook</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
          {/* OAuth buttons go here */}
          <div className="flex flex-col gap-2 mb-5 opacity-40 pointer-events-none select-none">
            <button type="button" className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">
              <span>G</span> Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-xs text-stone-400">or</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-stone-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition"
                placeholder="Min. 8 characters"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 transition"
            >
              {pending ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-stone-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
