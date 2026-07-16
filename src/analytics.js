/** Google Analytics 4 measurement ID for support.seoi.in */
export const GA_MEASUREMENT_ID = 'G-JMN514QPVD'

/** Staff / private routes — do not send to Analytics */
const SKIP_PREFIXES = ['/support/admin', '/api']

export function shouldTrackPath(pathname) {
  const path = pathname || '/'
  return !SKIP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export function trackPageview(pathname, search = '') {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  if (!shouldTrackPath(pathname)) return
  const page_path = `${pathname || '/'}${search || ''}`
  window.gtag('event', 'page_view', {
    page_path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

/** Subscribe to React Router navigations for SPA page views. */
export function bindRouterAnalytics(router) {
  if (!router?.subscribe) return () => {}
  let last = ''
  const send = (location) => {
    const key = `${location.pathname}${location.search}`
    if (key === last) return
    last = key
    trackPageview(location.pathname, location.search)
  }
  // Initial load
  send(router.state.location)
  return router.subscribe((state) => {
    send(state.location)
  })
}
