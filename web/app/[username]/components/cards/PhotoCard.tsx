import Image from 'next/image'

type Item = {
  id: string
  title: string | null
  image_url: string | null
  status: string | null
  metadata: Record<string, unknown>
}

export function PhotoCard({ item }: { item: Item }) {
  return (
    <div className="absolute inset-0 bg-stone-50 transition group-hover:bg-stone-100">
      <div className="relative flex h-full w-full flex-col justify-between">
        {/* Image — slides down on hover revealing content behind */}
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title ?? ''}
            className="absolute inset-0 h-full w-full object-cover rounded-[14px] transition-all group-hover:mt-12"
          />
        )}

        {/* Top label */}
        <div className="pl-4 pr-2 pt-3">
          <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Photo</span>
        </div>

        {/* Bottom title pill */}
        <div className="z-10 p-2">
          <span className="inline-block rounded-lg px-2 py-1 font-serif text-sm text-white/70 transition-colors group-hover:bg-black/60">
            {item.title}
          </span>
        </div>
      </div>
    </div>
  )
}
