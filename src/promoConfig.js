/** Public promo landing (logged-out) — edit here for images / YouTube. */
export const PROMO = {
  brand: 'AI SEO & PaySync',
  siteUrl: 'https://seoi.in',
  headline: 'AI SEO growth + PayPal & Razorpay tracking sync',
  subhead:
    'One Shopify app for AI product SEO (titles, ALT text, images) and PaySync — payment tags and tracking sync for PayPal & Razorpay. Not paid search / Google Ads.',
  ctaLabel: 'Install on Shopify',
  ctaHref: 'https://apps.shopify.com/ai-product-descriptions-seo',
  ctaLabelSecondary: '',
  ctaHrefSecondary: '',
  /** Launch offer — shown highlighted in the hero */
  offerEyebrow: 'Launch offer',
  offerTitle: '50% off yearly subscription',
  offerBody:
    'One plan unlocks AI SEO and PaySync (PayPal & Razorpay tracking). Go annual and save 50% — product SEO plus payment tracking sync in a single install.',
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
      title: 'AI SEO + PaySync (PayPal & Razorpay)',
      body: 'Two tools in one Shopify app: AI SEO for product titles, descriptions, and images — and PaySync for PayPal & Razorpay payment tags and tracking sync. Not PPC or Google Ads. Install once, run both.',
      image: '/promo/feature-1.png',
    },
    {
      title: 'AI SEO & product optimization',
      body: 'Optimize product titles, descriptions, images, and ALT text with AI — so shoppers find you in organic search and convert on the page. Stronger product pages mean more traffic and more sales.',
      image: '/promo/feature-2.png',
    },
    {
      title: 'AI product photos & optimize',
      body: 'Create studio-style images and optimize for speed — better visuals, faster pages, more conversions.',
      image: '/promo/feature-3.png',
    },
    {
      title: 'Payment tags & order sync',
      body: 'PaySync detects how each order was paid (PayPal, Razorpay, and more), adds clear Shopify tags, and keeps payment data synced — so your team can filter exceptions fast.',
      image: '/promo/feature-4.png',
    },
    {
      title: 'PayPal tracking sync',
      body: 'Send fulfillment tracking numbers to PayPal after you ship in Shopify — when the order is properly mapped. Payment tracking sync, not ad campaigns.',
      image: '/promo/feature-5.png',
    },
    {
      title: 'Support 24×7',
      body: 'Get help anytime for SEO, images, PayPal sync, or Razorpay sync — one app, one support team.',
      image: '/promo/feature-6.png',
    },
    {
      title: 'Two powerful tools. One smart suite.',
      body: 'AI SEO & Image Optimizer plus PaySync (PayPal & Razorpay tracking) — manage product SEO, images, and payment sync in one place. Yearly subscription 50% off, with 24×7 support.',
      image: '/promo/feature-7.png',
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
