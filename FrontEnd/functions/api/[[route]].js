export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  const backendUrl = env.BACKEND_URL
  if (!backendUrl) {
    return new Response(JSON.stringify({ error: 'BACKEND_URL not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const targetUrl = `${backendUrl}${url.pathname}${url.search}`

  const headers = new Headers(request.headers)
  headers.set('Host', new URL(backendUrl).hostname)
  headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '')
  headers.set('X-Forwarded-Host', url.hostname)
  headers.set('X-Forwarded-Proto', 'https')

  const init = {
    method: request.method,
    headers,
    redirect: 'follow',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body
    init.duplex = 'half'
  }

  const response = await fetch(targetUrl, init)

  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete('Transfer-Encoding')

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}
