'use client'

import { useState, useEffect, useMemo } from 'react'
import { feature } from 'topojson-client'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { GeoPermissibleObjects } from 'd3-geo'

type Place = {
  id: string
  title: string | null
  metadata: Record<string, unknown>
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Card is col-span-2 row-span-1 at 235px row height. Approximate pixel area:
// 2x1: ~480 × 235 — map fills the full card, no header
// 2x2: ~480 × 470

const CONFIG = {
  '2x1': { W: 900, H: 460, scale: 140 },
  '2x2': { W: 900, H: 900, scale: 165 },
}

export function MapCard({ places, size }: { places: Place[]; size: '2x1' | '2x2' }) {
  const [countryPaths, setCountryPaths] = useState<string[]>([])
  const [tooltip, setTooltip] = useState<{ city: string; country: string; x: number; y: number } | null>(null)
  const cfg = CONFIG[size]

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then((topo: Topology) => {
        const countries = feature(topo, topo.objects.countries as GeometryCollection)
        const projection = geoNaturalEarth1()
          .scale(cfg.scale)
          .translate([cfg.W / 2, cfg.H / 2])
        const gen = geoPath(projection)
        const paths = countries.features.map(f => gen(f as GeoPermissibleObjects) ?? '')
        setCountryPaths(paths)
      })
      .catch(() => {})
  }, [cfg.W, cfg.H, cfg.scale])

  const pins = useMemo(() => places
    .map(p => ({
      id: p.id,
      city: (p.metadata?.city as string) ?? p.title ?? '',
      country: (p.metadata?.country as string) ?? '',
      lat: p.metadata?.lat as number,
      lng: p.metadata?.lng as number,
    }))
    .filter(p => p.lat != null && p.lng != null),
  [places])

  const pinCoords = useMemo(() => {
    if (!countryPaths.length) return []
    const projection = geoNaturalEarth1()
      .scale(cfg.scale)
      .translate([cfg.W / 2, cfg.H / 2])
    return pins.map(pin => {
      const coords = projection([pin.lng, pin.lat])
      return { ...pin, x: coords?.[0] ?? 0, y: coords?.[1] ?? 0 }
    })
  }, [pins, countryPaths, cfg.scale, cfg.W, cfg.H])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg">
      {/* Map — full bleed */}
      <div className="absolute inset-0 bg-stone-50">
        {countryPaths.length > 0 ? (
          <svg
            viewBox={`0 0 ${cfg.W} ${cfg.H}`}
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
          >
            {/* Country fills */}
            {countryPaths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="#d6d3d1"
                stroke="#fafaf9"
                strokeWidth={0.8}
              />
            ))}

            {/* Pins */}
            {pinCoords.map(pin => (
              <g
                key={pin.id}
                onMouseEnter={() => setTooltip({ city: pin.city, country: pin.country, x: pin.x, y: pin.y })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'default' }}
              >
                {/* Outer glow ring */}
                <circle cx={pin.x} cy={pin.y} r={7} fill="#1c1917" opacity={0.12} />
                {/* Pin dot */}
                <circle cx={pin.x} cy={pin.y} r={4} fill="#1c1917" stroke="#fafaf9" strokeWidth={1.5} />
              </g>
            ))}

            {/* Tooltip rendered inside SVG for correct coordinate space */}
            {tooltip && (() => {
              const tx = Math.min(Math.max(tooltip.x, 80), cfg.W - 80)
              const ty = tooltip.y > cfg.H / 2 ? tooltip.y - 28 : tooltip.y + 18
              return (
                <g>
                  <rect
                    x={tx - 50}
                    y={ty - 14}
                    width={100}
                    height={28}
                    rx={6}
                    fill="white"
                    opacity={0.95}
                  />
                  <text
                    x={tx}
                    y={ty + 2}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="var(--font-cormorant-garamond), serif"
                    fontWeight={600}
                    fill="#1c1917"
                  >
                    {tooltip.city}
                  </text>
                </g>
              )
            })()}
          </svg>
        ) : (
          <div className="w-full h-full bg-stone-100 animate-pulse" />
        )}
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between pointer-events-none">
        <div>
          <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider leading-none mb-0.5">Places</p>
          <p className="font-mono text-[9px] text-stone-500">
            {pins.length} {pins.length === 1 ? 'city' : 'cities'}
          </p>
        </div>
        <span className="font-mono text-[9px] text-stone-400">↗</span>
      </div>
    </div>
  )
}
