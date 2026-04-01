import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-6">✉️</div>
        <h1 className="text-xl font-semibold text-stone-900 mb-2">Check your email</h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          We sent you a confirmation link. Click it to finish creating your account.
        </p>
        <p className="mt-6 text-sm text-stone-400">
          Wrong email?{' '}
          <Link href="/auth/signup" className="text-stone-600 hover:underline">
            Start over
          </Link>
        </p>
      </div>
    </div>
  )
}
