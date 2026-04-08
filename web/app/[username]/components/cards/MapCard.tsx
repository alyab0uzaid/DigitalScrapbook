'use client'

import { useState, useEffect, useMemo } from 'react'
import { feature } from 'topojson-client'
import { geoNaturalEarth1, geoMercator, geoPath, geoCentroid } from 'd3-geo'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { GeoPermissibleObjects } from 'd3-geo'
import type { Feature, Geometry, GeoJsonProperties } from 'geojson'

type Place = {
  id: string
  title: string | null
  metadata: Record<string, unknown>
}

type GeoFeature = Feature<Geometry, GeoJsonProperties>

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const CONFIG = {
  '2x1': { W: 900, H: 460, worldScale: 140 },
  '2x2': { W: 900, H: 900, worldScale: 165 },
}

export function MapCard({ places, size }: { places: Place[]; size: '2x1' | '2x2' }) {
  const [geoFeatures, setGeoFeatures] = useState<GeoFeature[]>([])
  const [tooltip, setTooltip] = useState<{ city: string; country: string; x: number; y: number } | null>(null)
  const cfg = CONFIG[size]

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then((topo: Topology) => {
        const countries = feature(topo, topo.objects.countries as GeometryCollection)
        // Filter out Antarctica (centroid below -55° latitude)
        const filtered = countries.features.filter(
          f => geoCentroid(f as GeoPermissibleObjects)[1] > -55
        )
        setGeoFeatures(filtered)
      })
      .catch(() => {})
  }, [])

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

  const { W, H, worldScale } = cfg

  const { countryPaths, pinCoords } = useMemo(() => {
    if (!geoFeatures.length) return { countryPaths: [], pinCoords: [] }

    let projection: ReturnType<typeof geoNaturalEarth1> | ReturnType<typeof geoMercator>

    if (pins.length === 0) {
      // No pins — world view
      projection = geoNaturalEarth1().scale(worldScale).translate([W / 2, H / 2])
    } else {
      const lats = pins.map(p => p.lat)
      const lngs = pins.map(p => p.lng)
      const latSpan = Math.max(...lats) - Math.min(...lats)
      const lngSpan = Math.max(...lngs) - Math.min(...lngs)
      const isRegional = latSpan < 60 && lngSpan < 90

      if (isRegional) {
        // Zoom to fit pins with padding
        const PAD = 15
        const bbox = {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: [Math.min(...lngs) - PAD, Math.min(...lats) - PAD] },
              properties: {},
            },
            {
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: [Math.max(...lngs) + PAD, Math.max(...lats) + PAD] },
              properties: {},
            },
          ],
        }
        projection = geoMercator().fitExtent([[0, 0], [W, H]], bbox)
      } else {
        projection = geoNaturalEarth1().scale(worldScale).translate([W / 2, H / 2])
      }
    }

    const gen = geoPath(projection)
    const countryPaths = geoFeatures.map(f => gen(f as GeoPermissibleObjects) ?? '')
    const pinCoords = pins.map(pin => {
      const coords = projection([pin.lng, pin.lat])
      return { ...pin, x: coords?.[0] ?? 0, y: coords?.[1] ?? 0 }
    })

    return { countryPaths, pinCoords }
  }, [geoFeatures, pins, W, H, worldScale])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-stone-50">
        {countryPaths.length > 0 ? (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
          >
            {countryPaths.map((d, i) => (
              <path key={i} d={d} fill="#d6d3d1" stroke="#fafaf9" strokeWidth={0.8} />
            ))}

            {pinCoords.map(pin => (
              <g
                key={pin.id}
                onMouseEnter={() => setTooltip({ city: pin.city, country: pin.country, x: pin.x, y: pin.y })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'default' }}
              >
                <circle cx={pin.x} cy={pin.y} r={7} fill="#1c1917" opacity={0.12} />
                <circle cx={pin.x} cy={pin.y} r={4} fill="#1c1917" stroke="#fafaf9" strokeWidth={1.5} />
              </g>
            ))}

            {tooltip && (() => {
              const tx = Math.min(Math.max(tooltip.x, 70), W - 70)
              const ty = tooltip.y > H / 2 ? tooltip.y - 28 : tooltip.y + 18
              return (
                <g>
                  <rect x={tx - 50} y={ty - 14} width={100} height={28} rx={6} fill="white" opacity={0.95} />
                  <text
                    x={tx} y={ty + 2}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="var(--font-cormorant), serif"
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
