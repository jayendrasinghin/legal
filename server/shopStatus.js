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

function minutesBetween(start, end) {
  if (!start) return 0
  const a = new Date(start).getTime()
  const b = new Date(end || start).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 1
  const mins = (b - a) / 60000
  // Cap runaway jobs; count at least 1 minute of work per run
  return Math.max(1, Math.min(120, mins))
}

/**
 * Full store analytics for support (install, usage, estimated working time).
 * Working minutes are estimated from scan/optimize job durations (no app session timer yet).
 */
export async function fetchShopDetail(pool, shop) {
  const base = await fetchShopStatus(pool, shop)
  if (!base) return null

  const [runs, indexNow, tickets, issues, optimize] = await Promise.all([
    pool.query(
      `
      SELECT kind, "startedAt", "finishedAt", status, meta
      FROM (
        SELECT 'image_scan' AS kind, "startedAt", "finishedAt", status,
               jsonb_build_object('productsScanned', "productsScanned", 'imagesScanned', "imagesScanned", 'issuesOpen', "issuesOpen") AS meta
        FROM "ImageScanRun" WHERE shop = $1
        UNION ALL
        SELECT 'link_scan', "startedAt", "finishedAt", status,
               jsonb_build_object('urlsChecked', "urlsChecked", 'brokenCount', "brokenCount")
        FROM "LinkScanRun" WHERE shop = $1
        UNION ALL
        SELECT 'image_optimize', "startedAt", "finishedAt", status,
               jsonb_build_object('imagesChecked', "imagesChecked", 'imagesOptimized', "imagesOptimized", 'bytesSaved', "bytesSaved")
        FROM "ImageOptimizeRun" WHERE shop = $1
      ) jobs
      ORDER BY "startedAt" DESC
      LIMIT 200
      `,
      [shop],
    ),
    pool.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE)::int AS today,
        COUNT(*) FILTER (WHERE status = 'success' OR status ILIKE 'success%')::int AS success
      FROM "IndexNowLog"
      WHERE shop = $1
      `,
      [shop],
    ),
    pool.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE)::int AS today,
        COUNT(*) FILTER (WHERE status = 'open' OR (reply IS NULL OR reply = ''))::int AS open,
        COUNT(*) FILTER (WHERE status = 'replied' OR (reply IS NOT NULL AND reply <> ''))::int AS replied
      FROM "SupportMessage"
      WHERE shop = $1
      `,
      [shop],
    ),
    pool.query(
      `
      SELECT
        COUNT(*)::int AS open_issues,
        COUNT(*) FILTER (WHERE "issueType" = 'MISSING_ALT')::int AS missing_alt,
        COUNT(*) FILTER (WHERE "issueType" = 'SHORT_ALT')::int AS short_alt,
        COUNT(*) FILTER (WHERE "issueType" = 'DUPLICATE_ALT')::int AS duplicate_alt
      FROM "ImageSeoIssue"
      WHERE shop = $1
      `,
      [shop],
    ),
    pool.query(
      `
      SELECT
        COALESCE(SUM("imagesOptimized"), 0)::int AS images_optimized,
        COALESCE(SUM("bytesSaved"), 0)::bigint AS bytes_saved,
        COUNT(*)::int AS runs
      FROM "ImageOptimizeRun"
      WHERE shop = $1 AND status = 'completed'
      `,
      [shop],
    ),
  ])

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  let workingMinutesToday = 0
  let workingMinutesTotal = 0
  let jobsToday = 0
  let jobsTotal = runs.rows.length
  const byKind = { image_scan: 0, link_scan: 0, image_optimize: 0 }

  for (const row of runs.rows) {
    const mins = minutesBetween(row.startedAt, row.finishedAt)
    workingMinutesTotal += mins
    byKind[row.kind] = (byKind[row.kind] || 0) + 1
    if (row.startedAt && new Date(row.startedAt) >= todayStart) {
      workingMinutesToday += mins
      jobsToday += 1
    }
  }

  const daysInstalled = base.installedOn
    ? Math.max(
        1,
        Math.ceil((Date.now() - new Date(base.installedOn).getTime()) / 86400000),
      )
    : null

  const indexRow = indexNow.rows[0] || {}
  const ticketRow = tickets.rows[0] || {}
  const issueRow = issues.rows[0] || {}
  const optRow = optimize.rows[0] || {}

  return {
    ...base,
    stats: {
      workingMinutesToday: Math.round(workingMinutesToday),
      workingMinutesTotal: Math.round(workingMinutesTotal),
      jobsToday,
      jobsTotal,
      jobsByType: byKind,
      daysInstalled,
      avgMinutesPerDay:
        daysInstalled && daysInstalled > 0
          ? Math.round((workingMinutesTotal / daysInstalled) * 10) / 10
          : 0,
      aiSeoUsed: base.aiSeoUsed,
      aiImageUsed: base.aiImageUsed,
      freeQuotaLimit: base.freeQuotaLimit,
      creditsUsed: base.aiSeoUsed + base.aiImageUsed,
      indexNowTotal: Number(indexRow.total || 0),
      indexNowToday: Number(indexRow.today || 0),
      indexNowSuccess: Number(indexRow.success || 0),
      supportTickets: Number(ticketRow.total || 0),
      supportTicketsToday: Number(ticketRow.today || 0),
      supportOpen: Number(ticketRow.open || 0),
      supportReplied: Number(ticketRow.replied || 0),
      imageIssuesOpen: Number(issueRow.open_issues || 0),
      missingAlt: Number(issueRow.missing_alt || 0),
      shortAlt: Number(issueRow.short_alt || 0),
      duplicateAlt: Number(issueRow.duplicate_alt || 0),
      imagesOptimized: Number(optRow.images_optimized || 0),
      bytesSaved: Number(optRow.bytes_saved || 0),
      optimizeRuns: Number(optRow.runs || 0),
      recentJobs: runs.rows.slice(0, 12).map((r) => ({
        kind: r.kind,
        status: r.status,
        startedAt: r.startedAt ? new Date(r.startedAt).toISOString() : null,
        finishedAt: r.finishedAt ? new Date(r.finishedAt).toISOString() : null,
        minutes: Math.round(minutesBetween(r.startedAt, r.finishedAt)),
        meta: r.meta,
      })),
    },
  }
}
