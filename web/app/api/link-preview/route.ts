import { NextRequest, NextResponse } from 'next/server'
import ogs from 'open-graph-scraper'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  try {
    const { result, error } = await ogs({
      url,
      fetchOptions: {
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          'accept-encoding': 'gzip, deflate, br',
          'cache-control': 'no-cache',
        },
      },
      timeout: 10000,
    })

    if (error) return NextResponse.json({ error: 'Could not fetch page' }, { status: 422 })

    const image = result.ogImage?.[0]?.url ?? null
    const favicon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`

    return NextResponse.json({
      url,
      title: result.ogTitle ?? result.dcTitle ?? null,
      description: result.ogDescription ?? null,
      image,
      favicon,
      site_name: result.ogSiteName ?? new URL(url).hostname,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid URL or unreachable page' }, { status: 422 })
  }
}
