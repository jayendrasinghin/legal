import cors from 'cors'
import express from 'express'
import {
  loginAdmin,
  logoutAdmin,
  optionalAdmin,
  requireAdmin,
  sessionCookieHeader,
} from './auth.js'
import { pool } from './db.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const query = `
      SELECT slug, title, content, updated_at
      FROM policy_pages
      WHERE slug = $1
      LIMIT 1
    `
    const result = await pool.query(query, [slug])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' })
    }

    const page = result.rows[0]
    return res.json({
      slug: page.slug,
      title: page.title,
      content: page.content,
      updatedAt: new Date(page.updated_at).toISOString().slice(0, 10),
    })
  } catch (error) {
    console.error('Failed to fetch page:', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/auth/me', optionalAdmin, (req, res) => {
  if (!req.admin) return res.json({ authenticated: false })
  return res.json({ authenticated: true, email: req.admin.email })
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
    const password = String(req.body?.password || '')
    const result = await loginAdmin(email, password)
    if (!result.ok) {
      return res.status(401).json({ error: result.message })
    }
    res.setHeader('Set-Cookie', sessionCookieHeader(result.token))
    return res.json({ ok: true, email: result.email })
  } catch (error) {
    console.error('Login failed:', error)
    return res.status(500).json({
      error:
        'Login failed. Ensure AdminUser table exists (Shopify app DB) and credentials are correct.',
    })
  }
})

app.post('/api/auth/logout', optionalAdmin, async (req, res) => {
  try {
    await logoutAdmin(req.admin?.token || null)
  } catch {
    /* ignore */
  }
  res.setHeader('Set-Cookie', sessionCookieHeader('', { clear: true }))
  return res.json({ ok: true })
})

app.get('/api/support/apps', requireAdmin, async (_req, res) => {
  try {
    const apps = await pool.query(
      `
      SELECT
        a.id,
        a.slug,
        a.name,
        a.description,
        COUNT(m.id)::int AS total,
        COUNT(m.id) FILTER (WHERE m.status = 'open' OR (m.status IS NULL AND (m.reply IS NULL OR m.reply = '')))::int AS pending,
        COUNT(m.id) FILTER (WHERE m.status = 'replied' OR (m.reply IS NOT NULL AND m.reply <> ''))::int AS replied
      FROM "SupportApp" a
      LEFT JOIN "SupportMessage" m ON m."appId" = a.id
      WHERE a."isActive" = true
      GROUP BY a.id
      ORDER BY a."sortOrder" ASC, a.name ASC
      `,
    )

    const unassigned = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'open' OR (reply IS NULL OR reply = ''))::int AS pending,
        COUNT(*) FILTER (WHERE status = 'replied' OR (reply IS NOT NULL AND reply <> ''))::int AS replied
      FROM "SupportMessage"
      WHERE "appId" IS NULL
      `,
    )

    return res.json({
      apps: apps.rows,
      unassigned: unassigned.rows[0] || { total: 0, pending: 0, replied: 0 },
    })
  } catch (error) {
    console.error('Failed to list apps:', error)
    return res.status(500).json({
      error:
        'Could not load apps. Run Shopify app migration for SupportApp / SupportMessage.',
    })
  }
})

app.get('/api/support/messages', requireAdmin, async (req, res) => {
  try {
    const appSlug = String(req.query.app || 'all')
    const status = String(req.query.status || 'all')
    const q = String(req.query.q || '').trim()

    const params = []
    const where = []

    if (appSlug === 'unassigned') {
      where.push(`m."appId" IS NULL`)
    } else if (appSlug !== 'all') {
      params.push(appSlug)
      where.push(`a.slug = $${params.length}`)
    }

    if (status === 'pending' || status === 'open') {
      where.push(`(COALESCE(m.status, 'open') = 'open' AND (m.reply IS NULL OR m.reply = ''))`)
    } else if (status === 'replied') {
      where.push(`(m.status = 'replied' OR (m.reply IS NOT NULL AND m.reply <> ''))`)
    } else if (status === 'closed') {
      where.push(`m.status = 'closed'`)
    }

    if (q) {
      params.push(`%${q}%`)
      const i = params.length
      where.push(
        `(m.shop ILIKE $${i} OR COALESCE(m.subject, '') ILIKE $${i} OR m.message ILIKE $${i} OR COALESCE(m."contactEmail", '') ILIKE $${i})`,
      )
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const result = await pool.query(
      `
      SELECT
        m.id,
        m.shop,
        m.subject,
        m.message,
        m."contactEmail" AS "contactEmail",
        m.whatsapp,
        m.reply,
        m."replyAt" AS "replyAt",
        COALESCE(m.status, CASE WHEN m.reply IS NOT NULL AND m.reply <> '' THEN 'replied' ELSE 'open' END) AS status,
        m."createdAt" AS "createdAt",
        a.slug AS "appSlug",
        a.name AS "appName"
      FROM "SupportMessage" m
      LEFT JOIN "SupportApp" a ON a.id = m."appId"
      ${whereSql}
      ORDER BY m."createdAt" DESC
      LIMIT 150
      `,
      params,
    )

    const countsParams = []
    const countsWhere = []
    if (appSlug === 'unassigned') {
      countsWhere.push(`"appId" IS NULL`)
    } else if (appSlug !== 'all') {
      countsParams.push(appSlug)
      countsWhere.push(
        `"appId" = (SELECT id FROM "SupportApp" WHERE slug = $1 LIMIT 1)`,
      )
    }
    const countsWhereSql = countsWhere.length
      ? `WHERE ${countsWhere.join(' AND ')}`
      : ''

    const counts = await pool.query(
      `
      SELECT
        COUNT(*)::int AS received,
        COUNT(*) FILTER (
          WHERE status = 'open'
             OR ((reply IS NULL OR reply = '') AND COALESCE(status, 'open') <> 'closed')
        )::int AS pending,
        COUNT(*) FILTER (
          WHERE status = 'replied' OR (reply IS NOT NULL AND reply <> '')
        )::int AS replied
      FROM "SupportMessage"
      ${countsWhereSql}
      `,
      countsParams,
    )

    return res.json({
      messages: result.rows.map((row) => ({
        ...row,
        createdAt: row.createdAt,
        replyAt: row.replyAt,
      })),
      counts: counts.rows[0] || { received: 0, pending: 0, replied: 0 },
    })
  } catch (error) {
    console.error('Failed to list messages:', error)
    return res.status(500).json({ error: 'Could not load messages.' })
  }
})

app.get('/api/support/messages/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        m.id,
        m.shop,
        m.subject,
        m.message,
        m."contactEmail" AS "contactEmail",
        m.whatsapp,
        m.reply,
        m."replyAt" AS "replyAt",
        COALESCE(m.status, CASE WHEN m.reply IS NOT NULL AND m.reply <> '' THEN 'replied' ELSE 'open' END) AS status,
        m."createdAt" AS "createdAt",
        a.slug AS "appSlug",
        a.name AS "appName"
      FROM "SupportMessage" m
      LEFT JOIN "SupportApp" a ON a.id = m."appId"
      WHERE m.id = $1
      LIMIT 1
      `,
      [req.params.id],
    )
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Message not found' })
    }
    return res.json({ message: result.rows[0] })
  } catch (error) {
    console.error('Failed to load message:', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/support/messages/:id/reply', requireAdmin, async (req, res) => {
  try {
    const reply = String(req.body?.reply || '').trim()
    if (reply.length > 5000) {
      return res.status(400).json({ error: 'Reply must be at most 5000 characters.' })
    }
    const status = reply ? 'replied' : 'open'
    const result = await pool.query(
      `
      UPDATE "SupportMessage"
      SET
        reply = $2,
        "replyAt" = CASE WHEN $2 IS NULL OR $2 = '' THEN NULL ELSE NOW() END,
        status = $3
      WHERE id = $1
      RETURNING id, reply, "replyAt", status
      `,
      [req.params.id, reply || null, status],
    )
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Message not found' })
    }
    return res.json({ ok: true, message: result.rows[0] })
  } catch (error) {
    console.error('Failed to save reply:', error)
    return res.status(500).json({ error: 'Could not save reply.' })
  }
})

app.post('/api/support/messages/:id/status', requireAdmin, async (req, res) => {
  try {
    const status = String(req.body?.status || '')
    if (!['open', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' })
    }
    const result = await pool.query(
      `UPDATE "SupportMessage" SET status = $2 WHERE id = $1 RETURNING id, status`,
      [req.params.id, status],
    )
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Message not found' })
    }
    return res.json({ ok: true, message: result.rows[0] })
  } catch (error) {
    console.error('Failed to update status:', error)
    return res.status(500).json({ error: 'Could not update status.' })
  }
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
