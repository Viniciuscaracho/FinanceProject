const GA_ID = 'G-XF7FVEW52W'

export function trackEvent(name, params = {}) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

export function trackPageView(path, title) {
  if (typeof window.gtag !== 'function') return
  window.gtag('config', GA_ID, {
    page_path: path,
    page_title: title,
  })
}
