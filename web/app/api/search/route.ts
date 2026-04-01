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

  return NextResponse.json({ error: 'Unsupported type' }, { status: 400 })
}
