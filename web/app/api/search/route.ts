import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  const type = request.nextUrl.searchParams.get('type')

  if (!q || !type) {
    return NextResponse.json({ error: 'Missing q or type' }, { status: 400 })
  }

  if (type === 'book') {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&key=${process.env.GOOGLE_BOOKS_API_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok || data.error) return NextResponse.json({ error: data.error?.message ?? 'API error', raw: data }, { status: 500 })

    const results = (data.items ?? []).map((item: any) => {
      const info = item.volumeInfo
      const rawThumb = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null
      const thumbnail = rawThumb
        ? rawThumb
            .replace('http://', 'https://')
            .replace('&edge=curl', '')
            .replace('zoom=1', 'zoom=3')
        : null
      return {
        external_id: item.id,
        title: info.title,
        image_url: thumbnail,
        metadata: {
          author: info.authors?.[0] ?? null,
          authors: info.authors ?? [],
          published_year: info.publishedDate?.slice(0, 4) ?? null,
          publisher: info.publisher ?? null,
          page_count: info.pageCount ?? null,
          description: info.description ?? null,
        },
      }
    })

    return NextResponse.json({ results })
  }

  if (type === 'movie') {
    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        accept: 'application/json',
      },
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.status_message ?? 'API error' }, { status: 500 })

    const results = (data.results ?? [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 10)
      .map((item: any) => ({
        external_id: String(item.id),
        title: item.title ?? item.name,
        image_url: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        metadata: {
          director: null,
          media_type: item.media_type,
          release_year: (item.release_date ?? item.first_air_date ?? '').slice(0, 4) || null,
          tmdb_id: item.id,
          overview: item.overview ?? null,
        },
      }))

    return NextResponse.json({ results })
  }

  if (type === 'music') {
    const creds = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64')

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) return NextResponse.json({ error: tokenData.error_description ?? 'Token error' }, { status: 500 })

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track,album&limit=10&market=US`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` }, cache: 'no-store' }
    )
    const searchData = await searchRes.json()
    if (!searchRes.ok) return NextResponse.json({ error: searchData.error?.message ?? 'Search error' }, { status: 500 })

    const trackResults = (searchData.tracks?.items ?? []).map((item: any) => ({
      external_id: item.id,
      title: item.name,
      image_url: item.album?.images?.[0]?.url ?? null,
      metadata: {
        artist: item.artists?.[0]?.name ?? null,
        album: item.album?.name ?? null,
        media_type: 'track',
        spotify_id: item.id,
        release_year: item.album?.release_date?.slice(0, 4) ?? null,
      },
    }))

    const albumResults = (searchData.albums?.items ?? []).map((item: any) => ({
      external_id: item.id,
      title: item.name,
      image_url: item.images?.[0]?.url ?? null,
      metadata: {
        artist: item.artists?.[0]?.name ?? null,
        album: item.name,
        media_type: 'album',
        spotify_id: item.id,
        release_year: item.release_date?.slice(0, 4) ?? null,
      },
    }))

    // interleave tracks and albums, up to 10 total
    const results: unknown[] = []
    const maxEach = 5
    trackResults.slice(0, maxEach).forEach((t: unknown, i: number) => {
      results.push(t)
      if (albumResults[i]) results.push(albumResults[i])
    })

    return NextResponse.json({ results: results.slice(0, 10) })
  }

  return NextResponse.json({ error: 'Unsupported type' }, { status: 400 })
}
