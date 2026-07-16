/** SEO defaults for the public promo / legal site (support.seoi.in). */
export const SEO = {
  siteName: 'SEO & Image Optimizer',
  origin: 'https://support.seoi.in',
  appStoreUrl: 'https://apps.shopify.com/ai-product-descriptions-seo',
  title: 'Shopify SEO & Image Optimizer App | Get More Customers from Search',
  description:
    'Install the Shopify SEO & Image Optimizer app — AI product titles, descriptions, ALT text scan, and image tools to improve discoverability and conversions.',
  keywords:
    'Shopify SEO app, product SEO, AI product descriptions, image ALT text, Shopify image optimizer, increase Shopify sales',
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
