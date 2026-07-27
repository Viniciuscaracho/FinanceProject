const BOT_REGEX =
  /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|applebot|rogerbot|embedly|quora|redditbot|pinterest|chrome-lighthouse/i

const SKIP_PRERENDER =
  /\.(js|css|png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|eot|map|json|txt|xml)$/i

export async function onRequest(context) {
  const { request, next, env } = context
  const url = new URL(request.url)
  const path = url.pathname

  // Passes through static assets, api, sitemap, og, health and prerender requests
  if (
    SKIP_PRERENDER.test(path) ||
    path.startsWith('/api/') ||
    path === '/sitemap.xml' ||
    path.startsWith('/og/') ||
    path === '/healthz' ||
    path === '/robots.txt' ||
    request.headers.get('X-Prerender') === '1'
  ) {
    return next()
  }

  const userAgent = request.headers.get('User-Agent') || ''
  const isBot = BOT_REGEX.test(userAgent)

  if (isBot && env.PRERENDER_URL) {
    const targetUrl = `${env.PRERENDER_URL}/${url.href}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30_000)

    try {
      const prerenderResp = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'X-Prerender': '1',
          'X-Real-IP': request.headers.get('CF-Connecting-IP') || '',
          'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
          'User-Agent': userAgent,
          Accept: 'text/html',
        },
      })

      if (prerenderResp.ok) {
        return new Response(prerenderResp.body, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            Vary: 'User-Agent',
            'X-Prerender-Cache': prerenderResp.headers.get('X-Prerender-Cache') || 'MISS',
          },
        })
      }
    } catch {
      // Falls through to SPA on prerender failure
    } finally {
      clearTimeout(timer)
    }
  }

  return next()
}
