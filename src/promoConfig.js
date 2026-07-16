/** Public promo landing (logged-out) — edit here for images / YouTube. */
export const PROMO = {
  brand: 'SEO & Image Optimizer',
  siteUrl: 'https://seoi.in',
  headline: 'Shopify app to get more customers from search & better product pages',
  subhead:
    'AI product SEO and image tools for Shopify stores — optimize titles, descriptions, and ALT text so shoppers find you and convert more.',
  ctaLabel: 'Install on Shopify',
  ctaHref: 'https://apps.shopify.com/ai-product-descriptions-seo',
  /** Early-access offer — shown highlighted in the hero */
  offerEyebrow: 'Limited early access',
  offerTitle: 'First 200 stores',
  offerBody: 'Install now and lock in free premium access while spots last.',
  /** Right-side hero image (files live in public/promo/) */
  heroImage: '/promo/hero.png',
  /** YouTube watch or embed URL — set your real video here */
  youtubeUrl: 'https://youtu.be/r7CxEVY-ZjA',
  features: [
    {
      title: 'AI product SEO for Shopify',
      body: 'Generate titles, descriptions, and metadata that help customers find your products in search.',
      image: '/promo/feature-seo.png',
    },
    {
      title: 'AI ALT text for images',
      body: 'Write clear, searchable ALT text with AI so product images help shoppers and search engines.',
      image: '/promo/feature-alttext.png',
    },
    {
      title: 'AI product photos',
      body: 'Create studio-style product images and attach them fast — better visuals, more conversions.',
      image: '/promo/feature-image.png',
    },
    {
      title: 'Product Inventory',
      body: 'Track and manage product stock levels so you stay in sync and avoid selling out or overselling.',
      image: '/promo/feature-inventry.png',
    },
    {
      title: 'Deep image optimization',
      body: 'Optimize product images for speed and clarity so pages load faster and shoppers stay longer.',
      image: '/promo/feature-scan.png',
    },
    {
      title: 'Support 24×7',
      body: 'Get help anytime — our team is available around the clock so your store never waits on SEO or image issues.',
      image: '/promo/feature-support.png',
    },
  ],
}

/** Turn watch / share / embed URLs into an embeddable YouTube ID. */
export function youtubeEmbedSrc(url) {
  if (!url || !String(url).trim()) return null
  try {
    const u = new URL(url)
    let id = u.searchParams.get('v')
    if (!id && u.hostname.includes('youtu.be')) {
      id = u.pathname.replace(/^\//, '').split('/')[0]
    }
    if (!id && u.pathname.includes('/embed/')) {
      id = u.pathname.split('/embed/')[1]?.split('/')[0]
    }
    if (!id && u.pathname.includes('/shorts/')) {
      id = u.pathname.split('/shorts/')[1]?.split('/')[0]
    }
    if (!id || id === 'YOUR_VIDEO_ID') return null
    return `https://www.youtube.com/embed/${id}`
  } catch {
    return null
  }
}
