'use client'

import { useState, useRef } from 'react'
import { savePlace } from '@/app/actions/items'

type GeoResult = {
  lat: number
  lng: number
  city: string
  country: string
  display_name: string
}

const PLACE_STATUSES = ['visited', 'want to go'] as const

export default function AddPlaceSheet({
  username,
  onSave,
  onClose,
}: {
  username: string
  onSave: (item: { id: string; title: string | null; image_url: string | null; type: string; status: string | null; metadata: Record<string, unknown>; collection_id: string | null; created_at: string }) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GeoResult[]>([])
  const [selected, setSelected] = useState<GeoResult | null>(null)
  const [status, setStatus] = useState<string>('visited')
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQueryChange(value: string) {
    setQuery(value)
    setSelected(null)
    setResults([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) return

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`)
        const data = await res.json()
        if (Array.isArray(data)) setResults(data)
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)

    const formData = new FormData()
    formData.set('city', selected.city)
    formData.set('country', selected.country)
    formData.set('lat', String(selected.lat))
    formData.set('lng', String(selected.lng))
    formData.set('status', status)
    formData.set('username', username)

    const res = await savePlace(formData)
    if (res?.error) {
      setSaving(false)
      return
    }

    onSave({
      id: res.itemId!,
      title: selected.city,
      image_url: null,
      type: 'place',
      status,
      metadata: { lat: selected.lat, lng: selected.lng, city: selected.city, country: selected.country },
      collection_id: null,
      created_at: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-semibold text-stone-900">Add a place</h2>
          <button onClick={onClose} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
        </div>

        {!selected ? (
          <>
            <input
              autoFocus
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search for a city…"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition mb-3"
            />

            {searching && (
              <p className="font-mono text-xs text-stone-400 text-center py-4">Searching…</p>
            )}

            {!searching && results.length === 0 && query.trim() && !searching && (
              <p className="font-mono text-xs text-stone-400 text-center py-4">No results found</p>
            )}

            {!searching && results.length > 0 && (
              <div className="flex flex-col gap-2">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(r)}
                    className="flex flex-col gap-0.5 rounded-xl border border-stone-100 p-3 text-left hover:border-stone-300 transition"
                  >
                    <p className="font-serif text-sm font-medium text-stone-900">{r.city}</p>
                    <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider">{r.country}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Selected place */}
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
              <div className="flex-1">
                <p className="font-serif text-base font-medium text-stone-900">{selected.city}</p>
                <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mt-0.5">{selected.country}</p>
              </div>
              <button
                onClick={() => { setSelected(null); setResults([]) }}
                className="font-mono text-xs text-stone-400 hover:text-stone-600"
              >
                Change
              </button>
            </div>

            {/* Status */}
            <div>
              <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mb-2">Status</p>
              <div className="flex gap-2">
                {PLACE_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-wider transition ${
                      status === s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-stone-900 py-3 font-mono text-xs text-white hover:bg-stone-700 disabled:opacity-40 transition"
            >
              {saving ? 'Saving…' : 'Add to library'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
