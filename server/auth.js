import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { pool } from './db.js'

const SESSION_COOKIE = 'aiseo_support_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

function hashPassword(password) {
  return scryptSync(password, 'admin-password-salt', 64).toString('hex')
}

function hashToken(token) {
  return scryptSync(token, 'admin-session-salt', 64).toString('hex')
}

function passwordMatches(input, storedHash) {
  const a = Buffer.from(hashPassword(input), 'hex')
  const b = Buffer.from(storedHash, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function parseCookies(header = '') {
  const out = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim()
    if (key) out[key] = decodeURIComponent(val)
  }
  return out
}

export function sessionCookieHeader(token, { clear = false } = {}) {
  if (clear) {
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  }
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export async function loginAdmin(email, password) {
  const normalized = String(email || '').trim().toLowerCase()
  const result = await pool.query(
    `SELECT id, email, "passwordHash", "isActive"
     FROM "AdminUser"
     WHERE email = $1
     LIMIT 1`,
    [normalized],
  )
  const user = result.rows[0]
  if (!user || !user.isActive) {
    return { ok: false, message: 'Invalid email or password.' }
  }
  if (!passwordMatches(String(password || ''), user.passwordHash)) {
    return { ok: false, message: 'Invalid email or password.' }
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await pool.query(
    `INSERT INTO "AdminSession" (id, "adminUserId", "tokenHash", "expiresAt", "createdAt")
     VALUES ($1, $2, $3, $4, NOW())`,
    [cuidLike(), user.id, hashToken(token), expiresAt],
  )

  return { ok: true, token, email: user.email }
}

export async function logoutAdmin(token) {
  if (!token) return
  await pool.query(`DELETE FROM "AdminSession" WHERE "tokenHash" = $1`, [
    hashToken(token),
  ])
}

export async function requireAdmin(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie || '')
    const token = cookies[SESSION_COOKIE]
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const result = await pool.query(
      `SELECT s."adminUserId", u.email
       FROM "AdminSession" s
       JOIN "AdminUser" u ON u.id = s."adminUserId"
       WHERE s."tokenHash" = $1
         AND s."expiresAt" > NOW()
         AND u."isActive" = true
       LIMIT 1`,
      [hashToken(token)],
    )
    const row = result.rows[0]
    if (!row) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    req.admin = { id: row.adminUserId, email: row.email, token }
    return next()
  } catch (error) {
    console.error('Auth check failed:', error)
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function optionalAdmin(req, _res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie || '')
    const token = cookies[SESSION_COOKIE]
    if (!token) {
      req.admin = null
      return next()
    }
    const result = await pool.query(
      `SELECT s."adminUserId", u.email
       FROM "AdminSession" s
       JOIN "AdminUser" u ON u.id = s."adminUserId"
       WHERE s."tokenHash" = $1
         AND s."expiresAt" > NOW()
         AND u."isActive" = true
       LIMIT 1`,
      [hashToken(token)],
    )
    const row = result.rows[0]
    req.admin = row
      ? { id: row.adminUserId, email: row.email, token }
      : null
    return next()
  } catch {
    req.admin = null
    return next()
  }
}

function cuidLike() {
  return `c${Date.now().toString(36)}${randomBytes(8).toString('hex')}`
}
