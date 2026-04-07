import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE_SHORT } from '../../appMeta.js'

export function PolicyPage({ slug }) {
  const [page, setPage] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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
    <main className="page-shell">
      <header className="site-header">
        <div className="brand">
          <h1>{APP_NAME}</h1>
          <p className="tagline">{APP_TAGLINE_SHORT}</p>
        </div>
        <nav>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/support">Support</Link>
          <Link to="/faq">FAQ</Link>
        </nav>
      </header>

      <section className="card">
        {loading ? <p>Loading...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && page ? (
          <>
            <h2>{page.title}</h2>
            <p className="updated">Last updated: {page.updatedAt}</p>
            <article>{page.content}</article>
          </>
        ) : null}
      </section>
    </main>
  )
}
