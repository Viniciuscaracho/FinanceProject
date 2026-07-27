export async function onRequest() {
  return new Response('ok\n', { headers: { 'Content-Type': 'text/plain' } })
}
