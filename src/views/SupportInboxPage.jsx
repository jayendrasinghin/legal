import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setPageSeo } from '../seo.js'

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })
  const text = await response.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { error: 'Invalid response from server.' }
  }
  if (!response.ok) {
    const err = new Error(data.error || `Request failed (${response.status})`)
    err.status = response.status
    throw err
  }
  return data
}

function formatWhen(value) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

function AdminLoginCard({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      onSuccess()
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inbox-login">
      <div className="inbox-login-card">
        <p className="inbox-brand">Support system</p>
        <h1>Staff sign in</h1>
        <p className="inbox-sub">
          Use your admin email and password to open the app-wise support inbox.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Open support inbox'}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </form>
        <p className="inbox-sub" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <Link to="/support">← Back to app promo</Link>
        </p>
      </div>
    </div>
  )
}

export function SupportInboxPage() {
  const navigate = useNavigate()
  const [auth, setAuth] = useState({ loading: true, authenticated: false, email: '' })
  const [apps, setApps] = useState([])
  const [unassigned, setUnassigned] = useState({ total: 0, pending: 0, replied: 0 })
  const [appSlug, setAppSlug] = useState('all')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [counts, setCounts] = useState({ received: 0, pending: 0, replied: 0 })
  const [messages, setMessages] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')

  const refreshAuth = useCallback(async () => {
    try {
      const me = await api('/api/auth/me')
      setAuth({
        loading: false,
        authenticated: Boolean(me.authenticated),
        email: me.email || '',
      })
    } catch {
      setAuth({ loading: false, authenticated: false, email: '' })
    }
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  useEffect(() => {
    setPageSeo({
      title: 'Staff login | Support inbox',
      description: 'Private staff support inbox.',
      path: '/support/admin',
      noindex: true,
    })
  }, [])

  const loadApps = useCallback(async () => {
    const data = await api('/api/support/apps')
    setApps(data.apps || [])
    setUnassigned(data.unassigned || { total: 0, pending: 0, replied: 0 })
  }, [])

  const loadMessages = useCallback(async () => {
    setListLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('app', appSlug)
      params.set('status', status)
      if (q) params.set('q', q)
      const data = await api(`/api/support/messages?${params}`)
      setMessages(data.messages || [])
      setCounts(data.counts || { received: 0, pending: 0, replied: 0 })
    } catch (err) {
      setError(err.message || 'Failed to load messages.')
      if (err.status === 401) {
        setAuth({ loading: false, authenticated: false, email: '' })
      }
    } finally {
      setListLoading(false)
    }
  }, [appSlug, status, q])

  useEffect(() => {
    if (!auth.authenticated) return
    loadApps().catch((err) => setError(err.message))
  }, [auth.authenticated, loadApps])

  useEffect(() => {
    if (!auth.authenticated) return
    loadMessages()
  }, [auth.authenticated, loadMessages])

  useEffect(() => {
    if (!selectedId || !auth.authenticated) {
      setDetail(null)
      setReply('')
      return
    }
    let alive = true
    api(`/api/support/messages/${selectedId}`)
      .then((data) => {
        if (!alive) return
        setDetail(data.message)
        setReply(data.message?.reply || '')
      })
      .catch((err) => {
        if (alive) setError(err.message)
      })
    return () => {
      alive = false
    }
  }, [selectedId, auth.authenticated])

  async function handleLogout() {
    await api('/api/auth/logout', { method: 'POST' })
    setSelectedId(null)
    setAuth({ loading: false, authenticated: false, email: '' })
    navigate('/support')
  }

  async function saveReply() {
    if (!selectedId) return
    setSaving(true)
    setFlash('')
    setError('')
    try {
      await api(`/api/support/messages/${selectedId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply }),
      })
      setFlash('Reply saved.')
      await loadMessages()
      await loadApps()
      const refreshed = await api(`/api/support/messages/${selectedId}`)
      setDetail(refreshed.message)
      setReply(refreshed.message?.reply || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function setMessageStatus(next) {
    if (!selectedId) return
    setSaving(true)
    setError('')
    try {
      await api(`/api/support/messages/${selectedId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: next }),
      })
      await loadMessages()
      await loadApps()
      const refreshed = await api(`/api/support/messages/${selectedId}`)
      setDetail(refreshed.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (auth.loading) {
    return (
      <main className="inbox-shell">
        <p className="inbox-muted">Loading…</p>
      </main>
    )
  }

  if (!auth.authenticated) {
    return <AdminLoginCard onSuccess={refreshAuth} />
  }

  const selectedApp =
    appSlug === 'all'
      ? null
      : appSlug === 'unassigned'
        ? { name: 'Unassigned', description: 'Messages without an app tag' }
        : apps.find((a) => a.slug === appSlug)

  return (
    <main className="inbox-shell">
      <aside className="inbox-sidebar">
        <div className="inbox-side-top">
          <p className="inbox-brand">Support inbox</p>
          <p className="inbox-muted" style={{ color: '#94a3b8' }}>
            {auth.email}
          </p>
        </div>

        <p className="inbox-side-label">Apps</p>
        <button
          type="button"
          className={`inbox-app-tab ${appSlug === 'all' ? 'active' : ''}`}
          onClick={() => {
            setAppSlug('all')
            setSelectedId(null)
          }}
        >
          <span>All apps</span>
          <span className="inbox-count">
            {apps.reduce((n, a) => n + (a.total || 0), 0) + (unassigned.total || 0)}
          </span>
        </button>
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            className={`inbox-app-tab ${appSlug === app.slug ? 'active' : ''}`}
            onClick={() => {
              setAppSlug(app.slug)
              setSelectedId(null)
            }}
          >
            <span>{app.name}</span>
            {app.pending > 0 ? <span className="inbox-badge">{app.pending}</span> : null}
          </button>
        ))}
        {unassigned.total > 0 ? (
          <button
            type="button"
            className={`inbox-app-tab ${appSlug === 'unassigned' ? 'active' : ''}`}
            onClick={() => {
              setAppSlug('unassigned')
              setSelectedId(null)
            }}
          >
            <span>Unassigned</span>
            {unassigned.pending > 0 ? (
              <span className="inbox-badge">{unassigned.pending}</span>
            ) : null}
          </button>
        ) : null}

        <div className="inbox-side-footer">
          <Link to="/support">App promo</Link>
          <Link to="/help">Public help page</Link>
          <Link to="/privacy-policy">Privacy</Link>
          <button type="button" className="inbox-link-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <section className="inbox-main">
        <header className="inbox-header">
          <div>
            <h1>{selectedApp?.name || 'All support messages'}</h1>
            <p className="inbox-muted">
              {selectedApp?.description ||
                'Select an app tab to filter tickets. Click a message for full details and reply.'}
            </p>
          </div>
        </header>

        <div className="inbox-stats">
          <button
            type="button"
            className={`inbox-stat ${status === 'all' ? 'active' : ''}`}
            onClick={() => setStatus('all')}
          >
            <span className="label">Received</span>
            <span className="value">{counts.received}</span>
          </button>
          <button
            type="button"
            className={`inbox-stat ${status === 'pending' ? 'active' : ''}`}
            onClick={() => setStatus('pending')}
          >
            <span className="label">Pending</span>
            <span className="value">{counts.pending}</span>
          </button>
          <button
            type="button"
            className={`inbox-stat ${status === 'replied' ? 'active' : ''}`}
            onClick={() => setStatus('replied')}
          >
            <span className="label">Replied</span>
            <span className="value">{counts.replied}</span>
          </button>
        </div>

        <form
          className="inbox-search"
          onSubmit={(e) => {
            e.preventDefault()
            setQ(searchInput.trim())
          }}
        >
          <input
            type="search"
            placeholder="Search shop, subject, message, email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {error ? <p className="error">{error}</p> : null}

        <div className="inbox-split">
          <div className="inbox-list">
            {listLoading ? <p className="inbox-muted">Loading messages…</p> : null}
            {!listLoading && messages.length === 0 ? (
              <p className="inbox-muted">No messages for this filter.</p>
            ) : null}
            {messages.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`inbox-list-item ${selectedId === m.id ? 'active' : ''}`}
                onClick={() => setSelectedId(m.id)}
              >
                <div className="inbox-list-top">
                  <strong>{m.shop}</strong>
                  <span className={`pill ${m.status === 'open' ? 'pending' : m.status}`}>
                    {m.status === 'open' ? 'pending' : m.status}
                  </span>
                </div>
                <div className="inbox-list-meta">
                  {m.appName ? <span className="app-chip">{m.appName}</span> : null}
                  <span>{formatWhen(m.createdAt)}</span>
                </div>
                <p>{m.subject || m.message.slice(0, 120)}</p>
              </button>
            ))}
          </div>

          <div className="inbox-detail">
            {!detail ? (
              <div className="inbox-empty-detail">
                <h2>Message details</h2>
                <p className="inbox-muted">
                  Click an app tab, then pick a message to read and reply.
                </p>
              </div>
            ) : (
              <>
                <div className="inbox-detail-top">
                  <div>
                    {detail.appName ? (
                      <span className="app-chip">{detail.appName}</span>
                    ) : null}
                    <h2>{detail.shop}</h2>
                    <p className="inbox-muted">{formatWhen(detail.createdAt)}</p>
                  </div>
                  <span className={`pill ${detail.status === 'open' ? 'pending' : detail.status}`}>
                    {detail.status === 'open' ? 'pending' : detail.status}
                  </span>
                </div>
                {detail.subject ? <h3>{detail.subject}</h3> : null}
                <article className="inbox-body">{detail.message}</article>
                <p className="inbox-muted">
                  {detail.contactEmail ? `Email: ${detail.contactEmail}` : ''}
                  {detail.contactEmail && detail.whatsapp ? ' · ' : ''}
                  {detail.whatsapp ? `WhatsApp: ${detail.whatsapp}` : ''}
                </p>

                {detail.reply ? (
                  <div className="inbox-reply-preview">
                    <strong>Current reply</strong>
                    <p>{detail.reply}</p>
                    {detail.replyAt ? (
                      <p className="inbox-muted">Saved {formatWhen(detail.replyAt)}</p>
                    ) : null}
                  </div>
                ) : null}

                <label htmlFor="reply">Your reply</label>
                <textarea
                  id="reply"
                  rows={6}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply the merchant will see in the app…"
                />
                <div className="inbox-actions">
                  <button type="button" onClick={saveReply} disabled={saving}>
                    {saving ? 'Saving…' : 'Save reply'}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setMessageStatus('open')}
                    disabled={saving}
                  >
                    Mark pending
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setMessageStatus('closed')}
                    disabled={saving}
                  >
                    Mark closed
                  </button>
                  {flash ? <span className="flash">{flash}</span> : null}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
