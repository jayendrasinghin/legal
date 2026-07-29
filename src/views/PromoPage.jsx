import { Link } from 'react-router-dom'
import heroFallback from '../assets/hero.png'
import { PROMO, youtubeEmbedSrc } from '../promoConfig.js'
import { SEO, setPageSeo, upsertJsonLd } from '../seo.js'
import { useEffect, useState } from 'react'

function FeatureCarousel({ slides }) {
  const [index, setIndex] = useState(0)
  const [broken, setBroken] = useState(false)
  const total = slides?.length || 0
  const slide = total ? slides[index] : null

  useEffect(() => {
    setBroken(false)
  }, [index])

  useEffect(() => {
    if (total < 2) return undefined
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, 6000)
    return () => clearInterval(id)
  }, [total])

  if (!slide) return null

  const go = (next) => {
    setIndex((i) => (i + next + total) % total)
  }

  return (
    <div className="promo-carousel" aria-roledescription="carousel">
      <div className="promo-carousel-stage">
        <div className="promo-carousel-copy">
          <p className="promo-carousel-count">
            Feature {index + 1} / {total}
          </p>
          <h3>{slide.title}</h3>
          <p>{slide.body}</p>
          <div className="promo-carousel-controls">
            <button
              type="button"
              className="promo-carousel-btn"
              onClick={() => go(-1)}
              aria-label="Previous feature"
            >
              ‹
            </button>
            <div className="promo-carousel-dots" role="tablist" aria-label="Feature slides">
              {slides.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={`promo-carousel-dot ${i === index ? 'active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${s.title}`}
                />
              ))}
            </div>
            <button
              type="button"
              className="promo-carousel-btn"
              onClick={() => go(1)}
              aria-label="Next feature"
            >
              ›
            </button>
          </div>
        </div>
        <div className="promo-carousel-media">
          <img
            key={slide.image}
            src={broken || !slide.image ? heroFallback : slide.image}
            alt={slide.title}
            className="promo-carousel-img"
            onError={() => setBroken(true)}
          />
        </div>
      </div>
    </div>
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
      name: 'AI SEO & PaySync',
      alternateName: [
        'Seoi AI SEO and PaySync',
        'PaySync PayPal Razorpay tracking sync',
      ],
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Shopify',
      url: SEO.origin + '/support',
      description: SEO.description,
      featureList: [
        'AI product SEO titles and descriptions',
        'Image ALT text and compression',
        'PaySync payment tags for Shopify orders',
        'PayPal tracking sync',
        'Razorpay order sync',
      ],
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
            <aside className="promo-offer" aria-label="Launch offer">
              <p className="promo-offer-eyebrow">{PROMO.offerEyebrow}</p>
              <p className="promo-offer-title">{PROMO.offerTitle}</p>
              <p className="promo-offer-body">{PROMO.offerBody}</p>
            </aside>
          ) : null}
          <div className="promo-hero-actions">
            <a className="promo-btn" href={PROMO.ctaHref} target="_blank" rel="noreferrer">
              {PROMO.ctaLabel}
            </a>
            {PROMO.ctaHrefSecondary ? (
              <a
                className="promo-btn ghost"
                href={PROMO.ctaHrefSecondary}
                target="_blank"
                rel="noreferrer"
              >
                {PROMO.ctaLabelSecondary || 'PaySync'}
              </a>
            ) : null}
          </div>
        </div>
        <div className="promo-hero-media">
          <img
            src={PROMO.heroImage || heroFallback}
            alt="AI SEO and PaySync Shopify app — product SEO plus PayPal and Razorpay tracking sync"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = heroFallback
            }}
          />
        </div>
      </section>

      <section id="features" className="promo-features">
        <h2>Features</h2>
        <FeatureCarousel slides={PROMO.features} />
      </section>

      <section id="video" className="promo-video">
        <h2>See the app in action</h2>
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
            understand the apps.
          </p>
        )}
      </section>

      <section className="promo-features" style={{ paddingTop: 0 }}>
        <h2>Install once — AI SEO + PayPal & Razorpay sync</h2>
        <p className="promo-section-sub">
          {PROMO.offerTitle
            ? `${PROMO.offerTitle}: ${PROMO.offerBody}`
            : 'One Shopify install for AI SEO, images, payment tags, and PayPal tracking.'}
        </p>
        <div className="promo-hero-actions">
          <a className="promo-btn" href={PROMO.ctaHref} target="_blank" rel="noreferrer">
            {PROMO.ctaLabel}
          </a>
        </div>
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
