/** Public promo landing (logged-out) — edit here for images / YouTube. */
export const PROMO = {
  brand: 'AI SEO & PaySync',
  siteUrl: 'https://seoi.in',
  headline: 'One Shopify app for AI SEO growth and PayPal payment sync',
  subhead:
    'AI SEO, image tools, payment tags, and PayPal tracking — all in one app so you get found in search and keep fulfillments in sync.',
  ctaLabel: 'Install on Shopify',
  ctaHref: 'https://apps.shopify.com/ai-product-descriptions-seo',
  ctaLabelSecondary: '',
  ctaHrefSecondary: '',
  /** Launch offer — shown highlighted in the hero */
  offerEyebrow: 'Launch offer',
  offerTitle: '50% off yearly subscription',
  offerBody:
    'One plan unlocks AI SEO and PaySync together. Go annual and save 50% — search growth plus payment & PayPal tracking in a single install.',
  /** Right-side hero image (files live in public/promo/) — ?v= busts browser cache */
  heroImage: '/promo/hero.png?v=20260727',
  /** YouTube watch or embed URL — set your real video here */
  youtubeUrl: 'https://youtu.be/4rwsJt28rB0',
  /**
   * Feature carousel slides — one large image + title + body each.
   * Recommended image size: 1600 × 900 px (16:9), PNG or JPG.
   * Place files in public/promo/
   */
  features: [
    {
      title: 'AI SEO & PaySync',
      body: 'One Shopify app with two powerful tools: AI SEO to grow traffic from search, and PaySync to tag payments and sync tracking to PayPal. Install once, run both — titles, images, orders, and fulfillments in a single workflow.',
      image: '/promo/feature-1.png',
    },
    {
      title: 'AI SEO & product optimization',
      body: 'Optimize product titles, descriptions, images, and ALT text with AI — so shoppers find you in search and convert on the page. Stronger product pages mean more traffic and more sales.',
      image: '/promo/feature-2.png',
    },
    {
      title: 'AI product photos & optimize',
      body: 'Create studio-style images and optimize for speed — better visuals, faster pages, more conversions.',
      image: '/promo/feature-3.png',
    },
    {
      title: 'Payment tags & order sync',
      body: 'PaySync detects how each order was paid, adds clear Shopify tags, and keeps payment data synced — so your team can filter exceptions fast without opening every order.',
      image: '/promo/feature-4.png',
    },
    {
      title: 'PayPal tracking sync',
      body: 'Send fulfillment tracking to PayPal after you ship in Shopify — when the order is properly mapped.',
      image: '/promo/feature-5.png',
    },
    {
      title: 'Support 24×7',
      body: 'Get help anytime for SEO, images, payments, or PayPal sync — one app, one support team.',
      image: '/promo/feature-6.png',
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
