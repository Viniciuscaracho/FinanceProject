import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../lib/analytics'

export function Analytics() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title)
  }, [location.pathname, location.search])

  return null
}
