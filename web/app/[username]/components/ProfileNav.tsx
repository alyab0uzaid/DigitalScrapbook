'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useLayoutEffect, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { logout } from '@/app/actions/auth'

const MAX_VISIBLE = 5
// On mobile pill: home + up to 3 content tabs + library (owner) then more
const MAX_MOBILE_VISIBLE = 3

type NavTab = { href: string; label: string }

export default function ProfileNav({
  username,
  sections,
  collections,
  isOwner,
  currentUsername,
}: {
  username: string
  sections: { slug: string; label: string }[]
  collections: { id: string; name: string; is_public: boolean }[]
  isOwner: boolean
  currentUsername?: string | null
}) {
  const pathname = usePathname()
  const base = `/${username}`

  const contentTabs: NavTab[] = [
    { href: base, label: username },
    ...sections.map(s => ({ href: `${base}/${s.slug}`, label: s.label.toLowerCase() })),
    ...collections.map(c => ({ href: `${base}/c/${c.id}`, label: c.name.toLowerCase() })),
  ]

  const mainTabs = contentTabs.slice(0, MAX_VISIBLE)
  const overflowTabs = contentTabs.slice(MAX_VISIBLE)

  // Mobile: show home + first N content tabs in pill, rest in sheet
  const mobilePillTabs = contentTabs.slice(0, MAX_MOBILE_VISIBLE + 1)
  const mobileSheetTabs = contentTabs.slice(MAX_MOBILE_VISIBLE + 1)
  const mobileHasMore = mobileSheetTabs.length > 0 || (!isOwner && !!currentUsername)

  // ── Sliding indicator (shared for desktop + mobile pill) ─────────────────
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const mobileTabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [indicator, setIndicator] = useState({ width: 0, left: 0, opacity: 0 })
  const [mobileIndicator, setMobileIndicator] = useState({ width: 0, left: 0, opacity: 0 })
  const [showDesktopMore, setShowDesktopMore] = useState(false)
  const [showMobileMore, setShowMobileMore] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [mobileHoveredIdx, setMobileHoveredIdx] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const activeIdx = mainTabs.findIndex(t => t.href === pathname)
  const mobileActiveIdx = mobilePillTabs.findIndex(t => t.href === pathname)

  useLayoutEffect(() => {
    const i = hoveredIdx ?? activeIdx
    if (i >= 0 && tabRefs.current[i]) {
      const el = tabRefs.current[i]!
      setIndicator({ width: el.offsetWidth, left: el.offsetLeft, opacity: 1 })
    } else {
      setIndicator(prev => ({ ...prev, opacity: 0 }))
    }
  }, [pathname, mainTabs.length, hoveredIdx, activeIdx])

  useLayoutEffect(() => {
    const i = mobileHoveredIdx ?? mobileActiveIdx
    if (i >= 0 && mobileTabRefs.current[i]) {
      const el = mobileTabRefs.current[i]!
      setMobileIndicator({ width: el.offsetWidth, left: el.offsetLeft, opacity: 1 })
    } else {
      setMobileIndicator(prev => ({ ...prev, opacity: 0 }))
    }
  }, [pathname, mobilePillTabs.length, mobileHoveredIdx, mobileActiveIdx])

  const pillClass = "relative inline-flex items-center rounded-lg border border-neutral-200 bg-white/90 p-1 shadow-md backdrop-blur-md"

  return (
    <>
      {/* ── Desktop pill (sm+) ──────────────────────────────────────────── */}
      <div
        className={`hidden sm:inline-flex pointer-events-auto z-50 ${pillClass}`}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <div
          className="absolute top-1 left-0 -z-10 h-7 rounded bg-neutral-100"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
            opacity: indicator.opacity,
            transition: 'width 150ms, transform 150ms, opacity 150ms',
          }}
        />

        {mainTabs.map((tab, i) => (
          <Link
            key={tab.href}
            href={tab.href}
            ref={el => { tabRefs.current[i] = el }}
            onMouseEnter={() => setHoveredIdx(i)}
            className={`rounded py-1 px-2 text-sm tracking-tight transition-colors whitespace-nowrap ${
              pathname === tab.href ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </Link>
        ))}

        {overflowTabs.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowDesktopMore(v => !v)}
              className="rounded py-1 px-2 text-sm tracking-tight text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              more ▾
            </button>
            {showDesktopMore && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDesktopMore(false)} />
                <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg border border-neutral-200 bg-white shadow-md p-1">
                  {overflowTabs.map(tab => (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      onClick={() => setShowDesktopMore(false)}
                      className={`block rounded px-3 py-1.5 text-sm tracking-tight transition-colors ${
                        pathname === tab.href ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-400 hover:text-neutral-900'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!isOwner && currentUsername && (
          <>
            <span className="w-px h-4 bg-neutral-200 mx-0.5" />
            <Link href={`/${currentUsername}`} className="rounded py-1 px-2 text-sm tracking-tight text-neutral-300 hover:text-neutral-600 transition-colors whitespace-nowrap">
              my profile
            </Link>
          </>
        )}

        {isOwner && (
          <>
            <span className="w-px h-4 bg-neutral-200 mx-0.5" />
            <Link href="/library" className="rounded py-1 px-2 text-sm tracking-tight text-neutral-300 hover:text-neutral-600 transition-colors whitespace-nowrap">
              library
            </Link>
            <span className="w-px h-4 bg-neutral-200 mx-0.5" />
            <form action={logout}>
              <button type="submit" className="rounded py-1 px-2 text-sm tracking-tight text-neutral-300 hover:text-neutral-600 transition-colors whitespace-nowrap">
                logout
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Mobile floating pill (below sm) — portaled to body so wrapper visibility doesn't affect it ── */}
      {mounted && createPortal(<div className="sm:hidden">
        {/* Gradient fade behind pill */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/70 to-transparent pointer-events-none z-40" />

        {/* Pill — full width, floating above gradient */}
        <div className="fixed bottom-5 left-0 right-0 z-50 px-4">
          <div
            className="relative flex items-center rounded-lg border border-neutral-200 bg-white/90 p-1 shadow-md backdrop-blur-md pointer-events-auto w-full"
            onMouseLeave={() => setMobileHoveredIdx(null)}
          >
            {/* Sliding indicator */}
            <div
              className="absolute top-1 left-0 -z-10 h-7 rounded bg-neutral-100"
              style={{
                width: mobileIndicator.width,
                transform: `translateX(${mobileIndicator.left}px)`,
                opacity: mobileIndicator.opacity,
                transition: 'width 150ms, transform 150ms, opacity 150ms',
              }}
            />

            {mobilePillTabs.map((tab, i) => (
              <Link
                key={tab.href}
                href={tab.href}
                ref={el => { mobileTabRefs.current[i] = el }}
                onMouseEnter={() => setMobileHoveredIdx(i)}
                className={`rounded py-1 px-2 text-sm tracking-tight transition-colors whitespace-nowrap ${
                  pathname === tab.href ? 'text-neutral-900' : 'text-neutral-400'
                }`}
              >
                {tab.label}
              </Link>
            ))}

            {/* Spacer pushes library/more to the right */}
            <span className="flex-1" />

            {/* Library for owners */}
            {isOwner && (
              <>
                <span className="w-px h-4 bg-neutral-200 mx-0.5" />
                <Link
                  href="/library"
                  className={`rounded py-1 px-2 text-sm tracking-tight transition-colors whitespace-nowrap ${
                    pathname === '/library' ? 'text-neutral-900' : 'text-neutral-300'
                  }`}
                >
                  library
                </Link>
              </>
            )}

            {/* More */}
            {mobileHasMore && (
              <>
                {isOwner && <span className="w-px h-4 bg-neutral-200 mx-0.5" />}
                <button
                  onClick={() => setShowMobileMore(true)}
                  className="rounded py-1 px-2 text-sm tracking-tight text-neutral-300 transition-colors"
                >
                  ···
                </button>
              </>
            )}
          </div>
        </div>

        {/* More sheet */}
        {showMobileMore && (
          <>
            <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowMobileMore(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-1 rounded-full bg-neutral-200" />
              </div>
              <div className="px-4 py-3 flex flex-col gap-1">
                {mobileSheetTabs.map(tab => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setShowMobileMore(false)}
                    className={`flex items-center rounded-xl px-3 py-3 transition-colors ${
                      pathname === tab.href ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600'
                    }`}
                  >
                    <span className="font-mono text-sm tracking-tight">{tab.label}</span>
                  </Link>
                ))}
                {!isOwner && currentUsername && (
                  <Link
                    href={`/${currentUsername}`}
                    onClick={() => setShowMobileMore(false)}
                    className="flex items-center rounded-xl px-3 py-3 text-neutral-600"
                  >
                    <span className="font-mono text-sm tracking-tight">my profile</span>
                  </Link>
                )}
                {isOwner && (
                  <>
                    <div className="h-px bg-neutral-100 my-1" />
                    <form action={logout}>
                      <button
                        type="submit"
                        className="w-full flex items-center rounded-xl px-3 py-3 text-neutral-400 text-left"
                        onClick={() => setShowMobileMore(false)}
                      >
                        <span className="font-mono text-sm tracking-tight">logout</span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>, document.body)}
    </>
  )
}
