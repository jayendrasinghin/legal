/** SEO defaults for the public promo / legal site (support.seoi.in). */
export const SEO = {
  siteName: 'AI SEO & PaySync',
  origin: 'https://support.seoi.in',
  appStoreUrl: 'https://apps.shopify.com/ai-product-descriptions-seo',
  title: 'AI SEO & PaySync for Shopify | One App for Search + Payments',
  description:
    'One Shopify app with AI SEO, image tools, payment tags, and PayPal tracking — grow from search and keep fulfillments in sync. 50% off yearly.',
  keywords:
    'Shopify AI SEO, PaySync, PayPal tracking, product SEO, image ALT text, Shopify payment tags, yearly discount',
  ogImage: 'https://support.seoi.in/favicon.ico',
}

export function setPageSeo({
  title = SEO.title,
  description = SEO.description,
  path = '/support',
  noindex = false,
} = {}) {
  const url = `${SEO.origin}${path}`
  document.title = title

  upsertMeta('name', 'description', description)
  upsertMeta('name', 'keywords', SEO.keywords)
  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
  upsertLink('canonical', url)

  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', SEO.siteName)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:image', SEO.ogImage)

  upsertMeta('name', 'twitter:card', 'summary')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
}

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function upsertJsonLd(id, data) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}
