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

function StoreStatusCard({ status }) {
  if (!status) return null
  return (
    <div className="inbox-store-status">
      <div className="inbox-store-status-top">
        <strong>Store status</strong>
        <span className={`pill ${status.installed ? 'replied' : 'pending'}`}>
          {status.installed ? 'installed' : 'not installed'}
        </span>
      </div>
      <dl className="inbox-store-grid">
        <div>
          <dt>Plan</dt>
          <dd>{status.effectivePlanLabel || status.planLabel}</dd>
        </div>
        <div>
          <dt>Installed on</dt>
          <dd>{status.installedOn ? formatWhen(status.installedOn) : '—'}</dd>
        </div>
        <div>
          <dt>Last used</dt>
          <dd>{status.lastUsed ? formatWhen(status.lastUsed) : '—'}</dd>
        </div>
        <div>
          <dt>AI SEO used</dt>
          <dd>
            {status.aiSeoUsed}
            {status.effectivePlan === 'free' ? ` / ${status.freeQuotaLimit}` : ''}
          </dd>
        </div>
        <div>
          <dt>AI image used</dt>
          <dd>{status.aiImageUsed}</dd>
        </div>
        {status.foundingMember ? (
          <div>
            <dt>Founding</dt>
            <dd>
              #{status.foundingMemberNumber}
              {status.foundingActive ? ' (active)' : ' (ended)'}
              {status.foundingExpiresAt
                ? ` · until ${formatWhen(status.foundingExpiresAt)}`
                : ''}
            </dd>
          </div>
        ) : null}
        {status.contactEmail ? (
          <div>
            <dt>Staff email</dt>
            <dd>{status.contactEmail}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

function formatMinutes(mins) {
  const n = Number(mins) || 0
  if (n < 60) return `${n} min`
  const h = Math.floor(n / 60)
  const m = n % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function formatBytes(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function StoreDetailPanel({ detail, loading, onBack }) {
  if (loading) {
    return <p className="inbox-muted">Loading store statistics…</p>
  }
  if (!detail) {
    return (
      <div className="inbox-empty-detail">
        <h2>Store statistics</h2>
        <p className="inbox-muted">
          Open the Installed tab and click a store to see full statistics.
        </p>
      </div>
    )
  }
  const s = detail.stats || {}
  return (
    <div className="inbox-store-detail">
      {onBack ? (
        <button type="button" className="inbox-link-btn" onClick={onBack}>
          ← Back to installed list
        </button>
      ) : null}
      <div className="inbox-store-status-top">
        <div>
          <h2>{detail.shop}</h2>
          <p className="inbox-muted">{detail.effectivePlanLabel}</p>
        </div>
        <span className={`pill ${detail.installed ? 'replied' : 'pending'}`}>
          {detail.installed ? 'installed' : 'not installed'}
        </span>
      </div>

      <div className="inbox-stat-grid">
        <div className="inbox-stat-tile">
          <span className="label">Installed on</span>
          <span className="value sm">
            {detail.installedOn ? formatWhen(detail.installedOn) : '—'}
          </span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">Last used</span>
          <span className="value sm">
            {detail.lastUsed ? formatWhen(detail.lastUsed) : '—'}
          </span>
        </div>
        <div className="inbox-stat-tile highlight">
          <span className="label">Working today</span>
          <span className="value">{formatMinutes(s.workingMinutesToday)}</span>
        </div>
        <div className="inbox-stat-tile highlight">
          <span className="label">Total working</span>
          <span className="value">{formatMinutes(s.workingMinutesTotal)}</span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">Days installed</span>
          <span className="value">{s.daysInstalled ?? '—'}</span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">Avg / day</span>
          <span className="value">{formatMinutes(s.avgMinutesPerDay)}</span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">AI SEO used</span>
          <span className="value">
            {s.aiSeoUsed}
            {detail.effectivePlan === 'free' ? ` / ${s.freeQuotaLimit}` : ''}
          </span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">AI image used</span>
          <span className="value">{s.aiImageUsed}</span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">Jobs today</span>
          <span className="value">{s.jobsToday}</span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">Jobs total</span>
          <span className="value">{s.jobsTotal}</span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">IndexNow</span>
          <span className="value">
            {s.indexNowToday}/{s.indexNowTotal}
          </span>
          <span className="hint">today / total</span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">Support tickets</span>
          <span className="value">
            {s.supportOpen} open · {s.supportTickets} total
          </span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">ALT issues</span>
          <span className="value">{s.imageIssuesOpen}</span>
          <span className="hint">
            missing {s.missingAlt} · short {s.shortAlt} · dup {s.duplicateAlt}
          </span>
        </div>
        <div className="inbox-stat-tile">
          <span className="label">Images optimized</span>
          <span className="value">{s.imagesOptimized}</span>
          <span className="hint">saved {formatBytes(s.bytesSaved)}</span>
        </div>
      </div>

      {detail.foundingMember ? (
        <p className="inbox-muted">
          Founding #{detail.foundingMemberNumber}
          {detail.foundingActive ? ' (active)' : ' (ended)'}
          {detail.foundingExpiresAt ? ` · until ${formatWhen(detail.foundingExpiresAt)}` : ''}
        </p>
      ) : null}
      {detail.contactEmail ? (
        <p className="inbox-muted">Staff email: {detail.contactEmail}</p>
      ) : null}

      <h3>Recent jobs</h3>
      {!s.recentJobs?.length ? (
        <p className="inbox-muted">No scan/optimize jobs logged yet.</p>
      ) : (
        <ul className="inbox-job-list">
          {s.recentJobs.map((j, i) => (
            <li key={`${j.kind}-${j.startedAt}-${i}`}>
              <strong>{j.kind.replace('_', ' ')}</strong>
              <span className={`pill ${j.status === 'completed' ? 'replied' : 'pending'}`}>
                {j.status}
              </span>
              <span className="inbox-muted">
                {formatWhen(j.startedAt)} · {formatMinutes(j.minutes)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="inbox-muted" style={{ marginTop: '1rem', fontSize: '0.82rem' }}>
        Working minutes are estimated from image scan, link scan, and optimize job durations.
      </p>
    </div>
  )
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
  const [view, setView] = useState('messages') // messages | shops | store
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [counts, setCounts] = useState({ received: 0, pending: 0, replied: 0 })
  const [messages, setMessages] = useState([])
  const [shops, setShops] = useState([])
  const [foundingStats, setFoundingStats] = useState(null)
  const [shopSearch, setShopSearch] = useState('')
  const [selectedShop, setSelectedShop] = useState('')
  const [shopDetail, setShopDetail] = useState(null)
  const [shopDetailLoading, setShopDetailLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const [shopsLoading, setShopsLoading] = useState(false)
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

  const loadShops = useCallback(async () => {
    setShopsLoading(true)
    setError('')
    try {
      const data = await api('/api/support/shops')
      setShops(data.shops || [])
      setFoundingStats(data.foundingStats || null)
    } catch (err) {
      setError(err.message || 'Failed to load stores.')
      if (err.status === 401) {
        setAuth({ loading: false, authenticated: false, email: '' })
      }
    } finally {
      setShopsLoading(false)
    }
  }, [])

  const loadShopDetail = useCallback(async (shop) => {
    if (!shop) {
      setShopDetail(null)
      return
    }
    setShopDetailLoading(true)
    setError('')
    try {
      const data = await api(`/api/support/shops/${encodeURIComponent(shop)}`)
      setShopDetail(data.shop || null)
      setSelectedShop(shop)
    } catch (err) {
      setError(err.message || 'Failed to load store statistics.')
      setShopDetail(null)
    } finally {
      setShopDetailLoading(false)
    }
  }, [])

  const openStoreDetail = useCallback(
    (shop) => {
      setView('store')
      setSelectedId(null)
      loadShopDetail(shop)
    },
    [loadShopDetail],
  )

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
    // Prefetch store count for sidebar
    api('/api/support/shops')
      .then((data) => {
        setShops(data.shops || [])
        setFoundingStats(data.foundingStats || null)
      })
      .catch(() => {})
  }, [auth.authenticated, loadApps])

  useEffect(() => {
    if (!auth.authenticated) return
    loadMessages()
  }, [auth.authenticated, loadMessages])

  useEffect(() => {
    if (!auth.authenticated || view !== 'shops') return
    loadShops()
  }, [auth.authenticated, view, loadShops])

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
          className={`inbox-app-tab ${view === 'messages' && appSlug === 'all' ? 'active' : ''}`}
          onClick={() => {
            setView('messages')
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
            className={`inbox-app-tab ${view === 'messages' && appSlug === app.slug ? 'active' : ''}`}
            onClick={() => {
              setView('messages')
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
            className={`inbox-app-tab ${view === 'messages' && appSlug === 'unassigned' ? 'active' : ''}`}
            onClick={() => {
              setView('messages')
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
            <h1>
              {view === 'store'
                ? 'Store statistics'
                : view === 'shops'
                  ? 'Installed stores'
                  : selectedApp?.name || 'All support messages'}
            </h1>
            <p className="inbox-muted">
              {view === 'store'
                ? 'Installed date, usage, working time today/total, and full activity for one store.'
                : view === 'shops'
                  ? 'Click a store to open full statistics.'
                  : selectedApp?.description ||
                    'Select an app tab to filter tickets. Click a message for full details and reply.'}
            </p>
          </div>
        </header>

        <div className="inbox-stats">
          <button
            type="button"
            className={`inbox-stat ${view === 'messages' && status === 'all' ? 'active' : ''}`}
            onClick={() => {
              setView('messages')
              setStatus('all')
              setSelectedId(null)
            }}
          >
            <span className="label">Received</span>
            <span className="value">{counts.received}</span>
          </button>
          <button
            type="button"
            className={`inbox-stat ${view === 'messages' && status === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setView('messages')
              setStatus('pending')
              setSelectedId(null)
            }}
          >
            <span className="label">Pending</span>
            <span className="value">{counts.pending}</span>
          </button>
          <button
            type="button"
            className={`inbox-stat ${view === 'messages' && status === 'replied' ? 'active' : ''}`}
            onClick={() => {
              setView('messages')
              setStatus('replied')
              setSelectedId(null)
            }}
          >
            <span className="label">Replied</span>
            <span className="value">{counts.replied}</span>
          </button>
          <button
            type="button"
            className={`inbox-stat ${view === 'shops' ? 'active' : ''}`}
            onClick={() => {
              setView('shops')
              setSelectedId(null)
              loadShops()
            }}
          >
            <span className="label">Installed</span>
            <span className="value">{shops.length}</span>
          </button>
          <button
            type="button"
            className={`inbox-stat ${view === 'store' ? 'active' : ''}`}
            onClick={() => {
              setView('store')
              setSelectedId(null)
              if (selectedShop) loadShopDetail(selectedShop)
            }}
          >
            <span className="label">Store</span>
            <span className="value">{selectedShop ? '1' : '—'}</span>
          </button>
        </div>

        {view === 'store' ? (
          <StoreDetailView
            detail={shopDetail}
            loading={shopDetailLoading}
            onBack={() => setView('shops')}
          />
        ) : view === 'shops' ? (
          <>
            {foundingStats ? (
              <p className="inbox-muted" style={{ margin: '0.35rem 0 0.75rem' }}>
                Founding members: {foundingStats.used}/{foundingStats.limit} ·{' '}
                {foundingStats.remaining} slots left
              </p>
            ) : null}

            <form
              className="inbox-search"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <input
                type="search"
                placeholder="Filter by shop domain…"
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
              />
              <button type="button" onClick={() => loadShops()}>
                Refresh
              </button>
            </form>

            {error ? <p className="error">{error}</p> : null}

            <div className="inbox-shops-list">
              {shopsLoading ? <p className="inbox-muted">Loading stores…</p> : null}
              {!shopsLoading && shops.length === 0 ? (
                <p className="inbox-muted">No installed stores found.</p>
              ) : null}
              {shops
                .filter((s) =>
                  shopSearch.trim()
                    ? s.shop.toLowerCase().includes(shopSearch.trim().toLowerCase())
                    : true,
                )
                .map((s) => (
                  <button
                    key={s.shop}
                    type="button"
                    className="inbox-shop-card inbox-shop-card-btn"
                    onClick={() => openStoreDetail(s.shop)}
                  >
                    <div className="inbox-store-status-top">
                      <h2>{s.shop}</h2>
                      <span className={`pill ${s.installed ? 'replied' : 'pending'}`}>
                        {s.installed ? 'installed' : 'not installed'}
                      </span>
                    </div>
                    <p className="inbox-muted">
                      Plan: <strong>{s.effectivePlanLabel}</strong>
                      {s.plan !== s.effectivePlan ? ` (billing: ${s.planLabel})` : ''}
                      {s.foundingMember
                        ? ` · Founding #${s.foundingMemberNumber}${s.foundingActive ? ' active' : ''}`
                        : ''}
                    </p>
                    <p className="inbox-muted">
                      Installed on: {s.installedOn ? formatWhen(s.installedOn) : '—'} · Last used:{' '}
                      {s.lastUsed ? formatWhen(s.lastUsed) : '—'}
                    </p>
                    <p className="inbox-muted">
                      AI SEO used: {s.aiSeoUsed}
                      {s.effectivePlan === 'free' ? ` / ${s.freeQuotaLimit}` : ''} · AI image used:{' '}
                      {s.aiImageUsed}
                      {s.contactEmail ? ` · ${s.contactEmail}` : ''}
                    </p>
                    <p className="inbox-muted" style={{ color: '#0d9488' }}>
                      Click for full statistics →
                    </p>
                  </button>
                ))}
            </div>
          </>
        ) : (
          <>
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
                <StoreStatusCard status={detail.shopStatus} />
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
          </>
        )}
      </section>
    </main>
  )
}
