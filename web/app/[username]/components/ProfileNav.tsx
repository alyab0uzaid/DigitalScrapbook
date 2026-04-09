'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useLayoutEffect, useState } from 'react'
import { logout } from '@/app/actions/auth'

const MAX_VISIBLE_DESKTOP = 5
const MAX_VISIBLE_MOBILE = 3  // home + 3 tabs + more button

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

  // ── Desktop ───────────────────────────────────────────────────────────────
  const desktopMainTabs = contentTabs.slice(0, MAX_VISIBLE_DESKTOP)
  const desktopOverflowTabs = contentTabs.slice(MAX_VISIBLE_DESKTOP)

  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [indicator, setIndicator] = useState({ width: 0, left: 0, opacity: 0 })
  const [showDesktopMore, setShowDesktopMore] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const activeDesktopIdx = desktopMainTabs.findIndex(t => t.href === pathname)

  useLayoutEffect(() => {
    const targetIdx = hoveredIdx ?? activeDesktopIdx
    if (targetIdx >= 0 && tabRefs.current[targetIdx]) {
      const el = tabRefs.current[targetIdx]!
      setIndicator({ width: el.offsetWidth, left: el.offsetLeft, opacity: 1 })
    } else {
      setIndicator(prev => ({ ...prev, opacity: 0 }))
    }
  }, [pathname, desktopMainTabs.length, hoveredIdx, activeDesktopIdx])

  // ── Mobile ────────────────────────────────────────────────────────────────
  // home tab + up to MAX_VISIBLE_MOBILE content tabs in bottom bar, rest in sheet
  const mobileMainTabs = contentTabs.slice(0, MAX_VISIBLE_MOBILE + 1) // +1 for home
  const mobileOverflowTabs = contentTabs.slice(MAX_VISIBLE_MOBILE + 1)
  const [showMobileMore, setShowMobileMore] = useState(false)

  const hasOverflow = mobileOverflowTabs.length > 0
    || (isOwner)
    || (!isOwner && !!currentUsername)

  return (
    <>
      {/* ── Desktop pill nav (hidden on mobile) ─────────────────────────── */}
      <div
        className="hidden sm:inline-flex pointer-events-auto relative z-50 items-center rounded-lg border border-neutral-200 bg-white/70 p-1 shadow-md backdrop-blur-md"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Sliding indicator */}
        <div
          className="absolute top-1 left-0 -z-10 h-7 rounded bg-neutral-200 backdrop-blur"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
            opacity: indicator.opacity,
            transition: 'width 150ms, transform 150ms, opacity 150ms',
          }}
        />

        {desktopMainTabs.map((tab, i) => (
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

        {desktopOverflowTabs.length > 0 && (
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
                  {desktopOverflowTabs.map(tab => (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      onClick={() => setShowDesktopMore(false)}
                      className={`block rounded px-3 py-1.5 text-sm tracking-tight transition-colors ${
                        pathname === tab.href
                          ? 'text-neutral-900 bg-neutral-100'
                          : 'text-neutral-400 hover:text-neutral-900'
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

        {/* My profile — visitor */}
        {!isOwner && currentUsername && (
          <>
            <span className="w-px h-4 bg-neutral-200 mx-0.5" />
            <Link
              href={`/${currentUsername}`}
              className="rounded py-1 px-2 text-sm tracking-tight text-neutral-300 hover:text-neutral-600 transition-colors whitespace-nowrap"
            >
              my profile
            </Link>
          </>
        )}

        {/* Library + logout — owner */}
        {isOwner && (
          <>
            <span className="w-px h-4 bg-neutral-200 mx-0.5" />
            <Link
              href="/library"
              className="rounded py-1 px-2 text-sm tracking-tight text-neutral-300 hover:text-neutral-600 transition-colors whitespace-nowrap"
            >
              library
            </Link>
            <span className="w-px h-4 bg-neutral-200 mx-0.5" />
            <form action={logout}>
              <button
                type="submit"
                className="rounded py-1 px-2 text-sm tracking-tight text-neutral-300 hover:text-neutral-600 transition-colors whitespace-nowrap"
              >
                logout
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Mobile bottom tab bar (hidden on desktop) ───────────────────── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-neutral-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-14">
          {/* Main tabs */}
          {mobileMainTabs.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                pathname === tab.href ? 'text-neutral-900' : 'text-neutral-400'
              }`}
            >
              <span className="font-mono text-[10px] tracking-tight truncate max-w-[60px] text-center leading-tight">
                {tab.label}
              </span>
              {pathname === tab.href && (
                <span className="w-1 h-1 rounded-full bg-neutral-900" />
              )}
            </Link>
          ))}

          {/* Owner: library shortcut */}
          {isOwner && (
            <Link
              href="/library"
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                pathname === '/library' ? 'text-neutral-900' : 'text-neutral-400'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.25"/>
                <rect x="7" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.25"/>
                <rect x="12" y="5" width="2" height="9" rx="1" stroke="currentColor" strokeWidth="1.25"/>
              </svg>
              {pathname === '/library' && (
                <span className="w-1 h-1 rounded-full bg-neutral-900" />
              )}
            </Link>
          )}

          {/* More button */}
          {hasOverflow && (
            <button
              onClick={() => setShowMobileMore(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-neutral-400"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="3" cy="8" r="1.25" fill="currentColor"/>
                <circle cx="8" cy="8" r="1.25" fill="currentColor"/>
                <circle cx="13" cy="8" r="1.25" fill="currentColor"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile more sheet ────────────────────────────────────────────── */}
      {showMobileMore && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-50 bg-black/20"
            onClick={() => setShowMobileMore(false)}
          />
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-neutral-200" />
            </div>

            <div className="px-4 py-3 flex flex-col gap-1">
              {/* Overflow content tabs */}
              {mobileOverflowTabs.map(tab => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setShowMobileMore(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                    pathname === tab.href ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  <span className="font-mono text-sm tracking-tight">{tab.label}</span>
                </Link>
              ))}

              {/* Visitor: my profile */}
              {!isOwner && currentUsername && (
                <Link
                  href={`/${currentUsername}`}
                  onClick={() => setShowMobileMore(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-neutral-600"
                >
                  <span className="font-mono text-sm tracking-tight">my profile</span>
                </Link>
              )}

              {/* Owner: logout */}
              {isOwner && (
                <>
                  <div className="h-px bg-neutral-100 my-1" />
                  <form action={logout}>
                    <button
                      type="submit"
                      onClick={() => setShowMobileMore(false)}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-neutral-400 text-left"
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
    </>
  )
}
