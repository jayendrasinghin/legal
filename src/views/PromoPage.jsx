import { Link } from 'react-router-dom'
import heroFallback from '../assets/hero.png'
import { PROMO, youtubeEmbedSrc } from '../promoConfig.js'
import { SEO, setPageSeo, upsertJsonLd } from '../seo.js'
import { useEffect, useState } from 'react'

function FeatureImage({ src, alt }) {
  const [broken, setBroken] = useState(false)
  if (broken || !src) {
    return <img src={heroFallback} alt={alt} className="promo-feature-img" />
  }
  return (
    <img
      src={src}
      alt={alt}
      className="promo-feature-img"
      onError={() => setBroken(true)}
    />
  )
}

/** Public promo page — staff login only at /support/admin (not linked here). */
export function PromoPage() {
  const embed = youtubeEmbedSrc(PROMO.youtubeUrl)

  useEffect(() => {
    setPageSeo({
      title: SEO.title,
      description: SEO.description,
      path: '/support',
    })
    upsertJsonLd('ld-software-app', {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: PROMO.brand,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Shopify',
      url: SEO.origin + '/support',
      description: SEO.description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      downloadUrl: PROMO.ctaHref,
      sameAs: [PROMO.ctaHref, PROMO.siteUrl],
    })
  }, [])

  return (
    <div className="promo-page">
      <header className="promo-nav">
        <div className="promo-nav-brand">
          <strong>{PROMO.brand}</strong>
          <span>seoi.in</span>
        </div>
        <nav>
          <a href="#features">Features</a>
          <a href="#video">Video</a>
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/help">Help</Link>
          <Link to="/faq">FAQ</Link>
        </nav>
      </header>

      <section className="promo-hero">
        <div className="promo-hero-copy">
          <p className="promo-kicker">{PROMO.brand}</p>
          <h1>{PROMO.headline}</h1>
          <p className="promo-lead">{PROMO.subhead}</p>
          {PROMO.offerTitle ? (
            <aside className="promo-offer" aria-label="Early access offer">
              <p className="promo-offer-eyebrow">{PROMO.offerEyebrow}</p>
              <p className="promo-offer-title">{PROMO.offerTitle}</p>
              <p className="promo-offer-body">{PROMO.offerBody}</p>
            </aside>
          ) : null}
          <div className="promo-hero-actions">
            <a className="promo-btn" href={PROMO.ctaHref} target="_blank" rel="noreferrer">
              {PROMO.ctaLabel}
            </a>
          </div>
        </div>
        <div className="promo-hero-media">
          <img
            src={PROMO.heroImage || heroFallback}
            alt="Shopify SEO and Image Optimizer app — AI product SEO preview"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = heroFallback
            }}
          />
        </div>
      </section>

      <section id="features" className="promo-features">
        <h2>Shopify SEO features that help you get more customers</h2>
        <p className="promo-section-sub">
          Built for Shopify merchants who want better search visibility, stronger product pages, and
          more conversions.
        </p>
        <div className="promo-feature-grid">
          {PROMO.features.map((f) => (
            <article key={f.title} className="promo-feature-card">
              <FeatureImage src={f.image} alt={f.title} />
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="video" className="promo-video">
        <h2>See the Shopify SEO app in action</h2>
        {embed ? (
          <div className="promo-video-frame">
            <iframe
              src={embed}
              title={`${PROMO.brand} demo on Shopify`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="promo-section-sub">
            Add your YouTube demo URL in <code>src/promoConfig.js</code> to help Google and shoppers
            understand the app.
          </p>
        )}
      </section>

      <section className="promo-features" style={{ paddingTop: 0 }}>
        <h2>Install free on the Shopify App Store</h2>
        <p className="promo-section-sub">
          {PROMO.offerTitle
            ? `${PROMO.offerTitle} — ${PROMO.offerBody} Free trial available on paid plans after.`
            : 'Start with the free plan, optimize product SEO with AI, and grow traffic from search. Free trial available on paid plans.'}
        </p>
        <a className="promo-btn" href={PROMO.ctaHref} target="_blank" rel="noreferrer">
          {PROMO.ctaLabel}
        </a>
      </section>

      <footer className="promo-footer">
        <span>{PROMO.brand}</span>
        <a href={PROMO.ctaHref} target="_blank" rel="noreferrer">
          Shopify App Store
        </a>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/help">Help</Link>
      </footer>
    </div>
  )
}
