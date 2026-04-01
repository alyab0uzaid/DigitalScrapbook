'use client'

import { useState, useTransition } from 'react'
import { createCollection } from '@/app/actions/collections'

const COLLECTION_TYPES = [
  { value: 'favorites', label: 'Favorites', description: 'A ranked list' },
  { value: 'collection', label: 'Collection', description: 'An unranked grid' },
  { value: 'log', label: 'Log', description: 'A running history' },
  { value: 'blog', label: 'Blog', description: 'Writing & notes' },
]

export default function CreateCollectionModal() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createCollection(formData)
      if (result?.error) setError(result.error)
      else setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 font-mono text-xs text-stone-600 hover:bg-stone-50 shadow-sm transition"
      >
        + New collection
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#e0ddd8] p-7">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 mb-6">New collection</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-stone-500 uppercase tracking-wider">Name</label>
                <input
                  name="name"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition"
                  placeholder="Books that changed me"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-stone-500 uppercase tracking-wider">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {COLLECTION_TYPES.map((type, i) => (
                    <label key={type.value} className="cursor-pointer">
                      <input type="radio" name="type" value={type.value} defaultChecked={i === 0} className="sr-only peer" />
                      <div className="rounded-xl border border-stone-200 p-3 peer-checked:border-stone-900 peer-checked:bg-stone-50 transition">
                        <div className="font-serif text-sm font-medium text-stone-800">{type.label}</div>
                        <div className="font-mono text-[10px] text-stone-400 mt-0.5">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-stone-500 uppercase tracking-wider">
                  Description <span className="normal-case text-stone-300">(optional)</span>
                </label>
                <input
                  name="description"
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition"
                  placeholder="A short description"
                />
              </div>

              {error && <p className="font-mono text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 font-mono text-xs text-stone-500 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-stone-900 px-4 py-2.5 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-50 transition"
                >
                  {isPending ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
