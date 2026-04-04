'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadItemImage } from '@/app/actions/items'

type Preview = {
  title: string
  brand: string
  description: string | null
  processedBlob: Blob
  previewUrl: string
  manualImage: File | null
  manualPreviewUrl: string | null
}

type SavedItem = {
  id: string
  title: string | null
  image_url: string | null
  type: string
  status: string | null
  metadata: Record<string, unknown>
  collection_id: string | null
  created_at: string
}

const ITEM_STATUSES = ['want', 'own', 'favorite'] as const

export default function AddItemSheet({
  username,
  onSave,
  onClose,
}: {
  username: string
  onSave: (item: SavedItem) => void
  onClose: () => void
}) {
  const [url, setUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [status, setStatus] = useState<string>('want')
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (preview?.previewUrl) URL.revokeObjectURL(preview.previewUrl)
      if (preview?.manualPreviewUrl) URL.revokeObjectURL(preview.manualPreviewUrl)
    }
  }, [preview])

  // Open the form with whatever we have (even if nothing fetched)
  function openEmptyPreview(urlValue: string) {
    setPreview({
      title: '',
      brand: '',
      description: null,
      processedBlob: new Blob(),
      previewUrl: '',
      manualImage: null,
      manualPreviewUrl: null,
    })
  }

  async function handleUrlChange(value: string) {
    setUrl(value)
    setPreview(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) return

    debounceRef.current = setTimeout(async () => {
      setFetching(true)
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(value)}`)
        const data = await res.json()

        if (data.error) {
          // Fetch failed — open form empty so user can fill in manually
          setFetching(false)
          openEmptyPreview(value)
          return
        }

        const imageUrl: string | null = data.image
        setFetching(false)

        if (imageUrl) {
          setProcessing(true)
          try {
            const imgRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`)
            const imgBlob = await imgRes.blob()
            const { removeBackground } = await import('@imgly/background-removal')
            const processedBlob = await removeBackground(imgBlob)
            const previewUrl = URL.createObjectURL(processedBlob)

            setPreview({
              title: data.title ?? '',
              brand: data.site_name ?? '',
              description: data.description ?? null,
              processedBlob,
              previewUrl,
              manualImage: null,
              manualPreviewUrl: null,
            })
          } catch {
            // BG removal failed — open form with text fields only
            setPreview({
              title: data.title ?? '',
              brand: data.site_name ?? '',
              description: data.description ?? null,
              processedBlob: new Blob(),
              previewUrl: '',
              manualImage: null,
              manualPreviewUrl: null,
            })
          } finally {
            setProcessing(false)
          }
        } else {
          setPreview({
            title: data.title ?? '',
            brand: data.site_name ?? '',
            description: data.description ?? null,
            processedBlob: new Blob(),
            previewUrl: '',
            manualImage: null,
            manualPreviewUrl: null,
          })
        }
      } catch {
        setFetching(false)
        openEmptyPreview(value)
      }
    }, 600)
  }

  function handleManualImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return

    // Revoke old manual preview URL
    if (preview?.manualPreviewUrl) URL.revokeObjectURL(preview.manualPreviewUrl)

    const manualPreviewUrl = URL.createObjectURL(file)

    // Run BG removal on manually uploaded image too
    setProcessing(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const { removeBackground } = await import('@imgly/background-removal')
        const processedBlob = await removeBackground(file)
        const previewUrl = URL.createObjectURL(processedBlob)
        setPreview(p => p ? {
          ...p,
          processedBlob,
          previewUrl,
          manualImage: file,
          manualPreviewUrl,
        } : p)
      } catch {
        setPreview(p => p ? { ...p, manualImage: file, manualPreviewUrl } : p)
      } finally {
        setProcessing(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleSave() {
    if (!preview) return
    setSaving(true)

    const formData = new FormData()
    formData.set('title', preview.title)
    formData.set('brand', preview.brand)
    formData.set('url', url)
    formData.set('description', preview.description ?? '')
    formData.set('status', status)
    formData.set('username', username)
    if (preview.processedBlob.size > 0) {
      formData.set('file', preview.processedBlob, 'item.png')
    }

    const res = await uploadItemImage(formData)
    if (res?.error) {
      setSaving(false)
      return
    }

    onSave({
      id: res.itemId!,
      title: preview.title || null,
      image_url: res.imageUrl ?? null,
      type: 'item',
      status,
      metadata: { brand: preview.brand || null, url, description: preview.description },
      collection_id: null,
      created_at: new Date().toISOString(),
    })
  }

  const displayImageUrl = preview?.previewUrl || preview?.manualPreviewUrl || null
  const isLoading = fetching || processing

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-[#e0ddd8] p-6 pb-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-semibold text-stone-900">Add an item</h2>
          <button onClick={onClose} className="font-mono text-xs text-stone-400 hover:text-stone-600">Close</button>
        </div>

        {/* URL input */}
        <input
          type="url"
          value={url}
          onChange={e => handleUrlChange(e.target.value)}
          autoFocus
          placeholder="Paste a product link…"
          className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-mono text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition mb-4"
        />

        {fetching && (
          <p className="font-mono text-xs text-stone-400 text-center py-4">Fetching page…</p>
        )}
        {processing && (
          <div className="text-center py-6">
            <p className="font-mono text-xs text-stone-400">Removing background…</p>
            <p className="font-mono text-[9px] text-stone-300 mt-1">This takes a few seconds</p>
          </div>
        )}

        {preview && !isLoading && (
          <div className="flex flex-col gap-4">
            {/* Image area */}
            <label className="relative cursor-pointer">
              <div className="w-full aspect-square rounded-xl bg-stone-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-stone-200 hover:border-stone-400 transition">
                {displayImageUrl ? (
                  <img
                    src={displayImageUrl}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain p-4"
                    style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))' }}
                  />
                ) : (
                  <div className="text-center">
                    <p className="font-mono text-xs text-stone-400">Click to upload image</p>
                    <p className="font-mono text-[9px] text-stone-300 mt-1">Background will be removed automatically</p>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleManualImage} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>

            <input
              value={preview.title}
              onChange={e => setPreview(p => p ? { ...p, title: e.target.value } : p)}
              placeholder="Title"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-serif text-base text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
            />
            <input
              value={preview.brand}
              onChange={e => setPreview(p => p ? { ...p, brand: e.target.value } : p)}
              placeholder="Brand (optional)"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 font-mono text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 transition"
            />

            <div>
              <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mb-2">Status</p>
              <div className="flex gap-2">
                {ITEM_STATUSES.map(s => (
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
              disabled={saving || !preview.title.trim()}
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
