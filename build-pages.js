/* ============================================================
   build-pages.js — Show Limousines static page generator.

   A one-off DEV tool (not a runtime build step — Vercel still
   serves the emitted .html directly). It holds the canonical
   header / mobile-nav / footer / section templates plus the
   per-page data, then:

     1. Emits every dropdown sub-page (services, fleet vehicles,
        locations, wedding sub-pages, blog, reviews, terms).
     2. Rewrites the shared <header>, mobile-nav and <footer>
        blocks in the 8 hand-authored pages so the dropdown nav
        and full footer stay byte-identical across the whole site.

   Run:  node build-pages.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const PHONE = '0422 023 413';
const TEL = '0422023413';
const EMAIL = 'info@showlimousines.com.au';

function esc(s) { return String(s).replace(/&(?!amp;|lt;|gt;|#)/g, '&amp;'); }

/* ---------- Navigation model (single source of truth) ---------- */
const NAV = [
  { key: 'home', label: 'Home', href: 'index.html' },
  { key: 'wedding', label: 'Wedding Limousines', href: 'wedding.html', sub: [
    { label: 'Wedding Car Hire Sydney', href: 'wedding-sydney.html' },
    { label: 'Wedding Car Hire Wollongong', href: 'wedding-wollongong.html' },
  ] },
  { key: 'services', label: 'Services', href: 'services.html', wide: true, sub: [
    { label: 'Airport Transfers', href: 'service-airport-transfers.html' },
    { label: 'Cruise Transfers', href: 'service-cruise-transfers.html' },
    { label: 'Birthday Limos', href: 'service-birthday-limos.html' },
    { label: 'Concert Transfers', href: 'service-concert-transfers.html' },
    { label: 'School Formal Limos', href: 'service-school-formals.html' },
    { label: 'Corporate Transfers', href: 'service-corporate-transfers.html' },
    { label: 'Party Limos', href: 'service-party-limos.html' },
    { label: "Hen's Party Limos", href: 'service-hens-party.html' },
  ] },
  { key: 'fleet', label: 'Fleet', href: 'fleet.html', wide: true, sub: [
    { label: 'Rolls Royce Phantom', href: 'fleet-rolls-royce-phantom.html' },
    { label: 'White Chrysler Super Stretch', href: 'fleet-chrysler-white.html' },
    { label: 'Black Chrysler Super Stretch', href: 'fleet-chrysler-black.html' },
    { label: 'Chrysler Black Edition', href: 'fleet-chrysler-black-edition.html' },
    { label: 'Chrysler Gullwing', href: 'fleet-chrysler-gullwing.html' },
    { label: 'Stretch Hummer (14 Pax)', href: 'fleet-hummer-14.html' },
    { label: 'Stretch Hummer (16 Pax)', href: 'fleet-hummer-16.html' },
    { label: 'Mercedes S Class AMG', href: 'fleet-mercedes-s-class.html' },
    { label: 'Mercedes Valente', href: 'fleet-mercedes-valente.html' },
    { label: 'Mercedes Sprinter Limo Van', href: 'fleet-mercedes-sprinter.html' },
    { label: 'VW Crafter Minibus', href: 'fleet-vw-crafter.html' },
  ] },
  { key: 'about', label: 'About Us', href: 'about.html', sub: [
    { label: 'Gallery', href: 'gallery.html' },
    { label: 'Blog', href: 'blog.html' },
    { label: 'Reviews', href: 'reviews.html' },
    { label: 'Terms & Conditions', href: 'terms.html' },
  ] },
  { key: 'locations', label: 'Locations', href: 'locations.html', wide: true, sub: [
    { label: 'Bankstown', href: 'location-bankstown.html' },
    { label: 'Campbelltown', href: 'location-campbelltown.html' },
    { label: 'Eastern Suburbs', href: 'location-eastern-suburbs.html' },
    { label: 'Inner West', href: 'location-inner-west.html' },
    { label: 'Liverpool', href: 'location-liverpool.html' },
    { label: 'Marrickville', href: 'location-marrickville.html' },
    { label: 'Northern Beaches', href: 'location-northern-beaches.html' },
    { label: 'Parramatta', href: 'location-parramatta.html' },
    { label: 'Penrith', href: 'location-penrith.html' },
    { label: 'Sutherland Shire', href: 'location-sutherland-shire.html' },
    { label: 'Wollongong', href: 'location-wollongong.html' },
  ] },
  { key: 'contact', label: 'Contact', href: 'contact.html' },
];

const ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';
const CARET = '<svg class="nav-pill-caret" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

/* ---------- Shared chrome builders ---------- */
function head(title, desc) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">

  <link rel="icon" type="image/png" href="favicon.png">
  <link rel="apple-touch-icon" href="favicon.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="https://unpkg.com/lenis@1.0.45/dist/lenis.min.js"></script>
  <script src="https://unpkg.com/split-type"></script>

  <link rel="stylesheet" href="styles.css">
</head>
<body>`;
}

function header(active, activeSub) {
  const pills = NAV.map(function (item) {
    const isActive = item.key === active;
    const cls = 'nav-pill' + (isActive ? ' is-active' : '');
    const cur = isActive && !activeSub ? ' aria-current="page"' : '';
    if (!item.sub) {
      return `          <a href="${item.href}" class="${cls}"${cur} role="menuitem">${esc(item.label)}</a>`;
    }
    const ddCls = 'nav-dropdown' + (item.wide ? ' nav-dropdown--wide' : '');
    const links = item.sub.map(function (s) {
      const sc = activeSub === s.href ? ' aria-current="page"' : '';
      return `              <a href="${s.href}"${sc} role="menuitem">${esc(s.label)}</a>`;
    }).join('\n');
    return `          <div class="nav-pill-group">
            <a href="${item.href}" class="${cls}"${cur} role="menuitem" aria-haspopup="true">${esc(item.label)} ${CARET}</a>
            <div class="${ddCls}" role="menu">
${links}
            </div>
          </div>`;
  }).join('\n');

  return `  <header class="nav-wrap" id="navWrap" role="banner">
    <div class="nav-announce" role="region" aria-label="Promotional banner">
      Sydney's Premier Limousine Service
      <span class="sep">·</span>
      Call <a href="tel:${TEL}">${PHONE}</a>
      <span class="sep">·</span>
      <a href="mailto:${EMAIL}">${EMAIL}</a>
    </div>
    <nav class="nav-main" role="navigation" aria-label="Primary">
      <div class="nav-inner">
        <a href="index.html" class="nav-brand" aria-label="Show Limousines — home">
          <img src="logo.png" alt="Show Limousines" class="nav-brand__logo" width="1514" height="443">
        </a>

        <div class="nav-pills" role="menubar">
${pills}
        </div>

        <div class="nav-right">
          <a href="contact.html#quote" class="btn-pill btn-pill--gold">
            Get a Quote
            <span class="btn-pill__arrow" aria-hidden="true">
              ${ARROW}
            </span>
          </a>
          <button class="nav-burger" id="navBurger" aria-label="Open menu" aria-controls="navMobile" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  </header>`;
}

function mobileNav(active, activeSub) {
  const items = NAV.map(function (item) {
    const cur = item.key === active && !activeSub ? ' aria-current="page"' : '';
    if (!item.sub) {
      return `    <a href="${item.href}"${cur}>${esc(item.label)}</a>`;
    }
    const subs = item.sub.map(function (s) {
      const sc = activeSub === s.href ? ' aria-current="page"' : '';
      return `        <a href="${s.href}"${sc}>${esc(s.label)}</a>`;
    }).join('\n');
    const openCls = item.key === active ? ' is-open' : '';
    return `    <div class="nav-mobile__group${openCls}">
      <div class="nav-mobile__grouptop">
        <a href="${item.href}"${cur}>${esc(item.label)}</a>
        <button class="nav-mobile__caret" aria-label="Toggle ${esc(item.label)} submenu" aria-expanded="${item.key === active ? 'true' : 'false'}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>
      <div class="nav-mobile__sub">
${subs}
      </div>
    </div>`;
  }).join('\n');

  return `  <div class="nav-mobile" id="navMobile" aria-hidden="true">
${items}
    <a href="tel:${TEL}">Call ${PHONE}</a>
    <a href="mailto:${EMAIL}">${EMAIL}</a>
    <div class="nav-mobile__cta">
      <a href="contact.html#quote" class="btn-pill btn-pill--gold">
        Get a Free Quote
        <span class="btn-pill__arrow" aria-hidden="true">
          ${ARROW}
        </span>
      </a>
    </div>
  </div>`;
}

/* Footer service/location/fleet columns now link to the real sub-pages. */
function footColLinks(items) {
  return items.map(function (s) { return `              <li><a href="${s.href}">${esc(s.label)}</a></li>`; }).join('\n');
}
function footer() {
  const services = NAV.find(function (n) { return n.key === 'services'; }).sub;
  const locations = NAV.find(function (n) { return n.key === 'locations'; }).sub;
  const fleet = NAV.find(function (n) { return n.key === 'fleet'; }).sub.slice(0, 8);
  return `    <footer class="foot" aria-labelledby="footHeading">
      <div class="beam" aria-hidden="true"></div>
      <h2 class="visually-hidden" id="footHeading">Site footer</h2>
      <div class="foot__inner">

        <!-- Prominent contact block -->
        <div class="foot__contact">
          <div>
            <p class="foot__contact-head">Ready when you are.</p>
            <p class="foot__contact-sub">Call us direct, drop us an email or fill out the quote form above. We reply within the hour, 24 hours a day.</p>
            <div class="foot__socials" aria-label="Social links">
              <a href="https://www.facebook.com/showlimousines/" target="_blank" rel="noopener noreferrer" class="foot__social" aria-label="Show Limousines on Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
              <a href="https://www.instagram.com/showlimousines/" target="_blank" rel="noopener noreferrer" class="foot__social" aria-label="Show Limousines on Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
              </a>
            </div>
          </div>
          <div class="foot__contact-info">
            <div class="foot__contact-row">
              <span class="foot__contact-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </span>
              <div>
                <span class="foot__contact-label">Phone</span>
                <a href="tel:${TEL}" class="foot__contact-value">${PHONE}</a>
              </div>
            </div>
            <div class="foot__contact-row">
              <span class="foot__contact-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
              </span>
              <div>
                <span class="foot__contact-label">Email</span>
                <a href="mailto:${EMAIL}" class="foot__contact-value">${EMAIL}</a>
              </div>
            </div>
          </div>
        </div>

        <div class="foot__top">
          <div class="foot__brand-wrap">
            <div class="foot__brand">
              <img src="logo.png" alt="Show Limousines" class="foot__brand-logo" width="1514" height="443">
            </div>
            <p class="foot__tag">Sydney's premier chauffeur-driven limousines. Weddings, formals, corporate and special occasions across Sydney &amp; Wollongong.</p>
          </div>

          <form class="foot__sub" id="footSubForm" onsubmit="return false;">
            <label class="foot__sub-label" for="footEmail">Get exclusive offers</label>
            <div class="foot__sub-form">
              <input class="foot__sub-input" type="email" id="footEmail" name="email" placeholder="your@email.com" required aria-label="Email address">
              <button class="foot__sub-btn" type="submit">Subscribe</button>
            </div>
            <span class="foot__sub-note" id="footSubNote">Wedding tips, fleet news, occasional offers. No spam.</span>
          </form>
        </div>

        <div class="foot__divider" aria-hidden="true"></div>

        <div class="foot__grid">

          <nav class="foot-col" aria-labelledby="footLinks">
            <h3 class="foot-col__title" id="footLinks">Links</h3>
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="fleet.html">Our Vehicles</a></li>
              <li><a href="services.html">Limo Hire</a></li>
              <li><a href="about.html">About Us</a></li>
              <li><a href="reviews.html">Reviews</a></li>
              <li><a href="contact.html#quote">Contact</a></li>
              <li><a href="terms.html">Terms &amp; Conditions</a></li>
            </ul>
          </nav>

          <nav class="foot-col" aria-labelledby="footServices">
            <h3 class="foot-col__title" id="footServices">Services</h3>
            <ul>
${footColLinks(services)}
            </ul>
          </nav>

          <nav class="foot-col" aria-labelledby="footLocations">
            <h3 class="foot-col__title" id="footLocations">Locations</h3>
            <ul>
${footColLinks(locations)}
            </ul>
          </nav>

          <nav class="foot-col" aria-labelledby="footFleet">
            <h3 class="foot-col__title" id="footFleet">Fleet</h3>
            <ul>
${footColLinks(fleet)}
            </ul>
          </nav>

        </div>

        <div class="foot__bottom">
          <div>
            &copy; 2026 Show Limousines<span class="sep">·</span>ABN 51 149 228 357
          </div>
          <div>
            <a href="mailto:${EMAIL}">${EMAIL}</a>
            <span class="sep">·</span>
            <a href="tel:${TEL}">${PHONE}</a>
          </div>
          <div class="foot__credit">
            Powered by <a href="https://awlabs.com.au" target="_blank" rel="noopener noreferrer">All Webbed Labs</a>
          </div>
        </div>

      </div>
    </footer>`;
}

const FOOT_SCRIPT = `  <script src="main.js"></script>
</body>
</html>`;

/* ---------- Section builders ---------- */
function pageHero(label, title, sub) {
  return `    <section class="page-hero" aria-label="${esc(title)}">
      <div class="page-hero__inner reveal">
        <span class="label-bracket">${esc(label)}</span>
        <h1 class="page-hero__title">${esc(title)}</h1>
        <p class="page-hero__sub">${esc(sub)}</p>
      </div>
    </section>`;
}

function feature(label, title, paras, bullets, image, alt, ctaText, ctaHref, flip) {
  const p = paras.map(function (x) { return `          <p>${esc(x)}</p>`; }).join('\n');
  const li = bullets.map(function (x) { return `            <li>${esc(x)}</li>`; }).join('\n');
  const copy = `        <div class="feature__copy reveal">
          <span class="label-bracket">${esc(label)}</span>
          <h2 class="feature__title">${esc(title)}</h2>
${p}
          <ul class="feature__list">
${li}
          </ul>
          <a href="${ctaHref}" class="btn-pill btn-pill--gold">
            ${esc(ctaText)}
            <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span>
          </a>
        </div>`;
  const media = `        <div class="feature__media reveal">
          <img src="${image}" alt="${esc(alt)}" loading="lazy" decoding="async">
        </div>`;
  const inner = flip ? media + '\n' + copy : copy + '\n' + media;
  return `    <section class="feature">
      <div class="feature__inner">
${inner}
      </div>
    </section>`;
}

function homeCta() {
  return `    <section class="home-cta">
      <div class="home-cta__inner reveal">
        <span class="label-bracket">Show Limousines</span>
        <h2 class="home-cta__title">Sydney &amp; Wollongong's premier chauffeured limousines</h2>
        <p class="home-cta__body">From weddings and formals to airport transfers and a night on the town — our immaculately presented fleet and professional chauffeurs make every arrival unforgettable.</p>
        <div class="home-cta__actions">
          <a href="contact.html#quote" class="btn-pill btn-pill--gold">
            Get a Quote
            <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span>
          </a>
          <a href="fleet.html" class="btn-outline-sm">View the Fleet</a>
        </div>
      </div>
    </section>`;
}

const VEHICLES = [
  { slug: 'fleet-rolls-royce-phantom', label: 'Rolls Royce Phantom', brand: 'Rolls Royce', model: 'Phantom Sedan', img: 'fleet-rolls-royce-phantom-v2.jpg', badge: 'Sedan', pax: 4, ideal: 'The wedding choice', alt: 'Rolls Royce Phantom Sedan' },
  { slug: 'fleet-chrysler-white', label: 'White Chrysler Super Stretch', brand: 'Chrysler', model: 'Super Stretch (White)', img: 'fleet-chrysler-white-v2.jpg', badge: 'Stretch', pax: 10, ideal: 'The classic', alt: 'White Chrysler Super Stretch limousine' },
  { slug: 'fleet-chrysler-black', label: 'Black Chrysler Super Stretch', brand: 'Chrysler', model: 'Super Stretch (Black)', img: 'fleet-chrysler-black-v2.jpg', badge: 'Stretch', pax: 10, ideal: 'The corporate', alt: 'Black Chrysler Super Stretch limousine' },
  { slug: 'fleet-chrysler-black-edition', label: 'Chrysler Black Edition', brand: 'Chrysler', model: 'Super Stretch "Black Edition"', img: 'fleet-chrysler-black-edition-v2.jpg', badge: 'Stretch', pax: 10, ideal: 'The all-night party', alt: 'Chrysler Super Stretch Black Edition limousine' },
  { slug: 'fleet-chrysler-gullwing', label: 'Chrysler Gullwing', brand: 'Chrysler', model: 'Super Stretch Gullwing', img: 'fleet-chrysler-gullwing-v2.jpg', badge: 'Gullwing', pax: 10, ideal: 'The showstopper', alt: 'Chrysler Gullwing Stretch limousine' },
  { slug: 'fleet-hummer-14', label: 'Stretch Hummer (14 Pax)', brand: 'Hummer', model: 'H2 Stretch (14 Pax)', img: 'fleet-hummer-green-v2.jpg', badge: 'Hummer', pax: 14, ideal: 'The group classic', alt: 'Green Hummer H2 Stretch limousine' },
  { slug: 'fleet-hummer-16', label: 'Stretch Hummer (16 Pax)', brand: 'Hummer', model: 'H2 Stretch (16 Pax)', img: 'fleet-hummer-white-v2.jpg', badge: 'Hummer', pax: 16, ideal: 'The full house', alt: 'White Hummer H2 Stretch limousine' },
  { slug: 'fleet-mercedes-s-class', label: 'Mercedes S Class AMG', brand: 'Mercedes', model: 'S Class AMG Sedan', img: 'fleet-mercedes-s-class-v2.jpg', badge: 'Sedan', pax: 4, ideal: 'The executive', alt: 'Mercedes S Class AMG Sedan' },
  { slug: 'fleet-mercedes-valente', label: 'Mercedes Valente', brand: 'Mercedes', model: 'Valente Luxury Minivan', img: 'fleet-mercedes-valente-v2.jpg', badge: 'Minivan', pax: 7, ideal: 'The intimate group', alt: 'Mercedes Valente Luxury Minivan' },
  { slug: 'fleet-mercedes-sprinter', label: 'Mercedes Sprinter Limo Van', brand: 'Mercedes', model: 'Sprinter Limo Van', img: 'fleet-mercedes-sprinter-v2.jpg', badge: 'Limo Van', pax: 14, ideal: 'The party', alt: 'Mercedes Sprinter Limo Van' },
  { slug: 'fleet-vw-crafter', label: 'VW Crafter Minibus', brand: 'Volkswagen', model: 'Crafter Premium Minibus', img: 'fleet-vw-crafter-v2.jpg', badge: 'Minibus', pax: 11, ideal: 'The full crew', alt: 'Volkswagen Crafter Premium Minibus' },
];
const VMAP = {}; VEHICLES.forEach(function (v) { VMAP[v.slug] = v; });

function fleetCard(v) {
  return `          <article class="fleet-card reveal">
            <div class="fleet-card__media">
              <img class="fleet-card__img" src="${v.img}" alt="${esc(v.alt)}" loading="lazy" decoding="async">
              <span class="fleet-card__badge">${esc(v.badge)}</span>
            </div>
            <div class="fleet-card__body">
              <span class="fleet-card__brand">${esc(v.brand)}</span>
              <span class="fleet-card__model">${esc(v.model)}</span>
              <span class="fleet-card__capacity">Up to ${v.pax} passengers · ${esc(v.ideal)}</span>
              <div class="fleet-card__footer">
                <a href="${v.slug}.html" class="btn-outline-sm">View Details</a>
              </div>
            </div>
          </article>`;
}
function fleetStrip(heading, intro, slugs) {
  const cards = slugs.map(function (s) { return fleetCard(VMAP[s]); }).join('\n\n');
  return `    <section class="fleet" aria-labelledby="fleetStripHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="fleet__inner">
        <div class="fleet__header reveal">
          <div>
            <span class="label-bracket">Our Fleet</span>
            <h2 class="fleet__heading" id="fleetStripHeading">${esc(heading)}</h2>
          </div>
          <p class="fleet__intro">${esc(intro)}</p>
        </div>
        <div class="fleet__grid">
${cards}
        </div>
        <a href="fleet.html" class="fleet__viewall">
          View Full Fleet
          <span class="arrow" aria-hidden="true">${ARROW}</span>
        </a>
      </div>
    </section>`;
}

/* Reusable testimonial carousel + FAQ (verbatim copy from existing pages). */
const TESTIMONIALS = `    <section class="testi" id="testimonials" aria-labelledby="testiHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="testi__inner">
        <div class="testi__header reveal">
          <span class="label-bracket">Customer Testimonials</span>
          <h2 class="testi__heading" id="testiHeading">What our clients say.</h2>
        </div>

        <div class="testi__grid">
          <div class="testi__media reveal" aria-hidden="true">
            <span class="testi__media-icon">"</span>
            <div class="testi__media-mark"><span>Trusted by</span>160+ Sydney clients</div>
          </div>

          <article class="testi__card reveal" aria-live="polite" aria-atomic="true">
            <div class="testi__quote-mark" aria-hidden="true">"</div>
            <div class="testi__slides" id="testiSlides">

              <div class="testi__slide is-active" data-slide="0">
                <p class="testi__quote">Fantastic experience! Mick was great to deal with. The vehicle used on the day not only looked amazing, but the driver was on time and was friendly with the entire bridal party.</p>
                <div class="testi__attr">
                  <div class="testi__name">Daniel Keenahan</div>
                  <div class="testi__meta">Wedding · Google Review</div>
                  <div class="testi__stars" aria-label="Rated 5 out of 5 stars">★★★★★</div>
                </div>
              </div>

              <div class="testi__slide" data-slide="1">
                <p class="testi__quote">I recently used Show Limousine Hire and was thoroughly impressed by their service. Mick was highly professional and punctual, making the entire experience smooth and stress-free. The vehicle was immaculate, comfortable, and clearly well-maintained. It added a real touch of class to the occasion.</p>
                <div class="testi__attr">
                  <div class="testi__name">Elena Pace</div>
                  <div class="testi__meta">Special Event · Google Review</div>
                  <div class="testi__stars" aria-label="Rated 5 out of 5 stars">★★★★★</div>
                </div>
              </div>

              <div class="testi__slide" data-slide="2">
                <p class="testi__quote">We couldn't recommend Show Limousines more for wedding transport. They handled both our bridal party pick-up and our getaway car at the end of the night, and everything ran absolutely seamlessly.</p>
                <div class="testi__attr">
                  <div class="testi__name">Kaelee</div>
                  <div class="testi__meta">Wedding · Google Review</div>
                  <div class="testi__stars" aria-label="Rated 5 out of 5 stars">★★★★★</div>
                </div>
              </div>

              <div class="testi__slide" data-slide="3">
                <p class="testi__quote">I had Mick and his team provide the transport for my wedding and we were extremely happy with absolutely everything. From the time of booking up to the wedding day, Mick was always happy to help with any questions and always replied very quickly.</p>
                <div class="testi__attr">
                  <div class="testi__name">Matikka Ismail</div>
                  <div class="testi__meta">Wedding · Google Review</div>
                  <div class="testi__stars" aria-label="Rated 5 out of 5 stars">★★★★★</div>
                </div>
              </div>

              <div class="testi__slide" data-slide="4">
                <p class="testi__quote">Hired a stretched Hummer for a surprise 70th. My grandkids aged 3 to 13 thought they were rockstars. Show Limousines are a very professional company and I have no hesitation in recommending them.</p>
                <div class="testi__attr">
                  <div class="testi__name">Theo Dechaufepie</div>
                  <div class="testi__meta">Birthday · Google Review</div>
                  <div class="testi__stars" aria-label="Rated 5 out of 5 stars">★★★★★</div>
                </div>
              </div>

            </div>

            <div class="testi__nav">
              <button class="testi__nav-btn" id="testiPrev" aria-label="Previous testimonial">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <button class="testi__nav-btn" id="testiNext" aria-label="Next testimonial">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <span class="testi__counter"><strong id="testiCur">01</strong> / 05</span>
            </div>
          </article>
        </div>

        <a href="https://www.google.com/search?q=Show+Limousines+Sydney+reviews" target="_blank" rel="noopener noreferrer" class="testi__viewall">
          All Google Reviews
          <span class="arrow" aria-hidden="true">${ARROW}</span>
        </a>
      </div>
    </section>`;

const FAQ_ITEMS = [
  ['How much does it cost to hire a limousine?', "The costs involved to hire a limo will vary depending on the vehicle, location, and pick up/drop off requirements. Most limousine hire companies will charge by the hour. At Show Limousines, all of our limousine hire services start at $399 per booking. For a more accurate quote, get in touch with our team and we'll send it over via email."],
  ["What's included when I book a limo?", 'For all transfers and events, we include a uniformed chauffeur, bottled water, and a luxurious modern vehicle. For weddings, we roll out the red carpet for the bride, the cars are laced with satin ribbon and sparkling wine. Each car is fitted with air conditioning, bluetooth, drink holders, party lights, and comfortable, luxurious seating.'],
  ['How far in advance do I need to book?', 'We recommend booking as far in advance as possible! Particularly for an event or special occasion, as we want to ensure that you get the right vehicle and can secure the date of the event. For weddings, we get bookings a year in advance. That being said, we do take on last-minute bookings and will always do our best to accommodate requests.'],
  ['How many people can fit into a limo?', 'That depends on the vehicle chosen! For our stretch limousines and hummer limousines, we can fit up to 16 guests in one car. For smaller parties, we can seat 4 to 8 passengers. For weddings, we offer car packages where you can hire multiple cars for the big day.'],
];
function faq(items) {
  const list = (items || FAQ_ITEMS).map(function (it) {
    return `          <div class="faq-item reveal">
            <div class="faq-item__top" role="button" tabindex="0" aria-expanded="false">
              <h3 class="faq-item__q">${esc(it[0])}</h3>
              <span class="faq-item__arrow" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              </span>
            </div>
            <div class="faq-item__panel">
              <p class="faq-item__a">${esc(it[1])}</p>
            </div>
          </div>`;
  }).join('\n\n');
  return `    <section class="faq" id="faq" aria-labelledby="faqHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="faq__inner">
        <div class="faq__header reveal">
          <span class="label-bracket">FAQs</span>
          <h2 class="faq__heading" id="faqHeading">Common questions, answered.</h2>
        </div>
        <div class="faq__list">
${list}
        </div>
      </div>
    </section>`;
}

/* ---------- writeFile helper ---------- */
const written = [];
function write(name, parts) {
  const html = parts.join('\n') + '\n';
  fs.writeFileSync(path.join(ROOT, name), html, 'utf8');
  written.push(name);
}

/* ============================================================
   SERVICE PAGES
   ============================================================ */
const SERVICES = [
  { slug: 'service-airport-transfers', nav: 'Airport Transfers', label: 'Airport Transfers',
    h1: 'Airport transfers, done in style.', heroSub: 'Reliable chauffeured airport transfers across Sydney and Wollongong — on time, every time, with luggage taken care of.',
    img: 'gallery-05.jpg', alt: 'Luxury limousine airport transfer',
    fTitle: 'Stress-free travel from door to terminal.',
    paras: ['Skip the parking, the queues and the last-minute scramble. Show Limousines provides punctual, chauffeur-driven airport transfers to and from Sydney Airport and beyond — so you arrive relaxed and on schedule.', 'Whether it is a solo executive run or the whole family heading off on holiday, our uniformed chauffeurs track your flight, help with the bags and get you there with time to spare.'],
    bullets: ['Domestic & international terminals', 'Flight monitoring & meet-and-greet', 'Help with luggage', 'Available 24/7, 365 days a year'],
    vehicles: ['fleet-mercedes-s-class', 'fleet-mercedes-valente', 'fleet-vw-crafter'],
    stripHeading: 'Vehicles for your transfer.', stripIntro: 'From an executive sedan for one to a premium minibus for the whole group.' },
  { slug: 'service-cruise-transfers', nav: 'Cruise Transfers', label: 'Cruise Transfers',
    h1: 'Cruise transfers in comfort.', heroSub: 'Door-to-pier chauffeured transfers to the Overseas Passenger Terminal and White Bay — start the holiday the moment you step in.',
    img: 'gallery-07.jpg', alt: 'Limousine cruise terminal transfer',
    fTitle: 'Door-to-pier in total comfort.',
    paras: ['Begin and end your cruise the relaxed way. Show Limousines runs smooth, chauffeur-driven transfers to and from Sydney’s cruise terminals — Circular Quay’s Overseas Passenger Terminal and White Bay — with plenty of room for the whole group and their luggage.', 'We time every pick-up around your boarding and disembarkation, so there is no rushing and no waiting around at the wharf.'],
    bullets: ['Overseas Passenger Terminal & White Bay', 'Generous luggage space', 'Group & family transfers', 'Punctual, uniformed chauffeurs'],
    vehicles: ['fleet-vw-crafter', 'fleet-mercedes-sprinter', 'fleet-mercedes-valente'],
    stripHeading: 'Room for the whole group.', stripIntro: 'Premium minibuses and limo vans with space for passengers and luggage alike.' },
  { slug: 'service-birthday-limos', nav: 'Birthday Limos', label: 'Birthday Limos',
    h1: 'Birthdays worth celebrating.', heroSub: 'Turn any birthday into an event with a chauffeured limousine — party lights, sound and a red-carpet arrival.',
    img: 'gallery-09.jpg', alt: 'Birthday celebration limousine hire',
    fTitle: 'Because you deserve it.',
    paras: ['From milestone birthdays to surprise nights out, a Show Limousines hire makes the day feel like an occasion. Our stretch limousines and Hummers come fitted with party lighting, premium sound and comfortable lounge seating for the whole crew.', 'Tell us the plan — dinner, drinks, a show or all three — and your chauffeur will handle the run sheet so you can simply enjoy the night.'],
    bullets: ['Party lighting & premium sound', 'Up to 16 passengers', 'Multiple-stop run sheets', 'Red-carpet arrivals'],
    vehicles: ['fleet-hummer-16', 'fleet-chrysler-black-edition', 'fleet-mercedes-sprinter'],
    stripHeading: 'Make an entrance.', stripIntro: 'Stretch limousines and party vans built for a night to remember.' },
  { slug: 'service-concert-transfers', nav: 'Concert Transfers', label: 'Concert Transfers',
    h1: 'Concert transfers without the hassle.', heroSub: 'Skip the parking and the surge pricing — arrive at the show in style and get home safely afterwards.',
    img: 'gallery-10.jpg', alt: 'Concert and event limousine transfer',
    fTitle: 'Arrive to the show in style.',
    paras: ['Heading to a concert, festival or the footy? Show Limousines gets you door-to-door without the parking headaches, the post-show queues or the long walk back to the car.', 'Your chauffeur drops you right at the gate and is ready when the encore ends — keeping the group together and the night running smoothly.'],
    bullets: ['Drop-off close to the venue', 'No parking or surge pricing', 'Safe ride home after the show', 'Groups of up to 16'],
    vehicles: ['fleet-hummer-14', 'fleet-chrysler-white', 'fleet-vw-crafter'],
    stripHeading: 'Get the group there together.', stripIntro: 'Stretch limousines and minibuses that keep everyone moving as one.' },
  { slug: 'service-school-formals', nav: 'School Formal Limos', label: 'School Formals',
    h1: 'School formals to remember.', heroSub: 'Safe, supervised, picture-perfect formal transport — arrive with your crew like royalty.',
    img: 'gallery-06.jpg', alt: 'School formal limousine hire',
    fTitle: 'Arrive like royalty with your crew.',
    paras: ['Your formal only happens once. Show Limousines provides safe, reliable and seriously stylish formal transport — with experienced chauffeurs parents can trust and vehicles that make the perfect backdrop for photos.', 'Gather the group, pick your car and we’ll handle the timing, the route and the grand red-carpet arrival at the venue.'],
    bullets: ['Experienced, vetted chauffeurs', 'Photo-perfect arrivals', 'Group packages available', 'Parents’ peace of mind'],
    vehicles: ['fleet-chrysler-white', 'fleet-chrysler-gullwing', 'fleet-hummer-16'],
    stripHeading: 'Pick your formal ride.', stripIntro: 'Show-stopping stretch limousines and Hummers for the whole formal group.' },
  { slug: 'service-corporate-transfers', nav: 'Corporate Transfers', label: 'Corporate Transfers',
    h1: 'Corporate travel that impresses.', heroSub: 'Discreet, punctual chauffeur service for executives, clients and events — first impressions that matter.',
    img: 'gallery-08.jpg', alt: 'Corporate chauffeur limousine transfer',
    fTitle: 'First impressions that matter.',
    paras: ['Whether you are collecting an important client, running a roadshow or moving a team between meetings, Show Limousines delivers a polished, dependable corporate transfer service across Sydney and Wollongong.', 'Expect immaculate vehicles, uniformed chauffeurs and discreet, on-time service — with account options available for regular bookings.'],
    bullets: ['Executive sedans & people movers', 'Discreet, professional chauffeurs', 'Airport & roadshow runs', 'Accounts for regular travel'],
    vehicles: ['fleet-mercedes-s-class', 'fleet-rolls-royce-phantom', 'fleet-mercedes-valente'],
    stripHeading: 'Travel like the boardroom expects.', stripIntro: 'Executive sedans and luxury people movers for business travel.' },
  { slug: 'service-party-limos', nav: 'Party Limos', label: 'Party Limos',
    h1: 'The party starts in the car.', heroSub: 'Stretch limousines and party vans with lights, sound and room for the whole crew — one unforgettable ride.',
    img: 'gallery-11.jpg', alt: 'Party limousine and party bus hire',
    fTitle: 'The whole crew, one unforgettable ride.',
    paras: ['Why wait until you arrive? Show Limousines turns the journey into part of the celebration with party lighting, premium sound systems and lounge seating for up to 16 guests.', 'Whatever the occasion — a big night out, a celebration or just because — your chauffeur keeps the night rolling from stop to stop.'],
    bullets: ['Up to 16 passengers', 'Party lights & premium sound', 'Multiple stops, one chauffeur', 'Red-carpet service'],
    vehicles: ['fleet-hummer-16', 'fleet-mercedes-sprinter', 'fleet-chrysler-black-edition'],
    stripHeading: 'Pick your party machine.', stripIntro: 'The biggest, boldest vehicles in the fleet — built for a crowd.' },
  { slug: 'service-hens-party', nav: "Hen's Party Limos", label: "Hen's & Buck's Parties",
    h1: "Hen's & buck's parties, sorted.", heroSub: 'Kick off the celebration in style with a chauffeured limousine for the whole party — the big night out, handled.',
    img: 'gallery-04.jpg', alt: "Hen's party limousine hire",
    fTitle: 'The big night out, sorted.',
    paras: ['Send them off in style. Show Limousines makes hen’s and buck’s nights effortless — a chauffeured limousine that keeps the group together, the drinks flowing and the night running from venue to venue.', 'Lights, sound and lounge seating set the mood, while your chauffeur takes care of the route so nobody has to worry about driving.'],
    bullets: ['Keep the whole group together', 'Venue-to-venue run sheets', 'Party lights & sound', 'Safe ride all night'],
    vehicles: ['fleet-chrysler-black-edition', 'fleet-hummer-14', 'fleet-chrysler-gullwing'],
    stripHeading: 'Choose your ride for the night.', stripIntro: 'Stretch limousines and Hummers built for celebrating in style.' },
];

SERVICES.forEach(function (s) {
  write(s.slug + '.html', [
    head('Limo Hire — ' + s.label + ' Sydney | Show Limousines', s.heroSub + ' Call ' + PHONE + '.'),
    header('services', s.slug + '.html'),
    mobileNav('services', s.slug + '.html'),
    '  <main>',
    pageHero('Services · ' + s.nav, s.h1, s.heroSub),
    feature(s.label, s.fTitle, s.paras, s.bullets, s.img, s.alt, 'Get a Free Quote', 'contact.html#quote', false),
    fleetStrip(s.stripHeading, s.stripIntro, s.vehicles),
    faq(),
    homeCta(),
    '  </main>',
    footer(),
    FOOT_SCRIPT,
  ]);
});

/* ============================================================
   FLEET VEHICLE PAGES
   ============================================================ */
VEHICLES.forEach(function (v) {
  const others = VEHICLES.filter(function (x) { return x.slug !== v.slug; }).slice(0, 3).map(function (x) { return x.slug; });
  const paras = [
    'The ' + v.model + ' is one of eleven hand-selected vehicles in the Show Limousines fleet — immaculately maintained, professionally chauffeured and ready for weddings, formals, transfers and special occasions across Sydney and Wollongong.',
    'Seating up to ' + v.pax + ' passengers, it pairs ' + (v.pax <= 4 ? 'refined luxury and comfort' : 'genuine presence with lounge-style comfort') + ' — air conditioning, premium sound and that unmistakable Show Limousines finish.',
  ];
  const bullets = ['Seats up to ' + v.pax + ' passengers', v.ideal, 'Air conditioning, bluetooth & premium sound', 'Uniformed, professional chauffeur'];
  write(v.slug + '.html', [
    head(v.label + ' Hire Sydney | Show Limousines', 'Hire the ' + v.model + ' (' + v.brand + ') with Show Limousines — seats up to ' + v.pax + ' passengers. Weddings, formals & events across Sydney & Wollongong. Call ' + PHONE + '.'),
    header('fleet', v.slug + '.html'),
    mobileNav('fleet', v.slug + '.html'),
    '  <main>',
    pageHero('Fleet · ' + v.brand, v.label, 'Up to ' + v.pax + ' passengers · ' + v.ideal + '. Chauffeur-driven across Sydney & Wollongong.'),
    feature(v.brand + ' · ' + v.badge, v.model, paras, bullets, v.img, v.alt, 'Enquire about this vehicle', 'contact.html#quote', true),
    fleetStrip('More from our fleet.', 'Eleven vehicles in total — here are a few more you might like.', others),
    homeCta(),
    '  </main>',
    footer(),
    FOOT_SCRIPT,
  ]);
});

/* ============================================================
   LOCATION PAGES
   ============================================================ */
const LOCATIONS = [
  { slug: 'location-bankstown', name: 'Bankstown', blurb: 'south-western Sydney', img: 'gallery-02.jpg' },
  { slug: 'location-campbelltown', name: 'Campbelltown', blurb: "Sydney's Macarthur region", img: 'gallery-03.jpg' },
  { slug: 'location-eastern-suburbs', name: 'Eastern Suburbs', blurb: "Sydney's Eastern Suburbs and coastline", img: 'gallery-01.jpg' },
  { slug: 'location-inner-west', name: 'Inner West', blurb: "Sydney's Inner West", img: 'gallery-04.jpg' },
  { slug: 'location-liverpool', name: 'Liverpool', blurb: 'south-western Sydney', img: 'gallery-05.jpg' },
  { slug: 'location-marrickville', name: 'Marrickville', blurb: 'the Inner West', img: 'gallery-06.jpg' },
  { slug: 'location-northern-beaches', name: 'Northern Beaches', blurb: "Sydney's Northern Beaches", img: 'gallery-07.jpg' },
  { slug: 'location-parramatta', name: 'Parramatta', blurb: "Greater Western Sydney's heart", img: 'gallery-08.jpg' },
  { slug: 'location-penrith', name: 'Penrith', blurb: "Sydney's far west", img: 'gallery-09.jpg' },
  { slug: 'location-sutherland-shire', name: 'Sutherland Shire', blurb: 'the Sutherland Shire', img: 'gallery-10.jpg' },
  { slug: 'location-wollongong', name: 'Wollongong', blurb: 'the Illawarra', img: 'gallery-11.jpg' },
];

const MAP_IFRAME = `        <div class="map__frame reveal">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d150000!2d150.94447300000002!3d-33.954463499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b129569e0caaf63%3A0xd82e06f3c78575ce!2sShow%20Limousines!5e0!3m2!1sen!2sau"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Show Limousines on Google Maps">
          </iframe>
        </div>`;

LOCATIONS.forEach(function (loc) {
  const paras = [
    'Show Limousines provides chauffeur-driven limousine hire throughout ' + loc.name + ' and ' + loc.blurb + '. From weddings and school formals to airport transfers and a big night out, we bring luxury, comfort and reliability to every booking.',
    'Our local knowledge means smooth, on-time pick-ups and drop-offs right across ' + loc.name + ' — and with eleven vehicles in the fleet, there is the right car for every occasion and group size.',
  ];
  const bullets = ['Weddings & school formals', 'Airport & cruise transfers', 'Birthdays, hen’s & buck’s nights', 'Corporate & event travel'];
  const services = NAV.find(function (n) { return n.key === 'services'; }).sub;
  const svcList = services.map(function (s) { return `          <li><a href="${s.href}">${esc(s.label)} in ${esc(loc.name)}</a></li>`; }).join('\n');
  write(loc.slug + '.html', [
    head('Limo Hire ' + loc.name + ' | Show Limousines', 'Limousine & party car hire in ' + loc.name + '. Weddings, formals, airport transfers and events across ' + loc.name + ' and Greater Sydney. Call ' + PHONE + '.'),
    header('locations', loc.slug + '.html'),
    mobileNav('locations', loc.slug + '.html'),
    '  <main>',
    pageHero('Locations · ' + loc.name, 'Limo hire in ' + loc.name + '.', 'Chauffeur-driven limousines across ' + loc.name + ' and ' + loc.blurb + ' — for weddings, formals, transfers and every special occasion.'),
    feature(loc.name, 'Your ' + loc.name + ' limousine service.', paras, bullets, loc.img, 'Show Limousines servicing ' + loc.name, 'Get a Free Quote', 'contact.html#quote', false),
    `    <section class="map" id="map" aria-labelledby="mapHeading">
      <div class="map__inner">
        <div class="map__header reveal">
          <span class="label-bracket">Locations</span>
          <h2 class="map__heading" id="mapHeading">Servicing ${esc(loc.name)} &amp; beyond.</h2>
        </div>
${MAP_IFRAME}
        <h3 class="map__locs-title">What we offer in ${esc(loc.name)}</h3>
        <ul class="map__locs reveal" style="text-align:left;">
${svcList}
        </ul>
      </div>
    </section>`,
    fleetStrip('Popular in ' + loc.name + '.', 'A few of the most-booked vehicles for ' + loc.name + ' occasions.', ['fleet-chrysler-white', 'fleet-hummer-16', 'fleet-rolls-royce-phantom']),
    homeCta(),
    '  </main>',
    footer(),
    FOOT_SCRIPT,
  ]);
});

/* ============================================================
   WEDDING SUB-PAGES
   ============================================================ */
const WEDDINGS = [
  { slug: 'wedding-sydney', place: 'Sydney', blurb: 'across Greater Sydney' },
  { slug: 'wedding-wollongong', place: 'Wollongong', blurb: 'throughout Wollongong and the Illawarra' },
];
WEDDINGS.forEach(function (w) {
  const paras = [
    'Your wedding deserves an entrance to match the moment. Show Limousines specialises in elegant, chauffeur-driven wedding transport ' + w.blurb + ' — from the bridal party pick-up to the getaway car at the end of the night.',
    'Choose from our Rolls Royce Phantom, white and black Chrysler super-stretch limousines and our luxury Mercedes sedans — every vehicle immaculately presented and dressed for the occasion, with a uniformed chauffeur who knows the day runs to the minute.',
  ];
  const bullets = ['Bridal party & guest transfers', 'Ribbons & red-carpet service', 'On-time, professional chauffeurs', 'Servicing ' + w.place + ' & surrounds'];
  write(w.slug + '.html', [
    head('Wedding Car Hire ' + w.place + ' | Show Limousines', 'Wedding limousine hire in ' + w.place + '. Rolls Royce, Chrysler stretch limousines & luxury sedans for your big day, ' + w.blurb + '. Call ' + PHONE + '.'),
    header('wedding', w.slug + '.html'),
    mobileNav('wedding', w.slug + '.html'),
    '  <main>',
    pageHero('Wedding Limousines · ' + w.place, 'Wedding car hire ' + w.place + '.', 'Chauffeur-driven wedding transport for bridal parties and guests ' + w.blurb + '.'),
    feature('Your Big Day', 'Make your ' + w.place + ' wedding unforgettable.', paras, bullets, 'gallery-01.jpg', 'White Chrysler super-stretch wedding limousine', 'Enquire about your date', 'contact.html#quote', false),
    fleetStrip('Wedding cars for your day.', 'The most-requested vehicles for ' + w.place + ' weddings.', ['fleet-rolls-royce-phantom', 'fleet-chrysler-white', 'fleet-mercedes-s-class']),
    TESTIMONIALS,
    homeCta(),
    '  </main>',
    footer(),
    FOOT_SCRIPT,
  ]);
});

/* ============================================================
   ABOUT SUB-PAGES — Blog, Reviews, Terms
   ============================================================ */

/* ---- Blog ---- */
const POSTS = [
  { title: 'How to choose the right wedding car', img: 'gallery-01.jpg', date: 'Wedding Tips', excerpt: 'From the Rolls Royce Phantom to a white Chrysler super-stretch, here is how to match your wedding car to your style, your party size and your venue.' },
  { title: 'Planning the perfect school formal arrival', img: 'gallery-06.jpg', date: 'Formals', excerpt: 'Group bookings, photo stops and timing — everything you and your crew need to make a grand entrance at this year’s formal.' },
  { title: 'Stretch limo vs Hummer: which is right for you?', img: 'gallery-09.jpg', date: 'Fleet', excerpt: 'Both turn heads — but they suit different nights. We break down passenger numbers, vibe and occasions to help you decide.' },
  { title: 'Stress-free airport transfers in Sydney', img: 'gallery-05.jpg', date: 'Transfers', excerpt: 'Flight tracking, luggage and meet-and-greet — why a chauffeured transfer beats parking at the terminal every time.' },
  { title: 'Throwing the ultimate hen’s night', img: 'gallery-04.jpg', date: 'Celebrations', excerpt: 'Keep the group together and the night rolling. Our guide to planning a hen’s party with a limousine at the centre of it.' },
  { title: 'Why book your limo early', img: 'gallery-11.jpg', date: 'Booking', excerpt: 'Peak season fills fast — especially for weddings and formals. Here is how far in advance to lock in your date and vehicle.' },
];
function blogCard(p) {
  return `          <article class="fleet-card reveal">
            <div class="fleet-card__media">
              <img class="fleet-card__img" src="${p.img}" alt="${esc(p.title)}" loading="lazy" decoding="async">
              <span class="fleet-card__badge">${esc(p.date)}</span>
            </div>
            <div class="fleet-card__body">
              <span class="fleet-card__model">${esc(p.title)}</span>
              <span class="fleet-card__capacity">${esc(p.excerpt)}</span>
              <div class="fleet-card__footer">
                <a href="contact.html#quote" class="btn-outline-sm">Enquire</a>
              </div>
            </div>
          </article>`;
}
write('blog.html', [
  head('Blog — Limo Hire Tips & News | Show Limousines', 'Tips, guides and news from Show Limousines — weddings, formals, transfers and choosing the right limousine in Sydney & Wollongong.'),
  header('about'),
  mobileNav('about'),
  '  <main>',
  pageHero('About Us · Blog', 'From the blog.', 'Tips, guides and inspiration for weddings, formals, transfers and every occasion worth a limousine.'),
  `    <section class="fleet" aria-labelledby="blogHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="fleet__inner">
        <div class="fleet__header reveal">
          <div>
            <span class="label-bracket">Blog</span>
            <h2 class="fleet__heading" id="blogHeading">Latest articles.</h2>
          </div>
          <p class="fleet__intro">Planning a wedding, a formal or a big night out? Start here — then call us on <a href="tel:${TEL}" style="color:var(--color-accent);">${PHONE}</a> for a tailored quote.</p>
        </div>
        <div class="fleet__grid">
${POSTS.map(blogCard).join('\n\n')}
        </div>
      </div>
    </section>`,
  homeCta(),
  '  </main>',
  footer(),
  FOOT_SCRIPT,
]);

/* ---- Reviews ---- */
const REVIEW_CARDS = [
  ['Daniel Keenahan', 'Wedding', 'Fantastic experience! Mick was great to deal with. The vehicle used on the day not only looked amazing, but the driver was on time and was friendly with the entire bridal party.'],
  ['Elena Pace', 'Special Event', 'I recently used Show Limousine Hire and was thoroughly impressed by their service. Mick was highly professional and punctual, making the entire experience smooth and stress-free. The vehicle was immaculate, comfortable, and clearly well-maintained.'],
  ['Kaelee', 'Wedding', "We couldn't recommend Show Limousines more for wedding transport. They handled both our bridal party pick-up and our getaway car at the end of the night, and everything ran absolutely seamlessly."],
  ['Matikka Ismail', 'Wedding', 'I had Mick and his team provide the transport for my wedding and we were extremely happy with absolutely everything. From the time of booking up to the wedding day, Mick was always happy to help and always replied very quickly.'],
  ['Theo Dechaufepie', 'Birthday', 'Hired a stretched Hummer for a surprise 70th. My grandkids aged 3 to 13 thought they were rockstars. Show Limousines are a very professional company and I have no hesitation in recommending them.'],
];
function reviewCard(r) {
  return `          <article class="fleet-card reveal">
            <div class="fleet-card__body">
              <div class="testi__stars" aria-label="Rated 5 out of 5 stars" style="color:var(--color-accent);">★★★★★</div>
              <p class="fleet-card__capacity" style="margin:12px 0 16px;">"${esc(r[2])}"</p>
              <span class="fleet-card__brand">${esc(r[0])}</span>
              <span class="fleet-card__capacity">${esc(r[1])} · Google Review</span>
            </div>
          </article>`;
}
write('reviews.html', [
  head('Reviews — 5.0 Google Rating | Show Limousines', 'Read real Show Limousines reviews — a 5.0 Google rating from 160+ verified customers across weddings, formals, transfers and special events in Sydney.'),
  header('about'),
  mobileNav('about'),
  '  <main>',
  pageHero('About Us · Reviews', 'What our clients say.', 'A 5.0 Google rating from 160+ verified reviews — here is what real Show Limousines customers have to say.'),
  `    <section class="about" aria-labelledby="reviewsBadge">
      <div class="beam" aria-hidden="true"></div>
      <div class="about__inner">
        <div class="about__copy reveal">
          <span class="label-bracket">Reviews</span>
          <h2 class="about__heading" id="reviewsBadge">Trusted by 160+ Sydney clients.</h2>
          <p class="about__body">From weddings and formals to airport transfers and milestone birthdays, our clients keep coming back — and leaving five-star reviews. Read them on Google, then get in touch to plan your own.</p>
          <a href="https://www.google.com/search?q=Show+Limousines+Sydney+reviews" target="_blank" rel="noopener noreferrer" class="btn-pill btn-pill--gold btn-magnetic">
            Read All Google Reviews
            <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span>
          </a>
        </div>
        <aside class="google-badge reveal" aria-label="Google reviews rating">
          <div class="google-badge__head">
            <span class="google-badge__logo" aria-hidden="true">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </span>
            <span class="google-badge__title">Google Reviews</span>
          </div>
          <div class="google-badge__score">
            <span class="google-badge__num">5.0</span>
            <div class="google-badge__stars">
              <span class="google-badge__stars-row" aria-label="Rated 5 out of 5 stars">★★★★★</span>
              <span class="google-badge__count"><strong>160+</strong> verified reviews</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
    <section class="fleet" aria-labelledby="reviewGrid">
      <div class="fleet__inner">
        <div class="fleet__header reveal">
          <div>
            <span class="label-bracket">Testimonials</span>
            <h2 class="fleet__heading" id="reviewGrid">In their words.</h2>
          </div>
        </div>
        <div class="fleet__grid">
${REVIEW_CARDS.map(reviewCard).join('\n\n')}
        </div>
      </div>
    </section>`,
  homeCta(),
  '  </main>',
  footer(),
  FOOT_SCRIPT,
]);

/* ---- Terms & Conditions ---- */
const TERMS = [
  ['Bookings & quotes', 'All bookings are subject to availability and are only confirmed once a deposit has been received and Show Limousines has issued a written confirmation. Quotes are valid for 14 days and are based on the details supplied at the time of enquiry. Changes to date, time, route, passenger numbers or vehicle may alter the price.'],
  ['Deposits & payment', 'A deposit is required to secure your booking and lock in your date and rate. The balance is payable before or on the day of the booking unless otherwise agreed in writing. Accepted payment methods will be confirmed at the time of booking.'],
  ['Cancellations & changes', 'Cancellations must be made in writing. Deposits are non-refundable as your booking reserves the vehicle and chauffeur for your date. We will always do our best to accommodate changes to your run sheet where availability allows.'],
  ['Passenger numbers & conduct', 'Passenger numbers must not exceed the licensed seating capacity of the vehicle. The hirer is responsible for the conduct of all passengers. Our chauffeurs reserve the right to end a booking without refund where behaviour is unsafe, illegal or damaging to the vehicle.'],
  ['Damage & cleaning', 'The hirer is responsible for any damage caused to the vehicle by passengers during the hire. Additional cleaning fees may apply in the event of spillage, illness or excessive mess.'],
  ['Delays & circumstances beyond our control', 'While we plan every journey to run on time, Show Limousines is not liable for delays caused by traffic, weather, road closures, mechanical failure or other circumstances beyond our reasonable control. In the unlikely event a booked vehicle becomes unavailable, we will provide a suitable alternative or a refund.'],
  ['Alcohol, smoking & safety', 'Smoking is not permitted in any vehicle. Complimentary sparkling wine may be provided for some occasions; passengers must be of legal drinking age. Seatbelts must be worn where fitted and all reasonable safety directions from the chauffeur followed.'],
];
function termBlock(t, i) {
  return `          <div class="how-row reveal${i === 0 ? ' is-open' : ''}" data-row="${i + 1}">
            <div class="how-row__top" role="button" tabindex="0" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="terms-panel-${i + 1}">
              <span class="how-row__num">${String(i + 1).padStart(2, '0')} /</span>
              <h3 class="how-row__title">${esc(t[0])}</h3>
              <span class="how-row__arrow" aria-hidden="true">${ARROW}</span>
            </div>
            <div class="how-row__panel" id="terms-panel-${i + 1}">
              <div class="how-row__panel-inner">
                <p class="how-row__body">${esc(t[1])}</p>
              </div>
            </div>
          </div>`;
}
write('terms.html', [
  head('Terms & Conditions | Show Limousines', 'Show Limousines terms and conditions of hire — bookings, deposits, cancellations, conduct and safety for our Sydney & Wollongong limousine service.'),
  header('about'),
  mobileNav('about'),
  '  <main>',
  pageHero('About Us · Terms', 'Terms & conditions.', 'The terms of hire for our limousine services. Questions? Call us on ' + PHONE + ' — we are happy to help.'),
  `    <section class="how" aria-labelledby="termsHeading">
      <div class="beam beam--reverse" aria-hidden="true"></div>
      <div class="how__inner">
        <div class="how__header reveal">
          <span class="label-bracket">Terms of Hire</span>
          <h2 class="how__heading" id="termsHeading">The fine print, made clear.</h2>
        </div>
        <div class="how__list">
${TERMS.map(termBlock).join('\n\n')}
        </div>
        <a href="contact.html#quote" class="how__book">
          Have a question? Get in touch
          <span class="arrow" aria-hidden="true">${ARROW}</span>
        </a>
      </div>
    </section>`,
  homeCta(),
  '  </main>',
  footer(),
  FOOT_SCRIPT,
]);

/* ============================================================
   PATCH THE 8 HAND-AUTHORED PAGES — swap header / mobile / footer
   ============================================================ */
const EXISTING = [
  { file: 'index.html', active: 'home' },
  { file: 'wedding.html', active: 'wedding' },
  { file: 'services.html', active: 'services' },
  { file: 'fleet.html', active: 'fleet' },
  { file: 'about.html', active: 'about' },
  { file: 'locations.html', active: 'locations' },
  { file: 'contact.html', active: 'contact' },
  { file: 'gallery.html', active: 'about', activeSub: 'gallery.html' },
];
EXISTING.forEach(function (pg) {
  const fp = path.join(ROOT, pg.file);
  let html = fs.readFileSync(fp, 'utf8');
  const newHeader = header(pg.active, pg.activeSub);
  const newMobile = mobileNav(pg.active, pg.activeSub);
  const newFooter = footer();

  const h = html.replace(/<header class="nav-wrap"[\s\S]*?<\/header>/, newHeader);
  if (h === html) throw new Error('header not matched in ' + pg.file);
  html = h;

  const m = html.replace(/<div class="nav-mobile"[\s\S]*?<\/div>\s*(?=<main>)/, newMobile + '\n  ');
  if (m === html) throw new Error('mobile nav not matched in ' + pg.file);
  html = m;

  const f = html.replace(/<footer class="foot"[\s\S]*?<\/footer>/, newFooter);
  if (f === html) throw new Error('footer not matched in ' + pg.file);
  html = f;

  fs.writeFileSync(fp, html, 'utf8');
  written.push(pg.file + ' (patched)');
});

console.log('Generated / patched ' + written.length + ' files:');
written.forEach(function (w) { console.log('  ' + w); });
