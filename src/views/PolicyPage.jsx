import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE_SHORT } from '../../appMeta.js'
import { PROMO } from '../promoConfig.js'
import { setPageSeo } from '../seo.js'

export function PolicyPage({ slug }) {
  const [page, setPage] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!page) return
    const path =
      slug === 'support' ? '/help' : slug === 'privacy-policy' ? '/privacy-policy' : `/${slug}`
    setPageSeo({
      title: `${page.title} | ${APP_NAME}`,
      description: (page.content || APP_TAGLINE_SHORT).slice(0, 155),
      path,
    })
  }, [page, slug])

  useEffect(() => {
    let isMounted = true

    async function loadPage() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/pages/${slug}`)
        const text = await response.text()
        let data = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          if (isMounted) {
            setError('Invalid response from server.')
          }
          return
        }

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              data.error ||
                'Page not found. Seed the database: npm run db:seed (PostgreSQL must be running).',
            )
          }
          if (response.status >= 500) {
            throw new Error(
              'Database or server error. Check PostgreSQL is running, .env credentials match, then run npm run db:seed.',
            )
          }
          throw new Error(data.error || `Request failed (${response.status}).`)
        }

        if (isMounted) {
          setPage(data)
        }
      } catch (fetchError) {
        if (isMounted) {
          const msg = fetchError?.message || 'Something went wrong.'
          const isNetwork =
            fetchError?.name === 'TypeError' ||
            msg === 'Failed to fetch' ||
            msg.includes('NetworkError')
          if (isNetwork) {
            setError(
              'Cannot reach the API. Run npm run dev (starts Vite + API on port 4000). If you only run the Vite client, the API is not started.',
            )
          } else {
            setError(msg)
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPage()
    return () => {
      isMounted = false
    }
  }, [slug])

  return (
    <div className="promo-page">
      <header className="promo-nav">
        <div className="promo-nav-brand">
          <strong>{PROMO.brand}</strong>
          <span>seoi.in</span>
        </div>
        <nav>
          <Link to="/support">Home</Link>
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/help">Help</Link>
          <Link to="/faq">FAQ</Link>
        </nav>
      </header>

      <section className="promo-doc">
        {loading ? <p className="promo-section-sub">Loading...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && page ? (
          <>
            <h1>{page.title}</h1>
            <p className="promo-doc-updated">Last updated: {page.updatedAt}</p>
            <article className="promo-doc-body">{page.content}</article>
          </>
        ) : null}
      </section>

      <footer className="promo-footer">
        <span>{PROMO.brand}</span>
        <a href={PROMO.ctaHref} target="_blank" rel="noreferrer">
          Shopify App Store
        </a>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/help">Help</Link>
      </footer>
    </div>
  )
}
