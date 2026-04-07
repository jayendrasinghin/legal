import cors from 'cors'
import express from 'express'
import { pool } from './db.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)

app.use(cors())
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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
