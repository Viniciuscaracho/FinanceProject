export async function onRequest(context) {
  const { request, env, params } = context

  const slug = (params.slug || '').replace(/\.png$/i, '')
  const publicUrl = env.PUBLIC_URL || 'https://orbinutri.com.br'
  const prerenderUrl = env.PRERENDER_URL

  if (!prerenderUrl) {
    return Response.redirect(`${publicUrl}/og-image.png`, 302)
  }

  const templateUrl = `${publicUrl}/og/${slug}`
  const screenshotUrl = `${prerenderUrl}/screenshot?url=${encodeURIComponent(templateUrl)}&width=1200&height=630`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(screenshotUrl, {
      signal: controller.signal,
      cf: { cacheTtl: 86400, cacheEverything: true },
      headers: {
        'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
      },
    })

    if (!response.ok) {
      return Response.redirect(`${publicUrl}/og-image.png`, 302)
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return Response.redirect(`${publicUrl}/og-image.png`, 302)
  } finally {
    clearTimeout(timer)
  }
}
