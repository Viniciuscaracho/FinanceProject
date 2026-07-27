export async function onRequest(context) {
  const { request, env } = context

  const backendUrl = env.BACKEND_URL
  if (!backendUrl) {
    return new Response('Sitemap temporarily unavailable', { status: 503 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(`${backendUrl}/sitemap.xml`, {
      signal: controller.signal,
      headers: {
        Host: 'orbinutri.com.br',
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
      },
      cf: { cacheTtl: 3600, cacheEverything: true },
    })

    if (!response.ok) {
      return new Response('Sitemap temporarily unavailable', { status: 503 })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new Response('Sitemap temporarily unavailable', { status: 503 })
  } finally {
    clearTimeout(timer)
  }
}
