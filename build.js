/* ============================================================
   build.js — Phase 2b–4 generator for the content-faithful rebuild.
   Single source of truth for: mega-menu nav, footer, the reusable
   Web3Forms quote form, and the five page templates. Reads the
   crawled content/<slug>.md (faithful copy + exact SEO) and emits
   every reference URL as a folder-per-slug index.html, reusing the
   existing design components/tokens. Also re-stamps the home page's
   header / mobile-nav / footer / quote form.
   Run: node build.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');

const PHONE = '0422 023 413', TEL = '0422023413', EMAIL = 'info@showlimousines.com.au';
const SITE = 'https://www.showlimousines.com.au';
const WEB3FORMS_KEY = 'WEB3FORMS_ACCESS_KEY_HERE'; // <-- paste your Web3Forms access key (web3forms.com) to go live
const ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';
const CARET = '<svg class="nav-pill-caret" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const CARET_R = '<svg class="nav-flyout__caret" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
function esc(s) { return String(s == null ? '' : s).replace(/&(?!amp;|lt;|gt;|#)/g, '&amp;'); }
function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

/* ---------------- Vehicles ---------------- */
const VEHICLES = [
  { slug: 'vehicle-chrysler-super-stretch-limousine', name: 'White Chrysler Super Stretch', img: 'fleet-chrysler-white-v2.jpg', badge: 'Chrysler', pax: 10 },
  { slug: 'vehicle-black-chrysler-super-stretch-limousine', name: 'Black Chrysler Super Stretch', img: 'fleet-chrysler-black-v2.jpg', badge: 'Chrysler', pax: 10 },
  { slug: 'vehicle-black-edition-chrysler-super-stretch-limousine', name: 'Chrysler Super Stretch (Black Edition)', img: 'fleet-chrysler-black-edition-v2.jpg', badge: 'Chrysler', pax: 10 },
  { slug: 'vehicle-gullwing-chrysler-super-stretch-limousine', name: 'Chrysler Super Stretch Gullwing', img: 'fleet-chrysler-gullwing-v2.jpg', badge: 'Chrysler', pax: 10 },
  { slug: 'vehicle-hummer-stretch-limousine', name: 'Stretch Hummer (14 Pax)', img: 'fleet-hummer-green-v2.jpg', badge: 'Hummer', pax: 14 },
  { slug: 'vehicle-hummer-h2-stretch-limousine', name: 'Stretch Hummer (16 Pax)', img: 'fleet-hummer-white-v2.jpg', badge: 'Hummer', pax: 16 },
  { slug: 'vehicle-mercedes-s-class-amg-sedan', name: 'Mercedes S Class AMG Sedan', img: 'fleet-mercedes-s-class-v2.jpg', badge: 'Mercedes', pax: 4 },
  { slug: 'vehicle-mercedes-valente-premium-minibus', name: 'Mercedes Valente Luxury Minivan', img: 'fleet-mercedes-valente-v2.jpg', badge: 'Mercedes', pax: 7 },
  { slug: 'vehicle-mercedes-sprinter-limo-van', name: 'Mercedes Sprinter Limo Van', img: 'fleet-mercedes-sprinter-v2.jpg', badge: 'Mercedes', pax: 14 },
  { slug: 'vehicle-rolls-royce-phantom-sedan', name: 'Rolls Royce Phantom', img: 'fleet-rolls-royce-phantom-v2.jpg', badge: 'Rolls Royce', pax: 4 },
  { slug: 'vehicle-volkswagen-crafter-premium-minibus', name: 'VW Crafter Luxury Minibus', img: 'fleet-vw-crafter-v2.jpg', badge: 'Volkswagen', pax: 11 },
];
const VBY = {}; VEHICLES.forEach(v => { VBY[v.slug] = v; v.url = '/vehicle/' + v.slug.replace(/^vehicle-/, '') + '/'; });
function vurl(slug) { return '/vehicle/' + slug.replace(/^vehicle-/, '') + '/'; }

/* ---------------- Nav mega-menu config (§2.1) ---------------- */
const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Wedding Limousines', href: '/wedding-limousine-sydney/', children: [
    { label: 'Wedding Car Hire Sydney', href: '/wedding-limousine-sydney/' },
    { label: 'Wedding Car Hire Wollongong', href: '/wedding-limousine-hire-wollongong/' },
  ] },
  { label: 'Services', href: '/services/', wide: true, children: [
    { label: 'Airport Transfers', href: '/airport-limo-transfers-sydney/' },
    { label: 'Cruise Transfers', href: '/cruise-transfer-sydney/' },
    { label: 'Birthday Limos', href: '/birthday-limousine-sydney/' },
    { label: 'Concert Transfers', href: '/concert-limo-transfers-sydney/' },
    { label: 'School Formal Limos', href: '/school-formal-limousine-hire-sydney/' },
    { label: 'Corporate Transfers', href: '/corporate-transfers/' },
    { label: 'Party Limos', href: '/party-limousine-hire-sydney/' },
    { label: "Hen's Party Limos", href: '/hens-party-limo-sydney/' },
  ] },
  { label: 'Fleet', href: '/fleet/', mega: [
    { label: 'Chrysler', href: '/chrysler-limo-hire-sydney/', items: VEHICLES.filter(v => v.badge === 'Chrysler').map(v => ({ label: v.name, href: v.url })) },
    { label: 'Hummer', href: '/hummer-limo-hire-sydney/', items: VEHICLES.filter(v => v.badge === 'Hummer').map(v => ({ label: v.name, href: v.url })) },
    { label: 'Mercedes', href: '#', items: VEHICLES.filter(v => v.badge === 'Mercedes').map(v => ({ label: v.name, href: v.url })) },
    { label: 'Rolls Royce', href: '/rolls-royce-hire-sydney/', items: VEHICLES.filter(v => v.badge === 'Rolls Royce').map(v => ({ label: v.name, href: v.url })) },
    { label: 'Volkswagen', href: '#', items: VEHICLES.filter(v => v.badge === 'Volkswagen').map(v => ({ label: v.name, href: v.url })) },
  ] },
  { label: 'About Us', href: '/about-us/', children: [
    { label: 'Gallery', href: '/gallery/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'Reviews', href: '/reviews/' },
    { label: 'Terms & Conditions', href: '/term-conditions/' },
  ] },
  { label: 'Locations', href: '#', wide: true, children: [
    { label: 'Bankstown', href: '/limo-hire-bankstown/' },
    { label: 'Campbelltown', href: '/limo-hire-campbelltown/' },
    { label: 'Eastern Suburbs', href: '/limo-hire-eastern-suburbs/' },
    { label: 'Inner West', href: '/limo-hire-inner-west/' },
    { label: 'Liverpool', href: '/limo-hire-liverpool/' },
    { label: 'Marrickville', href: '/limo-hire-marrickville/' },
    { label: 'Northern Beaches', href: '/limo-hire-northern-beaches/' },
    { label: 'Parramatta', href: '/limo-hire-parramatta/' },
    { label: 'Penrith', href: '/limo-hire-penrith/' },
    { label: 'Sutherland Shire', href: '/limo-hire-sutherland-shire/' },
    { label: 'Wollongong', href: '/limo-hire-wollongong/' },
  ] },
  { label: 'Contact', href: '/contact/' },
];

/* ---------------- Header / mobile / footer ---------------- */
function header(active) {
  const pills = NAV.map(item => {
    const isActive = item.href === active || (item.children && item.children.some(c => c.href === active)) || (item.mega && item.mega.some(g => g.items.some(i => i.href === active)));
    const cls = 'nav-pill' + (isActive ? ' is-active' : '');
    const cur = item.href === active ? ' aria-current="page"' : '';
    if (!item.children && !item.mega) {
      return `          <a href="${item.href}" class="${cls}"${cur} role="menuitem">${esc(item.label)}</a>`;
    }
    let panel;
    if (item.mega) {
      // Two-level Fleet menu: a dropdown of car makes, each opening its own
      // flyout submenu of vehicles (▸). Pure-grouping makes (href '#') open
      // the flyout without being links; the rest are clickable category pages.
      const makes = item.mega.map(g => {
        const parent = g.href === '#'
          ? `<button class="nav-flyout__parent" type="button" aria-haspopup="true">${esc(g.label)} ${CARET_R}</button>`
          : `<a class="nav-flyout__parent" href="${g.href}" aria-haspopup="true">${esc(g.label)} ${CARET_R}</a>`;
        const items = g.items.map(i => `                <a href="${i.href}" role="menuitem">${esc(i.label)}</a>`).join('\n');
        return `            <div class="nav-flyout">\n              ${parent}\n              <div class="nav-flyout__panel" role="menu">\n${items}\n              </div>\n            </div>`;
      }).join('\n');
      panel = `            <div class="nav-dropdown nav-dropdown--fleet" role="menu">\n${makes}\n            </div>`;
    } else {
      const links = item.children.map(c => `              <a href="${c.href}"${c.href === active ? ' aria-current="page"' : ''} role="menuitem">${esc(c.label)}</a>`).join('\n');
      panel = `            <div class="nav-dropdown${item.wide ? ' nav-dropdown--wide' : ''}" role="menu">\n${links}\n            </div>`;
    }
    const parentTag = item.href === '#'
      ? `<button class="${cls}" type="button" aria-haspopup="true">${esc(item.label)} ${CARET}</button>`
      : `<a href="${item.href}" class="${cls}"${cur} role="menuitem" aria-haspopup="true">${esc(item.label)} ${CARET}</a>`;
    return `          <div class="nav-pill-group">\n            ${parentTag}\n${panel}\n          </div>`;
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
        <a href="/" class="nav-brand" aria-label="Show Limousines — Sydney's Premier Luxury Transport — home">
          <picture>
            <source media="(max-width: 520px)" srcset="/show-limousines-s-mark.png">
            <img src="/show-limousines-logo.svg" alt="Show Limousines — Sydney's Premier Luxury Transport" class="nav-brand__logo" width="1500" height="470">
          </picture>
        </a>
        <div class="nav-pills" role="menubar">
${pills}
        </div>
        <div class="nav-right">
          <a href="/contact/" class="btn-pill btn-pill--gold">
            Get a Quote
            <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span>
          </a>
          <button class="nav-burger" id="navBurger" aria-label="Open menu" aria-controls="navMobile" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  </header>`;
}

function mobileNav(active) {
  const items = NAV.map(item => {
    const cur = item.href === active ? ' aria-current="page"' : '';
    if (!item.children && !item.mega) return `    <a href="${item.href}"${cur}>${esc(item.label)}</a>`;
    let subs;
    if (item.mega) {
      // Mobile Fleet: each make is its own nested accordion (tap to reveal its
      // vehicles), mirroring the desktop two-level flyout.
      subs = item.mega.map(g => {
        const gtop = g.href === '#' ? `<span>${esc(g.label)}</span>` : `<a href="${g.href}">${esc(g.label)}</a>`;
        const veh = g.items.map(i => `          <a href="${i.href}">${esc(i.label)}</a>`).join('\n');
        return `        <div class="nav-mobile__group nav-mobile__group--sub">
          <div class="nav-mobile__grouptop">
            ${gtop}
            <button class="nav-mobile__caret" aria-label="Toggle ${attr(g.label)} submenu" aria-expanded="false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
          <div class="nav-mobile__sub">
${veh}
          </div>
        </div>`;
      }).join('\n');
    } else {
      subs = item.children.map(c => `        <a href="${c.href}">${esc(c.label)}</a>`).join('\n');
    }
    const top = item.href === '#' ? `<span>${esc(item.label)}</span>` : `<a href="${item.href}"${cur}>${esc(item.label)}</a>`;
    return `    <div class="nav-mobile__group">
      <div class="nav-mobile__grouptop">
        ${top}
        <button class="nav-mobile__caret" aria-label="Toggle ${attr(item.label)} submenu" aria-expanded="false">
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
      <a href="/contact/" class="btn-pill btn-pill--gold">Get a Free Quote <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span></a>
    </div>
  </div>`;
}

/* When this file is required by a tooling script (e.g. nav-update.js) rather
   than run directly, expose the shared nav generators and stop here — do NOT
   run the full site build (which would also rewrite the home page form, etc.). */
if (require.main !== module) {
  module.exports = { header, mobileNav, NAV, VEHICLES };
  return;
}

const FOOT_LINKS = [
  ['Home', '/'], ['Gallery', '/gallery/'], ['Contact', '/contact/'], ['About Us', '/about-us/'],
  ['Our Vehicles', '/vehicles/'], ['Limo Hire', '/'], ['Hummer Hire', '/hummer-limo-hire-sydney/'], ['Sitemap', '/sitemap/'],
];
const FOOT_EVENT = [
  ['Wedding Car Hire', '/wedding-limousine-sydney/'], ['Concert Transfers', '/concert-limo-transfers-sydney/'],
  ['Airport Transfers', '/airport-limo-transfers-sydney/'], ['Birthday Transfers', '/birthday-limousine-sydney/'],
  ['School Formals', '/school-formal-limousine-hire-sydney/'], ['Party & Event Car Hire', '/party-limousine-hire-sydney/'],
  ['Corporate Transfers', '/corporate-transfers/'],
];
const FOOT_LOC = [
  ['Limo Hire Sydney', '/'], ['Campbelltown', '/limo-hire-campbelltown/'], ['Eastern Suburbs', '/limo-hire-eastern-suburbs/'],
  ['Inner West', '/limo-hire-inner-west/'], ['Marrickville', '/limo-hire-marrickville/'], ['Northern Beaches', '/limo-hire-northern-beaches/'],
  ['Parramatta', '/limo-hire-parramatta/'], ['Penrith', '/limo-hire-penrith/'], ['Sutherland Shire', '/limo-hire-sutherland-shire/'], ['Wollongong', '/limo-hire-wollongong/'],
];
function footCol(title, links) {
  return `          <nav class="foot-col">
            <h3 class="foot-col__title">${title}</h3>
            <ul>
${links.map(l => `              <li><a href="${l[1]}">${esc(l[0])}</a></li>`).join('\n')}
            </ul>
          </nav>`;
}
function footer() {
  return `    <footer class="foot" aria-labelledby="footHeading">
      <div class="beam" aria-hidden="true"></div>
      <h2 class="visually-hidden" id="footHeading">Site footer</h2>
      <div class="foot__inner">
        <div class="foot__contact">
          <div>
            <div class="foot__brand"><img src="/show-limousines-logo.svg" alt="Show Limousines — Sydney's Premier Luxury Transport" class="foot__brand-logo" width="1500" height="470"></div>
            <p class="foot__tag">Show Limousines specialises in personalised limo hire services throughout Sydney and the Wollongong areas. Catering to a range of different events including weddings, private functions, birthdays, concerts and events, airport transfers, cruise transfers, school formals, corporate travellers, hen's nights.</p>
            <div class="foot__socials" aria-label="Social links">
              <a href="https://www.facebook.com/showlimousines/" target="_blank" rel="noopener noreferrer" class="foot__social" aria-label="Show Limousines on Facebook"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></a>
              <a href="https://www.instagram.com/showlimousines/" target="_blank" rel="noopener noreferrer" class="foot__social" aria-label="Show Limousines on Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
            </div>
          </div>
          <div class="foot__contact-info">
            <div class="foot__contact-row"><span class="foot__contact-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span><div><span class="foot__contact-label">Phone</span><a href="tel:${TEL}" class="foot__contact-value">${PHONE}</a></div></div>
            <div class="foot__contact-row"><span class="foot__contact-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg></span><div><span class="foot__contact-label">Email</span><a href="mailto:${EMAIL}" class="foot__contact-value">${EMAIL}</a></div></div>
          </div>
        </div>
        <div class="foot__divider" aria-hidden="true"></div>
        <div class="foot__grid">
${footCol('Links', FOOT_LINKS)}
${footCol('Any Event', FOOT_EVENT)}
${footCol('Locations', FOOT_LOC)}
        </div>
        <div class="foot__bottom">
          <div>&copy; 2026 Show Limousines | All Rights Reserved</div>
          <div><a href="mailto:${EMAIL}">${EMAIL}</a><span class="sep">·</span><a href="tel:${TEL}">${PHONE}</a></div>
          <div class="foot__credit">Powered by <a href="https://awlabs.com.au" target="_blank" rel="noopener noreferrer">All Webbed Labs</a></div>
        </div>
      </div>
    </footer>`;
}

/* ---------------- Head / SEO ---------------- */
function head(fm, slug) {
  const title = fm.title || 'Show Limousines';
  const desc = fm.description || '';
  const canonical = SITE + pathFor(slug);
  const ogt = fm.og_title || title;
  const ogd = fm.og_description || desc;
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${attr(ogt)}">
  <meta property="og:description" content="${attr(ogd)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE}/show-limousines-s-mark.png">
  <meta property="og:image:width" content="488">
  <meta property="og:image:height" content="444">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${attr(ogt)}">
  <meta name="twitter:description" content="${attr(ogd)}">
  <meta name="twitter:image" content="${SITE}/show-limousines-s-mark.png">
  <link rel="icon" type="image/png" href="/show-limousines-s-mark.png">
  <link rel="apple-touch-icon" href="/show-limousines-s-mark.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@500;600&family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="https://unpkg.com/lenis@1.0.45/dist/lenis.min.js"></script>
  <script src="https://unpkg.com/split-type"></script>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>`;
}
const FOOT_SCRIPT = `  <script src="/main.js"></script>\n</body>\n</html>`;

/* ---------------- Section builders ---------------- */
function pageHero(eyebrow, h1, sub) {
  return `    <section class="page-hero" aria-label="${attr(h1)}">
      <div class="page-hero__inner reveal">
        <span class="label-bracket">${esc(eyebrow)}</span>
        <h1 class="page-hero__title">${esc(h1)}</h1>
        ${sub ? `<p class="page-hero__sub">${esc(sub)}</p>` : ''}
      </div>
    </section>`;
}

const OCCASION_OPTS = ['Wedding', 'Airport transfer', 'School Formal', "Hen's Party", "Buck's Party", 'Birthday', 'Corporate Event', 'Concert Transfer', 'General Hire', 'Christmas Party', 'Cruise Transfer', 'Other – please specify'];
function quoteForm(heading, sub) {
  return `    <section class="quote" id="quote" aria-labelledby="quoteHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="quote__inner">
        <div class="quote__header reveal">
          <span class="label-bracket">Get a Quote</span>
          <h2 class="quote__heading" id="quoteHeading">${esc(heading || 'Get a quick quote.')}</h2>
          <p class="quote__sub">${esc(sub || 'Leave your details below and we’ll send a personalised quote.')} Or call <a href="tel:${TEL}" style="color:var(--color-accent);">${PHONE}</a> — open 24/7.</p>
        </div>
        <div class="quote__grid">
          <form class="quote-form reveal" id="quoteForm" action="https://api.web3forms.com/submit" method="POST">
            <input type="hidden" name="access_key" value="${WEB3FORMS_KEY}">
            <input type="hidden" name="subject" value="New Show Limousines enquiry">
            <input type="hidden" name="from_name" value="Show Limousines Website">
            <input type="hidden" name="redirect" value="${SITE}/thank-you/">
            <input type="checkbox" name="botcheck" class="visually-hidden" style="display:none" tabindex="-1" autocomplete="off">
            <div class="quote-field"><label for="qName">Name <span class="req">*</span></label><input type="text" id="qName" name="name" required autocomplete="name"></div>
            <div class="quote-field"><label for="qPhone">Phone <span class="req">*</span></label><input type="tel" id="qPhone" name="phone" required autocomplete="tel"></div>
            <div class="quote-field"><label for="qEmail">Email <span class="req">*</span></label><input type="email" id="qEmail" name="email" required autocomplete="email"></div>
            <div class="quote-field"><label for="qDate">Date <span class="req">*</span></label><input type="date" id="qDate" name="date" required></div>
            <div class="quote-field"><label for="qPickupTime">Pick up time</label><select id="qPickupTime" name="pickup_time"></select></div>
            <div class="quote-field"><label for="qDropoffTime">Drop off time</label><select id="qDropoffTime" name="dropoff_time"></select></div>
            <div class="quote-field full"><label for="qPickupLoc">Pick up location</label><input type="text" id="qPickupLoc" name="pickup_location" placeholder="Suburb or full address"></div>
            <div class="quote-field full"><label for="qDropoffLoc">Drop off location</label><input type="text" id="qDropoffLoc" name="dropoff_location" placeholder="Suburb or full address"></div>
            <div class="quote-field"><label for="qPax">Number of passengers</label><input type="number" id="qPax" name="passengers" min="1" max="20" placeholder="e.g. 8"></div>
            <div class="quote-field"><label for="qOccasion">Occasion</label><select id="qOccasion" name="occasion"><option value="">Select an occasion</option>${OCCASION_OPTS.map(o => `<option>${esc(o)}</option>`).join('')}</select></div>
            <div class="quote-field full"><label for="qComments">Additional Comments</label><textarea id="qComments" name="comments" placeholder="Run sheet, special requests, anything we should know…"></textarea></div>
            <div class="quote-submit"><button type="submit" class="btn-pill btn-pill--gold btn-magnetic" style="width:100%; justify-content:center;">Send Message <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span></button></div>
          </form>
          <aside class="quote-aside reveal" aria-label="Contact information">
            <h3 class="quote-aside__title">Talk to us direct.</h3>
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg></span><div><span class="quote-aside__label">Service area</span><span class="quote-aside__value">Greater Sydney &amp; Wollongong</span></div></div>
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span><div><span class="quote-aside__label">Phone</span><a href="tel:${TEL}" class="quote-aside__value">${PHONE}</a></div></div>
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg></span><div><span class="quote-aside__label">Email</span><a href="mailto:${EMAIL}" class="quote-aside__value">${EMAIL}</a></div></div>
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span><div><span class="quote-aside__label">Reviews</span><span class="quote-aside__value">160+ five-star Google reviews</span></div></div>
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span><div><span class="quote-aside__label">Hours</span><span class="quote-aside__value">Open 24/7 — 365 days a year</span></div></div>
          </aside>
        </div>
      </div>
    </section>`;
}

const TESTIMONIALS = require('./content/_testimonials.js');
const FAQ_ITEMS = [
  ['How much does it cost to hire a limousine?', "The costs involved to hire a limo will vary depending on the vehicle, location, and pick up/drop off requirements. Most limousine hire companies will charge by the hour. At Show Limousines, all of our limousine hire services start at $399 per booking. For a more accurate quote, get in touch with our team and we'll send it over via email."],
  ["What's included when I book a limo?", 'For all transfers and events, we include a uniformed chauffeur, bottled water, and a luxurious modern vehicle. For weddings, we roll out the red carpet for the bride, the cars are laced with satin ribbon and sparkling wine. Each car is fitted with air conditioning, bluetooth, drink holders, party lights, and comfortable, luxurious seating.'],
  ['How far in advance do I need to book?', 'We recommend booking as far in advance as possible! Particularly for an event or special occasion, as we want to ensure that you get the right vehicle and can secure the date of the event. For weddings, we get bookings a year in advance. That being said, we do take on last-minute bookings and will always do our best to accommodate requests.'],
  ['How many people can fit into a limo?', 'That depends on the vehicle chosen! For our stretch limousines and hummer limousines, we can fit up to 16 guests in one car. For smaller parties, we can seat 4 to 8 passengers. For weddings, we offer car packages where you can hire multiple cars for the big day.'],
];
function faq(items) {
  const list = (items || FAQ_ITEMS).map(it => `          <div class="faq-item reveal">
            <div class="faq-item__top" role="button" tabindex="0" aria-expanded="false">
              <h3 class="faq-item__q">${esc(it[0])}</h3>
              <span class="faq-item__arrow" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span>
            </div>
            <div class="faq-item__panel"><p class="faq-item__a">${esc(it[1])}</p></div>
          </div>`).join('\n');
  return `    <section class="faq" id="faq" aria-labelledby="faqHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="faq__inner">
        <div class="faq__header reveal"><span class="label-bracket">FAQs</span><h2 class="faq__heading" id="faqHeading">Common questions, answered.</h2></div>
        <div class="faq__list">
${list}
        </div>
      </div>
    </section>`;
}

function fleetCard(v) {
  return `          <article class="fleet-card reveal">
            <div class="fleet-card__media"><img class="fleet-card__img" src="/${v.img}" alt="${attr(v.name)}" loading="lazy" decoding="async"><span class="fleet-card__badge">${esc(v.badge)}</span></div>
            <div class="fleet-card__body"><span class="fleet-card__brand">${esc(v.badge)}</span><span class="fleet-card__model">${esc(v.name)}</span><span class="fleet-card__capacity">Up to ${v.pax} passengers</span><div class="fleet-card__footer"><a href="${v.url}" class="btn-outline-sm">View Details</a></div></div>
          </article>`;
}
function fleetGrid(heading, intro, vehicles) {
  return `    <section class="fleet" aria-labelledby="fleetGridHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="fleet__inner">
        <div class="fleet__header reveal"><div><span class="label-bracket">Our Fleet</span><h2 class="fleet__heading" id="fleetGridHeading">${esc(heading)}</h2></div><p class="fleet__intro">${esc(intro)}</p></div>
        <div class="fleet__grid">
${vehicles.map(fleetCard).join('\n')}
        </div>
        <a href="/fleet/" class="fleet__viewall">View Full Fleet <span class="arrow" aria-hidden="true">${ARROW}</span></a>
      </div>
    </section>`;
}

function mapSection(heading) {
  return `    <section class="map" id="map" aria-labelledby="mapHeading">
      <div class="map__inner">
        <div class="map__header reveal"><span class="label-bracket">Find Us</span><h2 class="map__heading" id="mapHeading">${esc(heading || 'Servicing Sydney & Wollongong.')}</h2></div>
        <div class="map__frame reveal"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d150000!2d150.94447300000002!3d-33.954463499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b129569e0caaf63%3A0xd82e06f3c78575ce!2sShow%20Limousines!5e0!3m2!1sen!2sau" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Show Limousines on Google Maps"></iframe></div>
      </div>
    </section>`;
}

function googleBadge() {
  return `    <section class="about" aria-label="Google reviews">
      <div class="beam" aria-hidden="true"></div>
      <div class="about__inner">
        <div class="about__copy reveal"><span class="label-bracket">Reviews</span><h2 class="about__heading">Trusted by 160+ Sydney clients.</h2><p class="about__body">From weddings and formals to airport transfers and milestone birthdays, our clients keep coming back — and leaving five-star reviews on Google.</p><a href="https://www.google.com/search?q=Show+Limousines+Sydney+reviews" target="_blank" rel="noopener noreferrer" class="btn-pill btn-pill--gold btn-magnetic">All Google Reviews <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span></a></div>
        <aside class="google-badge reveal" aria-label="Google reviews rating">
          <div class="google-badge__head"><span class="google-badge__logo" aria-hidden="true"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg></span><span class="google-badge__title">Google Reviews</span></div>
          <div class="google-badge__score"><span class="google-badge__num">5.0</span><div class="google-badge__stars"><span class="google-badge__stars-row" aria-label="Rated 5 out of 5 stars">★★★★★</span><span class="google-badge__count"><strong>160+</strong> verified reviews</span></div></div>
        </aside>
      </div>
    </section>`;
}

/* ---------------- content/*.md parsing + prose rendering ---------------- */
const CRUFT = [
  /^by\s+\w+\s*\|/i, /^enquire now$/i, /^get a quick quote/i, /^get a free quote/i, /^all google reviews$/i,
  /^view gallery$/i, /^read more$/i, /^show limousines$/i, /^0422\s?023\s?413$/, /^contact us$/i, /^book now$/i,
  /^get a quote$/i, /^©/, /^home$/i,
];
function parseMd(slug) {
  const raw = fs.readFileSync(path.join(CONTENT, slug + '.md'), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm = {}; let body = '';
  if (m) {
    m[1].split('\n').forEach(line => {
      const i = line.indexOf(':'); if (i < 0) return;
      const k = line.slice(0, i).trim(); let v = line.slice(i + 1).trim();
      if (v.startsWith('"')) { try { v = JSON.parse(v); } catch (e) {} }
      fm[k] = v;
    });
    body = m[2];
  }
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  return { fm, lines };
}
function proseFromLines(lines, opts) {
  opts = opts || {};
  const out = []; let listBuf = [];
  const flush = () => { if (listBuf.length) { out.push('          <ul class="prose__list">\n' + listBuf.map(t => `            <li>${esc(t)}</li>`).join('\n') + '\n          </ul>'); listBuf = []; } };
  let h1seen = 0;
  for (const ln of lines) {
    let m;
    if ((m = ln.match(/^#\s+(.*)/))) { // h1 in body
      h1seen++; if (h1seen === 1 && opts.dropFirstH1) continue;
      flush(); out.push(`          <h2 class="prose__h2">${esc(m[1])}</h2>`); continue;
    }
    if ((m = ln.match(/^##\s+(.*)/))) { flush(); out.push(`          <h2 class="prose__h2">${esc(m[1])}</h2>`); continue; }
    if ((m = ln.match(/^###?#?\s+(.*)/))) { flush(); out.push(`          <h3 class="prose__h3">${esc(m[1])}</h3>`); continue; }
    if ((m = ln.match(/^-\s+(.*)/))) { if (!CRUFT.some(r => r.test(m[1]))) listBuf.push(m[1]); continue; }
    if ((m = ln.match(/^>\s+(.*)/))) { flush(); out.push(`          <blockquote class="prose__quote">${esc(m[1])}</blockquote>`); continue; }
    if (CRUFT.some(r => r.test(ln))) continue;
    flush(); out.push(`          <p>${esc(ln)}</p>`);
  }
  flush();
  return out.join('\n');
}
function proseSection(eyebrow, lines, opts) {
  return `    <section class="prose">
      <div class="beam" aria-hidden="true"></div>
      <div class="prose__inner reveal">
        ${eyebrow ? `<span class="label-bracket">${esc(eyebrow)}</span>` : ''}
${proseFromLines(lines, opts)}
      </div>
    </section>`;
}

/* ---------------- path + write ---------------- */
const SLUG_PATH = {
  home: '/', services: '/services/', fleet: '/fleet/', vehicles: '/vehicles/', 'about-us': '/about-us/',
  gallery: '/gallery/', reviews: '/reviews/', blog: '/blog/', 'term-conditions': '/term-conditions/',
  contact: '/contact/', 'thank-you': '/thank-you/', sitemap: '/sitemap/',
  'blog-dont-get-too-drunk': '/dont-get-too-drunk-in-your-limo-ride-you-will-definitely-pay-the-price-and-so-will-everyone-around-you/',
  'blog-limousine-hire-costs-sydney': '/limousine-hire-costs-sydney/',
  'blog-dos-and-donts': '/the-dos-and-donts-when-rolling-in-a-limousine-to-your-next-event/',
  'blog-wedding-limo-checklist': '/wedding-limo-checklist/',
};
function pathFor(slug) {
  if (SLUG_PATH[slug]) return SLUG_PATH[slug];
  if (slug.startsWith('vehicle-')) return vurl(slug);
  return '/' + slug + '/';
}
const written = [];
function emit(slug, parts) {
  const p = pathFor(slug);
  const dir = p === '/' ? ROOT : path.join(ROOT, p.replace(/^\/|\/$/g, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), parts.filter(Boolean).join('\n') + '\n', 'utf8');
  written.push(p);
}

/* ---------------- Page assembly ---------------- */
const SERVICE_FLEET = {
  'wedding-limousine-sydney': ['vehicle-rolls-royce-phantom-sedan', 'vehicle-chrysler-super-stretch-limousine', 'vehicle-mercedes-s-class-amg-sedan'],
  'airport-limo-transfers-sydney': ['vehicle-mercedes-s-class-amg-sedan', 'vehicle-mercedes-valente-premium-minibus', 'vehicle-volkswagen-crafter-premium-minibus'],
  default: ['vehicle-chrysler-super-stretch-limousine', 'vehicle-hummer-h2-stretch-limousine', 'vehicle-rolls-royce-phantom-sedan'],
};
function servicePage(slug, eyebrow) {
  const { fm, lines } = parseMd(slug);
  const h1 = (lines.find(l => /^#\s/.test(l)) || '# ' + (fm.title || slug)).replace(/^#\s+/, '');
  const fleetSlugs = SERVICE_FLEET[slug] || SERVICE_FLEET.default;
  return emit(slug, [
    head(fm, slug), header(pathFor(slug)), mobileNav(pathFor(slug)), '  <main>',
    pageHero(eyebrow || 'Services', h1, fm.description),
    proseSection('Show Limousines', lines, { dropFirstH1: true }),
    fleetGrid('Vehicles for your day.', 'A few of our most-requested vehicles — explore the full fleet for more.', fleetSlugs.map(s => VBY[s])),
    TESTIMONIALS, faq(), quoteForm('Get a quick quote.', 'Leave your details below and we’ll get back to you within the hour.'),
    '  </main>', footer(), FOOT_SCRIPT,
  ]);
}
function locationPage(slug) {
  const { fm, lines } = parseMd(slug);
  const h1 = (lines.find(l => /^#\s/.test(l)) || '# ' + (fm.title || slug)).replace(/^#\s+/, '');
  return emit(slug, [
    head(fm, slug), header(pathFor(slug)), mobileNav(pathFor(slug)), '  <main>',
    pageHero('Locations', h1, fm.description),
    proseSection('Show Limousines', lines, { dropFirstH1: true }),
    fleetGrid('Popular in your area.', 'Our most-booked vehicles for local weddings, formals and events.', ['vehicle-chrysler-super-stretch-limousine', 'vehicle-hummer-h2-stretch-limousine', 'vehicle-rolls-royce-phantom-sedan'].map(s => VBY[s])),
    TESTIMONIALS, quoteForm('Get a quick quote.', 'Tell us about your event and we’ll tailor a package.'),
    '  </main>', footer(), FOOT_SCRIPT,
  ]);
}
function vehiclePage(slug) {
  const { fm, lines } = parseMd(slug);
  const v = VBY[slug];
  const h1 = v ? v.name : (lines.find(l => /^#\s/.test(l)) || '#').replace(/^#\s+/, '');
  const others = VEHICLES.filter(x => x.slug !== slug).slice(0, 3);
  return emit(slug, [
    head(fm, slug), header(pathFor(slug)), mobileNav(pathFor(slug)), '  <main>',
    pageHero('Fleet · ' + (v ? v.badge : ''), h1, v ? ('Up to ' + v.pax + ' passengers · chauffeur-driven across Sydney & Wollongong.') : fm.description),
    `    <section class="feature"><div class="feature__inner">
        <div class="feature__media reveal"><img src="/${v ? v.img : 'show-limousines-s-mark.png'}" alt="${attr(h1)}" loading="lazy" decoding="async"></div>
        <div class="feature__copy reveal">
          <span class="label-bracket">${esc(v ? v.badge : 'Fleet')}</span>
          <h2 class="feature__title">${esc(h1)}</h2>
${proseFromLines(lines, { dropFirstH1: true })}
          <a href="/contact/" class="btn-pill btn-pill--gold">Enquire about this vehicle <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span></a>
        </div>
      </div></section>`,
    fleetGrid('More from our fleet.', 'Eleven vehicles in total — here are a few more you might like.', others),
    quoteForm('Enquire about this vehicle.', 'Leave your details and we’ll confirm availability and pricing.'),
    '  </main>', footer(), FOOT_SCRIPT,
  ]);
}
function categoryPage(slug, eyebrow, vehicles) {
  const { fm, lines } = parseMd(slug);
  const h1 = (lines.find(l => /^#\s/.test(l)) || '# ' + (fm.title || slug)).replace(/^#\s+/, '');
  return emit(slug, [
    head(fm, slug), header(pathFor(slug)), mobileNav(pathFor(slug)), '  <main>',
    pageHero(eyebrow || 'Fleet', h1, fm.description),
    proseSection('Show Limousines', lines, { dropFirstH1: true }),
    fleetGrid('Browse the range.', 'Tap any vehicle for full details, capacity and features.', vehicles),
    quoteForm('Get a quick quote.', 'Tell us which vehicle and occasion — we’ll do the rest.'),
    '  </main>', footer(), FOOT_SCRIPT,
  ]);
}
function infoPage(slug, eyebrow, extra) {
  const { fm, lines } = parseMd(slug);
  const h1 = (lines.find(l => /^#\s/.test(l)) || '# ' + (fm.title || slug)).replace(/^#\s+/, '');
  return emit(slug, [
    head(fm, slug), header(pathFor(slug)), mobileNav(pathFor(slug)), '  <main>',
    pageHero(eyebrow || 'About Us', h1, fm.description),
    proseSection(null, lines, { dropFirstH1: true }),
    ...(extra || []),
    '  </main>', footer(), FOOT_SCRIPT,
  ]);
}

/* ----- Build everything ----- */
const SERVICES = [
  ['wedding-limousine-sydney', 'Wedding Limousines'], ['wedding-limousine-hire-wollongong', 'Wedding Limousines'],
  ['wedding-limousine-shellharbour', 'Wedding Limousines'], ['wedding-cars-limousines', 'Wedding Limousines'],
  ['airport-limo-transfers-sydney', 'Services'], ['cruise-transfer-sydney', 'Services'], ['birthday-limousine-sydney', 'Services'],
  ['concert-limo-transfers-sydney', 'Services'], ['school-formal-limousine-hire-sydney', 'Services'], ['corporate-transfers', 'Services'],
  ['party-limousine-hire-sydney', 'Services'], ['hens-party-limo-sydney', 'Services'], ['funeral-limo-hire', 'Services'],
];
SERVICES.forEach(([s, e]) => servicePage(s, e));

['limo-hire-bankstown', 'limo-hire-campbelltown', 'limo-hire-eastern-suburbs', 'limo-hire-inner-west', 'limo-hire-liverpool', 'limo-hire-marrickville', 'limo-hire-northern-beaches', 'limo-hire-parramatta', 'limo-hire-penrith', 'limo-hire-sutherland-shire', 'limo-hire-wollongong'].forEach(locationPage);

VEHICLES.forEach(v => vehiclePage(v.slug));

categoryPage('chrysler-limo-hire-sydney', 'Fleet', VEHICLES.filter(v => v.badge === 'Chrysler'));
categoryPage('hummer-limo-hire-sydney', 'Fleet', VEHICLES.filter(v => v.badge === 'Hummer'));
categoryPage('rolls-royce-hire-sydney', 'Fleet', VEHICLES.filter(v => v.badge === 'Rolls Royce'));
categoryPage('fleet', 'Fleet', VEHICLES);
categoryPage('vehicles', 'Fleet', VEHICLES);

// services hub
(function () {
  const { fm, lines } = parseMd('services');
  emit('services', [head(fm, 'services'), header('/services/'), mobileNav('/services/'), '  <main>',
    pageHero('Services', 'Limousine services for every occasion.', fm.description),
    proseSection('Show Limousines', lines, { dropFirstH1: true }),
    quoteForm('Get a quick quote.'), '  </main>', footer(), FOOT_SCRIPT]);
})();

// informational
infoPage('about-us', 'About Us', [googleBadge(), TESTIMONIALS]);
infoPage('term-conditions', 'About Us');
infoPage('gallery', 'Gallery', [fleetGrid('Our fleet in pictures.', 'A look across the Show Limousines range.', VEHICLES)]);
infoPage('reviews', 'Reviews', [googleBadge(), TESTIMONIALS]);
// blog index + posts
(function () {
  const { fm } = parseMd('blog');
  const POSTS = [
    ['blog-dont-get-too-drunk', "Don't Get Too Drunk In Your Limo Ride"],
    ['blog-limousine-hire-costs-sydney', 'How Much Does It Cost to Hire a Limo in Sydney?'],
    ['blog-dos-and-donts', "The Do's and Don'ts When Rolling In a Limousine"],
    ['blog-wedding-limo-checklist', 'Wedding Limo Checklist: What to Plan and Prepare For'],
  ];
  const cards = POSTS.map(([s, t], i) => `          <article class="fleet-card reveal"><div class="fleet-card__media"><img class="fleet-card__img" src="/fleet-chrysler-${['white','black','gullwing','black-edition'][i % 4]}-v2.jpg" alt="${attr(t)}" loading="lazy"><span class="fleet-card__badge">Blog</span></div><div class="fleet-card__body"><span class="fleet-card__model">${esc(t)}</span><div class="fleet-card__footer"><a href="${pathFor(s)}" class="btn-outline-sm">Read Article</a></div></div></article>`).join('\n');
  emit('blog', [head(fm, 'blog'), header('/blog/'), mobileNav('/blog/'), '  <main>',
    pageHero('About Us · Blog', 'From the blog.', fm.description),
    `    <section class="fleet"><div class="beam" aria-hidden="true"></div><div class="fleet__inner"><div class="fleet__header reveal"><div><span class="label-bracket">Blog</span><h2 class="fleet__heading">Latest articles.</h2></div></div><div class="fleet__grid">\n${cards}\n        </div></div></section>`,
    '  </main>', footer(), FOOT_SCRIPT]);
  POSTS.forEach(([s]) => infoPage(s, 'Blog'));
})();

// contact
(function () {
  const { fm } = parseMd('contact');
  emit('contact', [head(fm, 'contact'), header('/contact/'), mobileNav('/contact/'), '  <main>',
    pageHero('Contact Us', "Let's plan your arrival.", fm.description || 'Tell us your event details and we’ll put together a tailored package.'),
    quoteForm('Tell us about your event.', 'Fill in the details below and we’ll send a personalised quote within the hour.'),
    mapSection('Servicing Sydney & Wollongong.'), '  </main>', footer(), FOOT_SCRIPT]);
})();

// thank-you
(function () {
  const { fm } = parseMd('thank-you');
  emit('thank-you', [head(fm.title ? fm : { title: 'Thank You | Show Limousines', description: 'Thanks for your enquiry — we’ll be in touch shortly.' }, 'thank-you'),
    header('#'), mobileNav('#'), '  <main>',
    pageHero('Thank You', 'Thank you — we’ll be in touch.', 'Your enquiry has been received. Our team will get back to you within the hour. For anything urgent call ' + PHONE + '.'),
    `    <section class="home-cta"><div class="home-cta__inner reveal"><span class="label-bracket">Show Limousines</span><h2 class="home-cta__title">While you wait, explore the fleet</h2><div class="home-cta__actions"><a href="/fleet/" class="btn-pill btn-pill--gold">View the Fleet <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span></a><a href="/" class="btn-outline-sm">Back to Home</a></div></div></section>`,
    '  </main>', footer(), FOOT_SCRIPT]);
})();

// sitemap
(function () {
  const groups = [
    ['Main', [['Home', '/'], ['Services', '/services/'], ['Fleet', '/fleet/'], ['Our Vehicles', '/vehicles/'], ['About Us', '/about-us/'], ['Gallery', '/gallery/'], ['Reviews', '/reviews/'], ['Blog', '/blog/'], ['Terms & Conditions', '/term-conditions/'], ['Contact', '/contact/']]],
    ['Services', NAV[2].children.map(c => [c.label, c.href]).concat([['Wedding Car Hire Sydney', '/wedding-limousine-sydney/'], ['Wedding Car Hire Wollongong', '/wedding-limousine-hire-wollongong/'], ['Wedding Limousine Shellharbour', '/wedding-limousine-shellharbour/'], ['Funeral Limo Hire', '/funeral-limo-hire/']])],
    ['Fleet', [['Chrysler', '/chrysler-limo-hire-sydney/'], ['Hummer', '/hummer-limo-hire-sydney/'], ['Rolls Royce', '/rolls-royce-hire-sydney/']].concat(VEHICLES.map(v => [v.name, v.url]))],
    ['Locations', NAV[5].children.map(c => [c.label, c.href])],
  ];
  const html = groups.map(g => `          <div class="prose"><h2 class="prose__h2">${g[0]}</h2><ul class="prose__list">${g[1].map(l => `<li><a href="${l[1]}">${esc(l[0])}</a></li>`).join('')}</ul></div>`).join('\n');
  emit('sitemap', [head({ title: 'Sitemap | Show Limousines', description: 'All pages on the Show Limousines website.' }, 'sitemap'),
    header('/sitemap/'), mobileNav('/sitemap/'), '  <main>', pageHero('Sitemap', 'Sitemap.', 'Every page on the Show Limousines site.'),
    `    <section class="prose"><div class="prose__inner reveal">\n${html}\n      </div></section>`, '  </main>', footer(), FOOT_SCRIPT]);
})();

/* ---------------- Patch the home page (header/mobile/footer/quote form) ---------------- */
(function patchHome() {
  let h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  h = h.replace(/<header class="nav-wrap"[\s\S]*?<\/header>/, header('/'));
  h = h.replace(/<div class="nav-mobile"[\s\S]*?<\/div>\s*(?=<main>)/, mobileNav('/') + '\n  ');
  h = h.replace(/<footer class="foot"[\s\S]*?<\/footer>/, footer());
  // point the home quote <form> at Web3Forms
  h = h.replace(/<form class="quote-form[^"]*"[^>]*id="quoteForm"[^>]*>/, `<form class="quote-form reveal" id="quoteForm" action="https://api.web3forms.com/submit" method="POST">\n            <input type="hidden" name="access_key" value="${WEB3FORMS_KEY}">\n            <input type="hidden" name="subject" value="New Show Limousines enquiry">\n            <input type="hidden" name="from_name" value="Show Limousines Website">\n            <input type="hidden" name="redirect" value="${SITE}/thank-you/">\n            <input type="checkbox" name="botcheck" class="visually-hidden" style="display:none" tabindex="-1" autocomplete="off">`);
  // root-relative shared assets
  h = h.replace('href="styles.css"', 'href="/styles.css"').replace('src="main.js"', 'src="/main.js"');
  fs.writeFileSync(path.join(ROOT, 'index.html'), h, 'utf8');
  written.push('/ (home patched)');
})();

console.log('Emitted ' + written.length + ' pages.');
written.forEach(w => console.log('  ' + w));
