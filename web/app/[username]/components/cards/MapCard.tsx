'use client'

import { useState, useEffect, useCallback } from 'react'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

type Place = {
  id: string
  title: string | null
  metadata: Record<string, unknown>
}

type GeoPath = { d: string; key: string }

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Natural Earth projection (approximate)
function project(lng: number, lat: number, width: number, height: number): [number, number] {
  const x = (lng + 180) / 360 * width
  const latRad = lat * Math.PI / 180
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * height
  return [x, y]
}

function ringToPath(ring: number[][], width: number, height: number): string {
  return ring.map((pt, i) => {
    const [x, y] = project(pt[0], pt[1], width, height)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ') + ' Z'
}

function featuresToPaths(
  features: GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon>[],
  width: number,
  height: number
): GeoPath[] {
  const paths: GeoPath[] = []
  for (const f of features) {
    const coords = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates
    let d = ''
    for (const polygon of coords) {
      for (const ring of polygon) {
        d += ringToPath(ring as number[][], width, height)
      }
    }
    paths.push({ d, key: String(f.id ?? Math.random()) })
  }
  return paths
}

// Map display dimensions
const W = 600
const H = 340

export function MapCard({ places, size }: { places: Place[]; size: '2x1' | '2x2' }) {
  const [paths, setPaths] = useState<GeoPath[]>([])
  const [tooltip, setTooltip] = useState<{ city: string; country: string } | null>(null)

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then((topo: Topology) => {
        const countries = feature(
          topo,
          topo.objects.countries as GeometryCollection
        )
        const feats = countries.features as GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon>[]
        setPaths(featuresToPaths(feats, W, H))
      })
      .catch(() => {})
  }, [])

  const pins = places
    .map(p => ({
      id: p.id,
      city: (p.metadata?.city as string) ?? p.title ?? '',
      country: (p.metadata?.country as string) ?? '',
      lat: p.metadata?.lat as number,
      lng: p.metadata?.lng as number,
    }))
    .filter(p => p.lat != null && p.lng != null)

  const handlePinEnter = useCallback((city: string, country: string) => {
    setTooltip({ city, country })
  }, [])

  const handlePinLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-0 relative z-10">
        <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider">Places</p>
        <span className="font-mono text-[9px] text-stone-400">↗</span>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        {paths.length > 0 ? (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            style={{ display: 'block' }}
          >
            {/* Countries */}
            {paths.map(p => (
              <path
                key={p.key}
                d={p.d}
                fill="#e7e5e4"
                stroke="#fafaf9"
                strokeWidth={0.5}
              />
            ))}

            {/* Pins */}
            {pins.map(pin => {
              const [x, y] = project(pin.lng, pin.lat, W, H)
              return (
                <g
                  key={pin.id}
                  onMouseEnter={() => handlePinEnter(pin.city, pin.country)}
                  onMouseLeave={handlePinLeave}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill="#1c1917"
                    stroke="#fafaf9"
                    strokeWidth={1.5}
                  />
                </g>
              )
            })}
          </svg>
        ) : (
          <div className="w-full h-full bg-stone-100 animate-pulse" />
        )}

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 shadow-sm pointer-events-none z-20">
            <p className="font-serif text-xs font-medium text-stone-900 whitespace-nowrap">{tooltip.city}</p>
            <p className="font-mono text-[8px] text-stone-400 uppercase tracking-wider">{tooltip.country}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 pt-1 relative z-10">
        <p className="font-mono text-[9px] text-stone-400">
          {pins.length} {pins.length === 1 ? 'place' : 'places'}
        </p>
      </div>
    </div>
  )
}
