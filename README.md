# Product Image SEO Optimizer — legal & support pages

Hosted pages for the Shopify app **Product Image SEO Optimizer** (https://seoi.in).

**Short description (strict fields):** AI-powered product SEO and image optimization to improve discoverability and conversions.

**Full description:** Boost product SEO and visuals with AI. Generate optimized product descriptions and alt text in one click, scan products for missing image SEO, and upgrade to AI image tools for faster merchandising.

Stack: React Router 7 frontend + Express API + PostgreSQL (`policy_pages`).

## Routes

- `http://localhost:5173/privacy-policy`
- `http://localhost:5173/support`
- `http://localhost:5173/faq`

## Setup

1. Copy env file:

   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

3. Seed database:

   ```bash
   npm run db:seed
   ```

4. Run app (client + server):

   ```bash
   npm run dev
   ```

The frontend proxies `/api` requests to `http://localhost:4000`.

Copy for listings is centralized in `appMeta.js` (keep Shopify Partner fields in sync after edits).
# legal
