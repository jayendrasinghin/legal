/** Shop install / usage status from shared Shopify app DB (Session + StoreUsage). */

function isFoundingActive(usage, now = new Date()) {
  if (!usage?.foundingMember || !usage?.foundingExpiresAt) return false
  return new Date(usage.foundingExpiresAt).getTime() > now.getTime()
}

function effectivePlan(usage, now = new Date()) {
  const shopifyPlan = usage?.plan || 'free'
  if (shopifyPlan === 'seo_image' || shopifyPlan === 'image') return shopifyPlan
  if (isFoundingActive(usage, now)) return 'seo'
  return shopifyPlan
}

const PLAN_LABELS = {
  free: 'Free',
  seo: 'SEO Starter',
  image: 'AI Image',
  seo_image: 'SEO Pro + Image',
}

export function planLabel(plan) {
  return PLAN_LABELS[plan] || plan || 'Free'
}

export function mapShopRow(row) {
  const usage = {
    plan: row.plan || 'free',
    foundingMember: Boolean(row.foundingMember),
    foundingMemberNumber: row.foundingMemberNumber,
    foundingExpiresAt: row.foundingExpiresAt,
  }
  const installed = Boolean(row.installed)
  const eff = effectivePlan(usage)
  return {
    shop: row.shop,
    installed,
    status: installed ? 'installed' : 'not_installed',
    plan: usage.plan,
    planLabel: planLabel(usage.plan),
    effectivePlan: eff,
    effectivePlanLabel: planLabel(eff),
    foundingMember: usage.foundingMember,
    foundingMemberNumber: usage.foundingMemberNumber,
    foundingExpiresAt: usage.foundingExpiresAt
      ? new Date(usage.foundingExpiresAt).toISOString()
      : null,
    foundingActive: isFoundingActive(usage),
    aiSeoUsed: Number(row.aiSeoUsed || 0),
    aiImageUsed: Number(row.aiImageUsed || 0),
    freeQuotaLimit: Number(row.freeQuotaLimit || 100),
    installedOn: row.firstSeenAt ? new Date(row.firstSeenAt).toISOString() : null,
    lastUsed: row.lastActivityAt ? new Date(row.lastActivityAt).toISOString() : null,
    contactEmail: row.contactEmail || null,
  }
}

/**
 * Status for one shop domain (e.g. from a support ticket).
 */
export async function fetchShopStatus(pool, shop) {
  if (!shop) return null
  const result = await pool.query(
    `
    SELECT
      $1::text AS shop,
      EXISTS (SELECT 1 FROM "Session" s WHERE s.shop = $1) AS installed,
      u.plan,
      u."foundingMember" AS "foundingMember",
      u."foundingMemberNumber" AS "foundingMemberNumber",
      u."foundingExpiresAt" AS "foundingExpiresAt",
      u."aiSeoUsed" AS "aiSeoUsed",
      u."aiImageUsed" AS "aiImageUsed",
      u."freeQuotaLimit" AS "freeQuotaLimit",
      u."createdAt" AS "firstSeenAt",
      u."updatedAt" AS "lastActivityAt",
      (
        SELECT s.email
        FROM "Session" s
        WHERE s.shop = $1 AND s.email IS NOT NULL AND s.email <> ''
        ORDER BY s."accountOwner" DESC NULLS LAST, s."isOnline" DESC
        LIMIT 1
      ) AS "contactEmail"
    FROM (SELECT 1) dummy
    LEFT JOIN "StoreUsage" u ON u.shop = $1
    `,
    [shop],
  )
  if (!result.rows[0]) return null
  return mapShopRow(result.rows[0])
}

/**
 * All currently installed shops (have a Session row).
 */
export async function fetchInstalledShops(pool) {
  const result = await pool.query(
    `
    SELECT
      shops.shop,
      true AS installed,
      u.plan,
      u."foundingMember" AS "foundingMember",
      u."foundingMemberNumber" AS "foundingMemberNumber",
      u."foundingExpiresAt" AS "foundingExpiresAt",
      u."aiSeoUsed" AS "aiSeoUsed",
      u."aiImageUsed" AS "aiImageUsed",
      u."freeQuotaLimit" AS "freeQuotaLimit",
      u."createdAt" AS "firstSeenAt",
      u."updatedAt" AS "lastActivityAt",
      (
        SELECT s.email
        FROM "Session" s
        WHERE s.shop = shops.shop AND s.email IS NOT NULL AND s.email <> ''
        ORDER BY s."accountOwner" DESC NULLS LAST, s."isOnline" DESC
        LIMIT 1
      ) AS "contactEmail"
    FROM (
      SELECT DISTINCT shop FROM "Session" ORDER BY shop ASC
    ) shops
    LEFT JOIN "StoreUsage" u ON u.shop = shops.shop
    ORDER BY shops.shop ASC
    `,
  )

  const shops = result.rows.map(mapShopRow)
  const foundingUsed = shops.filter((s) => s.foundingMember).length
  return {
    shops,
    foundingStats: {
      used: foundingUsed,
      limit: 99,
      remaining: Math.max(0, 99 - foundingUsed),
    },
  }
}
