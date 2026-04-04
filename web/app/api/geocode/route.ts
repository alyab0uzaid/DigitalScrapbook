import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 })

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=3&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DigitalScrapbook/1.0 (personal project)',
          'Accept-Language': 'en',
        },
      }
    )

    if (!res.ok) return NextResponse.json({ error: 'Geocode failed' }, { status: 422 })

    const data = await res.json()

    const results = data
      .filter((r: Record<string, unknown>) => r.lat && r.lon)
      .map((r: Record<string, unknown>) => {
        const address = r.address as Record<string, string> | undefined
        const country = address?.country ?? ''
        const city =
          address?.city ??
          address?.town ??
          address?.village ??
          address?.county ??
          (r.display_name as string).split(',')[0]
        return {
          lat: parseFloat(r.lat as string),
          lng: parseFloat(r.lon as string),
          city,
          country,
          display_name: r.display_name,
        }
      })

    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: 'Geocode request failed' }, { status: 422 })
  }
}
