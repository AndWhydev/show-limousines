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

/* ---------------- Responsive images (Commit 2 — high-res standard) ----------------
   Every <img> whose source has generated derivatives (see gen-images.js +
   assets/img-manifest.json) is rewritten into a <picture> with AVIF + WebP
   srcset at >=2x widths and the original JPEG as a fallback. width/height are
   stamped to prevent layout shift. Idempotent via the data-r marker, so it is
   safe to run over the already-built home page on every rebuild. */
let IMG_MANIFEST = {};
try { IMG_MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'img-manifest.json'), 'utf8')); }
catch { console.warn('  (no img-manifest.json — run `node gen-images.js` for responsive images)'); }
function _srcset(base, ext, widths) { return widths.map(w => `/assets/img/${base}-${w}.${ext} ${w}w`).join(', '); }
function responsify(html) {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    if (tag.includes('data-r')) return tag;
    const m = tag.match(/\ssrc="\/?([^"]+)"/);
    if (!m) return tag;
    const file = m[1].split('/').pop().split('?')[0];
    const e = IMG_MANIFEST[file];
    if (!e) return tag;
    const sizes = (tag.match(/\ssizes="([^"]*)"/) || [])[1] || '(max-width:700px) 100vw, 33vw';
    let img = tag.replace('<img', '<img data-r');
    if (!/\ssizes=/.test(img)) img = img.replace('<img', `<img sizes="${sizes}"`);
    if (!/\swidth=/.test(img)) img = img.replace('<img', `<img width="${e.w}" height="${e.h}"`);
    return '<picture>'
      + `<source type="image/avif" srcset="${_srcset(e.base, 'avif', e.widths)}" sizes="${sizes}">`
      + `<source type="image/webp" srcset="${_srcset(e.base, 'webp', e.widths)}" sizes="${sizes}">`
      + img + '</picture>';
  });
}

/* ---------------- Vehicles ---------------- */
/* Canonical fleet order (Commit 3) — used everywhere the fleet is listed.
   Home grid is auto-sorted to this order in patchHome(). */
const VEHICLES = [
  { slug: 'vehicle-hummer-stretch-limousine', name: 'Stretch Hummer (14 Pax)', img: 'fleet-hummer-green-v2.jpg', badge: 'Hummer', pax: 14 },
  { slug: 'vehicle-hummer-h2-stretch-limousine', name: 'Stretch Hummer (16 Pax)', img: 'fleet-hummer-white-v2.jpg', badge: 'Hummer', pax: 16 },
  { slug: 'vehicle-mercedes-sprinter-limo-van', name: 'Mercedes Sprinter Limo Van', img: 'fleet-mercedes-sprinter-v2.jpg', badge: 'Mercedes', pax: 14 },
  { slug: 'vehicle-gullwing-chrysler-super-stretch-limousine', name: 'Chrysler Super Stretch Gullwing', img: 'fleet-chrysler-gullwing-v2.jpg', badge: 'Chrysler', pax: 10 },
  { slug: 'vehicle-black-edition-chrysler-super-stretch-limousine', name: 'Chrysler Super Stretch (Black Edition)', img: 'fleet-chrysler-black-edition-v2.jpg', badge: 'Chrysler', pax: 10 },
  { slug: 'vehicle-chrysler-super-stretch-limousine', name: 'White Chrysler Super Stretch', img: 'fleet-chrysler-white-v2.jpg', badge: 'Chrysler', pax: 10 },
  { slug: 'vehicle-black-chrysler-super-stretch-limousine', name: 'Black Chrysler Super Stretch', img: 'fleet-chrysler-black-v2.jpg', badge: 'Chrysler', pax: 10 },
  { slug: 'vehicle-rolls-royce-phantom-sedan', name: 'Rolls Royce Phantom', img: 'fleet-rolls-royce-phantom-v2.jpg', badge: 'Rolls Royce', pax: 4 },
  { slug: 'vehicle-mercedes-s-class-amg-sedan', name: 'Mercedes S Class AMG Line Sedan', img: 'fleet-mercedes-s-class-v2.jpg', badge: 'Mercedes', pax: 4 },
  { slug: 'vehicle-volkswagen-crafter-premium-minibus', name: 'VW Crafter Luxury Minibus', img: 'fleet-vw-crafter-v2.jpg', badge: 'Volkswagen', pax: 11 },
  { slug: 'vehicle-mercedes-valente-premium-minibus', name: 'Mercedes Valente Luxury Minivan', img: 'fleet-mercedes-valente-v2.jpg', badge: 'Mercedes', pax: 7 },
];
const VBY = {}; VEHICLES.forEach(v => { VBY[v.slug] = v; v.url = '/vehicle/' + v.slug.replace(/^vehicle-/, '') + '/'; });
function vurl(slug) { return '/vehicle/' + slug.replace(/^vehicle-/, '') + '/'; }

/* ---------------- Nav mega-menu config (§2.1) ---------------- */
const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Wedding Cars', href: '/wedding-limousine-sydney/', children: [
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
    <nav class="nav-main" role="navigation" aria-label="Primary">
      <div class="nav-inner">
        <a href="/" class="nav-brand" aria-label="Show Limousines — Sydney's Premier Luxury Transport — home">
          <picture>
            <source media="(max-width: 640px)" srcset="/assets/show-logo-new.svg">
            <img src="/assets/show-logo-new.svg" alt="Show Limousines" class="nav-brand__logo" width="1472" height="272">
          </picture>
        </a>
        <div class="nav-pills" role="menubar">
${pills}
        </div>
        <div class="nav-right">
          <a href="tel:${TEL}" class="btn-pill nav-call" aria-label="Call Show Limousines on ${PHONE}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call
          </a>
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
            <div class="foot__brand"><img src="/assets/show-logo-new.svg" alt="Show Limousines" class="foot__brand-logo" width="1472" height="272"></div>
            <p class="foot__tag">Show Limousines provides luxury wedding cars, stretch limousines, chauffeur services and limo vans throughout Sydney and Wollongong. Our fleet includes Rolls Royce, Chrysler Stretch Limousines, Hummer Limousines, Mercedes vehicles for weddings, formals, birthdays, hen's parties, concert transfers and special events.</p>
            <span class="foot__socials-label">Follow Us</span>
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

/* ---------------- Sub-footer link block (site-wide, identical on every page) ----
   Two columns — Services + Locations — rendered below the main footer on every
   page from this single shared component. Kept idempotent on the home page by the
   patchHome() regex, which also swallows any previously-emitted sub-foot. */
const SUBFOOT_SERVICES = [
  ['Wedding Car Hire', '/wedding-limousine-sydney/'],
  ['Airport Transfers', '/airport-limo-transfers-sydney/'],
  ['Cruise Transfers', '/cruise-transfer-sydney/'],
  ['Birthday Limos', '/birthday-limousine-sydney/'],
  ['Concert Transfers', '/concert-limo-transfers-sydney/'],
  ['School Formal Limos', '/school-formal-limousine-hire-sydney/'],
  ['Corporate Transfers', '/corporate-transfers/'],
  ['Party Limos', '/party-limousine-hire-sydney/'],
  ["Hen's Party Limos", '/hens-party-limo-sydney/'],
];
const SUBFOOT_LOCATIONS = [
  ['Bankstown', '/limo-hire-bankstown/'],
  ['Campbelltown', '/limo-hire-campbelltown/'],
  ['Eastern Suburbs', '/limo-hire-eastern-suburbs/'],
  ['Inner West', '/limo-hire-inner-west/'],
  ['Liverpool', '/limo-hire-liverpool/'],
  ['Marrickville', '/limo-hire-marrickville/'],
  ['Northern Beaches', '/limo-hire-northern-beaches/'],
  ['Parramatta', '/limo-hire-parramatta/'],
  ['Penrith', '/limo-hire-penrith/'],
  ['Sutherland Shire', '/limo-hire-sutherland-shire/'],
  ['Wollongong', '/limo-hire-wollongong/'],
];
function subFootCol(title, links) {
  return `        <nav class="sub-foot__col" aria-label="${attr(title)}">
          <h2 class="sub-foot__title">${esc(title)}</h2>
          <ul class="sub-foot__list">
${links.map(l => `            <li><a href="${l[1]}">${esc(l[0])}</a></li>`).join('\n')}
          </ul>
        </nav>`;
}
function subFooter() {
  return `    <aside class="sub-foot" aria-label="Services and locations">
      <div class="sub-foot__inner">
${subFootCol('Services', SUBFOOT_SERVICES)}
${subFootCol('Locations', SUBFOOT_LOCATIONS)}
      </div>
    </aside>`;
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
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${attr(ogt)}">
  <meta name="twitter:description" content="${attr(ogd)}">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" href="/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="https://unpkg.com/lenis@1.0.45/dist/lenis.min.js"></script>
  <script src="https://unpkg.com/split-type"></script>
  <link rel="stylesheet" href="/styles.css?v=20260630a">
</head>
<body>`;
}
const FOOT_SCRIPT = `  <script src="/main.js"></script>\n</body>\n</html>`;

/* ---------------- Section builders ---------------- */
/* Per-page header banner (restored from commit 8e5c377^, the last build before the
   06-23 regeneration dropped them). Each entry: [image, --hero-pos | null, carzoom?].
   Layout/classes/CSS are unchanged from that commit — only the per-page wording (h1/sub)
   comes from the current content. The home page hero and the bespoke
   /wedding-limousine-sydney/ hero are intentionally NOT in this map. */
const BANNER = {
  // Wedding service pages
  // Hero uses the right-facing shot of the same Gullwing limo (front points right;
  // 'SHOW LIMOUSINES' plate reads correctly). The left-facing banner-wedding-chrysler-gullwing.jpg
  // had a readable 'D1·SHOW' plate that a flip would mirror, so it is not used here.
  'wedding-limousine-sydney': ['fleet-chrysler-gullwing-v2.jpg', '50%', true],
  'wedding-limousine-hire-wollongong': ['banner-wedding-chrysler-white.jpg', '50%', true],
  'wedding-limousine-shellharbour': ['banner-wedding-mercedes-s-class.jpg', '50%', false],
  'wedding-cars-limousines': ['banner-wedding-rolls-royce.jpg', '50%', false],
  // Service pages
  'airport-limo-transfers-sydney': ['banner-service-airport-cruise.jpg', '66%', false],
  'cruise-transfer-sydney': ['banner-service-airport-cruise.jpg', '74%', false],
  'birthday-limousine-sydney': ['banner-service-birthday.jpg', '58%', false],
  'concert-limo-transfers-sydney': ['banner-service-concert.jpg', '58%', false],
  'school-formal-limousine-hire-sydney': ['banner-service-school-formal.jpg', null, false],
  'corporate-transfers': ['banner-service-corporate.jpg', '50%', false],
  'party-limousine-hire-sydney': ['banner-service-partybus.jpg', '58%', false],
  'hens-party-limo-sydney': ['banner-service-hensbucks.jpg', '58%', false],
  'funeral-limo-hire': ['banner-service-funeral.jpg', null, false],
  // Location pages
  'limo-hire-bankstown': ['banner-fleet-chrysler-white-v2.jpg', '50%', true],
  'limo-hire-campbelltown': ['banner-fleet-chrysler-black-v2.jpg', '50%', true],
  'limo-hire-eastern-suburbs': ['banner-fleet-rolls-royce-phantom-v2.jpg', '50%', true],
  'limo-hire-inner-west': ['banner-fleet-chrysler-gullwing-v2.jpg', '50%', true],
  'limo-hire-liverpool': ['banner-fleet-mercedes-s-class-v2.jpg', '50%', true],
  'limo-hire-marrickville': ['banner-fleet-hummer-white-v2.jpg', '50%', true],
  'limo-hire-northern-beaches': ['banner-fleet-mercedes-valente-v2.jpg', '50%', true],
  'limo-hire-parramatta': ['banner-fleet-chrysler-black-edition-v2.jpg', '50%', true],
  'limo-hire-penrith': ['banner-fleet-chrysler-gullwing-v2.jpg', '50%', true],
  'limo-hire-sutherland-shire': ['banner-fleet-rolls-royce-phantom-v2.jpg', '50%', true],
  'limo-hire-wollongong': ['banner-hero-gullwing-poster.jpg', '50%', true],
  // Vehicle pages
  'vehicle-hummer-stretch-limousine': ['banner-fleet-hummer-green-v2.jpg', '50%', true],
  'vehicle-hummer-h2-stretch-limousine': ['banner-fleet-hummer-white-v2.jpg', '50%', true],
  'vehicle-mercedes-sprinter-limo-van': ['banner-fleet-mercedes-sprinter-v2.jpg', '50%', true],
  'vehicle-gullwing-chrysler-super-stretch-limousine': ['banner-fleet-chrysler-gullwing-v2.jpg', '50%', true],
  'vehicle-black-edition-chrysler-super-stretch-limousine': ['banner-fleet-chrysler-black-edition-v2.jpg', '50%', true],
  'vehicle-chrysler-super-stretch-limousine': ['banner-fleet-chrysler-white-v2.jpg', '50%', true],
  'vehicle-black-chrysler-super-stretch-limousine': ['banner-fleet-chrysler-black-v2.jpg', '50%', true],
  'vehicle-rolls-royce-phantom-sedan': ['banner-fleet-rolls-royce-phantom-v2.jpg', '50%', true],
  'vehicle-mercedes-s-class-amg-sedan': ['banner-fleet-mercedes-s-class-v2.jpg', '50%', true],
  'vehicle-volkswagen-crafter-premium-minibus': ['banner-fleet-vw-crafter-v2.jpg', '50%', true],
  'vehicle-mercedes-valente-premium-minibus': ['banner-fleet-mercedes-valente-v2.jpg', '50%', true],
  // Fleet category pages
  'chrysler-limo-hire-sydney': ['banner-fleet-chrysler-black-v2.jpg', '50%', true],
  'hummer-limo-hire-sydney': ['banner-fleet-hummer-white-v2.jpg', '50%', true],
  'rolls-royce-hire-sydney': ['banner-fleet-rolls-royce-phantom-v2.jpg', '50%', true],
  'fleet': ['banner-fleet-chrysler-gullwing-v2.jpg', '50%', true],
  'vehicles': ['banner-fleet-chrysler-gullwing-v2.jpg', '50%', false],
  // Hubs / informational
  'services': ['banner-fleet-chrysler-white-v2.jpg', null, false],
  'about-us': ['banner-fleet-rolls-royce-phantom-v2.jpg', '50%', true],
  'term-conditions': ['banner-fleet-mercedes-s-class-v2.jpg', '50%', true],
  'gallery': ['banner-hero-gullwing-poster.jpg', '50%', true],
  'reviews': ['banner-fleet-rolls-royce-phantom-v2.jpg', '50%', true],
  'blog': ['banner-hero-gullwing-poster.jpg', '50%', true],
  'contact': ['banner-fleet-chrysler-black-v2.jpg', '50%', true],
  'thank-you': ['banner-hero-gullwing-poster.jpg', '50%', false],
  'sitemap': ['banner-fleet-chrysler-white-v2.jpg', '50%', false],
  // Blog posts
  'blog-dont-get-too-drunk': ['banner-service-partybus.jpg', '50%', false],
  'blog-limousine-hire-costs-sydney': ['banner-fleet-chrysler-black-v2.jpg', '50%', false],
  'blog-dos-and-donts': ['banner-fleet-chrysler-gullwing-v2.jpg', '50%', false],
  'blog-wedding-limo-checklist': ['banner-wedding-chrysler-gullwing.jpg', '50%', false],
};
function bannerFor(slug) { const b = BANNER[slug]; return b ? { img: b[0], pos: b[1], zoom: b[2] } : null; }

/* Page header banner — exact structure/classes from the restore commit (no eyebrow;
   h1 forced to wrap; optional sub). `banner` is the bannerFor(slug) config. */
function pageHero(eyebrow, h1, sub, banner) {
  const b = banner && banner.img ? banner : null;
  const cls = 'page-hero' + (b ? ' page-hero--toptext' + (b.zoom ? ' page-hero--carzoom' : '') : '');
  const style = b ? ` style="--hero-img:url('/${b.img}')${b.pos ? `;--hero-pos:${b.pos}` : ''}"` : '';
  return `    <section class="${cls}"${style} aria-label="${attr(h1)}">
      <div class="page-hero__inner reveal">
        <h1 class="page-hero__title" style="white-space:normal">${esc(h1)}</h1>
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
          <p class="quote__sub">${esc(sub || 'Leave your details below and we’ll send a personalised quote.')} Or call <a href="tel:${TEL}" style="color:var(--color-accent);">${PHONE}</a>.</p>
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
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg></span><div><span class="quote-aside__label">Service area</span> <span class="quote-aside__value">Greater Sydney &amp; Wollongong</span></div></div>
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span><div><span class="quote-aside__label">Phone</span> <a href="tel:${TEL}" class="quote-aside__value">${PHONE}</a></div></div>
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg></span><div><span class="quote-aside__label">Email</span> <a href="mailto:${EMAIL}" class="quote-aside__value">${EMAIL}</a></div></div>
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span><div><span class="quote-aside__label">Reviews</span> <span class="quote-aside__value">165+ five-star Google reviews</span></div></div>
            <div class="quote-aside__row"><span class="quote-aside__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span><div><span class="quote-aside__label">Hours</span> <span class="quote-aside__value">365 days a year</span></div></div>
          </aside>
        </div>
      </div>
    </section>`;
}

const TESTIMONIALS = require('./content/_testimonials.js');
/* Verbatim snapshot of the Home page's testimonials section — used (unchanged) on the
   Services pages so they match the Home page exactly (the _testimonials.js component has
   since diverged, e.g. 165+ vs the Home page's 160+). */
const HOME_TESTI = '    ' + fs.readFileSync(path.join(ROOT, 'content', '_home-testi.html'), 'utf8').trim();
const HOME_FAQ = '    ' + fs.readFileSync(path.join(ROOT, 'content', '_home-faq.html'), 'utf8').trim();
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
function fleetGrid(heading, intro, vehicles, opts) {
  // opts.cta === true swaps the subtle "View Full Fleet" link for a prominent,
  // site-standard gold pill button (used on the service pages' vehicle section).
  const foot = opts && opts.cta
    ? `        <div class="fleet__cta"><a href="/fleet/" class="btn-pill btn-pill--gold btn-magnetic">View Fleet <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span></a></div>`
    : `        <a href="/fleet/" class="fleet__viewall">View Full Fleet <span class="arrow" aria-hidden="true">${ARROW}</span></a>`;
  return `    <section class="fleet" aria-labelledby="fleetGridHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="fleet__inner">
        <div class="fleet__header reveal"><div><span class="label-bracket">Our Fleet</span><h2 class="fleet__heading" id="fleetGridHeading">${esc(heading)}</h2></div><p class="fleet__intro">${esc(intro)}</p></div>
        <div class="fleet__grid">
${vehicles.map(fleetCard).join('\n')}
        </div>
${foot}
      </div>
    </section>`;
}

/* "Our Fleet" sliding carousel — shows ~3 cards at a time and slides through the rest
   (the same .fleetcar component used in the service-page vehicle section; init by main.js). */
const CAR_ARROW_L = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const CAR_ARROW_R = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
function fleetCarousel(heading, intro, vehicles) {
  const cards = vehicles.map(v => `              <article class="fleet-card">
                <div class="fleet-card__media"><img class="fleet-card__img" src="/${v.img}" alt="${attr(v.name)}" loading="lazy" decoding="async"><span class="fleet-card__badge">${esc(v.badge)}</span></div>
                <div class="fleet-card__body"><span class="fleet-card__brand">${esc(v.badge)}</span><span class="fleet-card__model">${esc(v.name)}</span><span class="fleet-card__capacity">Up to ${v.pax} passengers</span><div class="fleet-card__footer"><a href="${v.url}" class="btn-outline-sm">View Details</a></div></div>
              </article>`).join('\n');
  return `    <section class="fleet" aria-labelledby="ourFleetHead">
      <div class="beam" aria-hidden="true"></div>
      <div class="fleet__inner">
        <div class="fleet__header reveal"><div><span class="label-bracket">Our Fleet</span><h2 class="fleet__heading" id="ourFleetHead">${esc(heading)}</h2></div><p class="fleet__intro">${esc(intro)}</p></div>
        <div class="fleetcar" role="group" aria-roledescription="carousel" aria-label="Our fleet">
          <div class="fleetcar__viewport">
            <div class="fleetcar__track">
${cards}
            </div>
          </div>
          <button class="fleetcar__btn fleetcar__btn--prev" type="button" aria-label="Previous vehicles">${CAR_ARROW_L}</button>
          <button class="fleetcar__btn fleetcar__btn--next" type="button" aria-label="Next vehicles">${CAR_ARROW_R}</button>
        </div>
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
        <div class="about__copy reveal"><span class="label-bracket">Reviews</span><h2 class="about__heading">Trusted by 165+ Five-Star reviews.</h2><p class="about__body">From weddings and formals to airport transfers and milestone birthdays, our clients keep coming back — and leaving five-star reviews on Google.</p><a href="https://www.google.com/search?q=Show+Limousines+Sydney+reviews" target="_blank" rel="noopener noreferrer" class="btn-pill btn-pill--gold btn-magnetic">All Google Reviews <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span></a></div>
        <aside class="google-badge reveal" aria-label="Google reviews rating">
          <div class="google-badge__head"><span class="google-badge__logo" aria-hidden="true"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg></span><span class="google-badge__title">Google Reviews</span></div>
          <div class="google-badge__score"><span class="google-badge__num">5.0</span><div class="google-badge__stars"><span class="google-badge__stars-row" aria-label="Rated 5 out of 5 stars">★★★★★</span><span class="google-badge__count"><strong>165+</strong> verified reviews</span></div></div>
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
/* Pages restored to their OLD (5ca3cb4) hand-built layout and EJECTED from this
   generator — their static index.html is owned by restore.js. emit() skips them so
   `node build.js` can never re-flatten them. Shared chrome on them is kept in sync by
   stamp-chrome.js, which uses this same module's header()/footer()/subFooter(). */
const RESTORE_SLUGS = new Set([
  'wedding-cars-limousines', 'wedding-limousine-sydney', 'wedding-limousine-hire-wollongong',
  'airport-limo-transfers-sydney', 'cruise-transfer-sydney', 'birthday-limousine-sydney',
  'concert-limo-transfers-sydney', 'school-formal-limousine-hire-sydney', 'corporate-transfers',
  'party-limousine-hire-sydney', 'hens-party-limo-sydney',
  'fleet', 'vehicles', 'chrysler-limo-hire-sydney', 'hummer-limo-hire-sydney', 'rolls-royce-hire-sydney',
  ...VEHICLES.map(v => v.slug),
  'about-us', 'gallery', 'blog', 'reviews', 'term-conditions',
  'limo-hire-bankstown', 'limo-hire-campbelltown', 'limo-hire-eastern-suburbs', 'limo-hire-inner-west',
  'limo-hire-liverpool', 'limo-hire-marrickville', 'limo-hire-northern-beaches', 'limo-hire-parramatta',
  'limo-hire-penrith', 'limo-hire-sutherland-shire', 'limo-hire-wollongong',
  'contact',
]);

/* PINNED — pages frozen verbatim at commit 8bc9c70 (2026-06-21) by request. NOTHING in the
   build pipeline rewrites them: emit() skips PINNED (so build.js never regenerates them, incl.
   the generator-built blog posts), and restore.js + stamp-chrome.js also skip PINNED. Their
   index.html on disk is the committed 06-21 version, period. To bring a page back under the
   generator, remove its slug from PINNED. */
const PINNED = new Set([
  // Fleet pages (frozen earlier)
  'fleet', 'vehicles', 'chrysler-limo-hire-sydney', 'hummer-limo-hire-sydney', 'rolls-royce-hire-sydney',
  ...VEHICLES.map(v => v.slug),
  // About Us group (static + the 4 generator-built blog posts)
  'about-us', 'gallery', 'blog', 'reviews', 'term-conditions',
  'blog-dont-get-too-drunk', 'blog-limousine-hire-costs-sydney', 'blog-dos-and-donts', 'blog-wedding-limo-checklist',
  // Locations group
  'limo-hire-bankstown', 'limo-hire-campbelltown', 'limo-hire-eastern-suburbs', 'limo-hire-inner-west',
  'limo-hire-liverpool', 'limo-hire-marrickville', 'limo-hire-northern-beaches', 'limo-hire-parramatta',
  'limo-hire-penrith', 'limo-hire-sutherland-shire', 'limo-hire-wollongong',
  // Contact
  'contact',
]);

function emit(slug, parts) {
  if (RESTORE_SLUGS.has(slug) || PINNED.has(slug)) return; // frozen/ejected — build.js must not write these
  const p = pathFor(slug);
  const dir = p === '/' ? ROOT : path.join(ROOT, p.replace(/^\/|\/$/g, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), responsify(parts.filter(Boolean).join('\n') + '\n'), 'utf8');
  written.push(p);
}

/* ---------------- Page assembly ---------------- */
const SERVICE_FLEET = {
  'wedding-limousine-sydney': ['vehicle-rolls-royce-phantom-sedan', 'vehicle-chrysler-super-stretch-limousine', 'vehicle-mercedes-s-class-amg-sedan'],
  // Airport: white Chrysler super stretch replaces the Mercedes Valente as the featured vehicle.
  'airport-limo-transfers-sydney': ['vehicle-mercedes-s-class-amg-sedan', 'vehicle-chrysler-super-stretch-limousine', 'vehicle-volkswagen-crafter-premium-minibus'],
  default: ['vehicle-chrysler-super-stretch-limousine', 'vehicle-hummer-h2-stretch-limousine', 'vehicle-rolls-royce-phantom-sedan'],
};

/* Per-service-page extras: the "Why Choose Our … Service" heading (icon strip added
   to each service page) and an optional exact hero subheading override. Only slugs
   listed here receive the why-choose strip and the prominent "View Fleet" button. */
const SERVICE_INFO = {
  'airport-limo-transfers-sydney': { why: 'Why Choose Our Airport Transfer Service', sub: 'Private airport transfers across Sydney and Wollongong with professional chauffeurs and luxury vehicles' },
  'cruise-transfer-sydney': { why: 'Why Choose Our Cruise Transfer Service', sub: 'Luxury cruise terminal transfers with professional chauffeurs across Sydney and Wollongong' },
  'birthday-limousine-sydney': { why: 'Why Choose Our Birthday Limo Service' },
  'concert-limo-transfers-sydney': { why: 'Why Choose Our Concert Transfer Service' },
  'school-formal-limousine-hire-sydney': { why: 'Why Choose Our School Formal Service' },
  'corporate-transfers': { why: 'Why Choose Our Corporate Transfer Service' },
  'party-limousine-hire-sydney': { why: 'Why Choose Our Party Limo Service' },
  'hens-party-limo-sydney': { why: "Why Choose Our Hen's Party Service" },
};
function servicePage(slug, eyebrow) {
  const { fm, lines } = parseMd(slug);
  const h1 = (lines.find(l => /^#\s/.test(l)) || '# ' + (fm.title || slug)).replace(/^#\s+/, '');
  const fleetSlugs = SERVICE_FLEET[slug] || SERVICE_FLEET.default;
  const info = SERVICE_INFO[slug];
  const sub = (info && info.sub) || fm.description;
  return emit(slug, [
    head(fm, slug), header(pathFor(slug)), mobileNav(pathFor(slug)), '  <main>',
    pageHero(eyebrow || 'Services', h1, sub, bannerFor(slug)),
    info ? whyChooseService(info.why) : null,
    proseSection('Show Limousines', lines, { dropFirstH1: true }),
    fleetGrid('Vehicles for your day.', 'A few of our most-requested vehicles — explore the full fleet for more.', fleetSlugs.map(s => VBY[s]), { cta: !!info }),
    TESTIMONIALS, faq(), quoteForm('Get a quick quote.', 'Leave your details below and we will get back to you as soon as possible.'),
    '  </main>', footer(), FOOT_SCRIPT,
  ]);
}
function locationPage(slug) {
  const { fm, lines } = parseMd(slug);
  const h1 = (lines.find(l => /^#\s/.test(l)) || '# ' + (fm.title || slug)).replace(/^#\s+/, '');
  return emit(slug, [
    head(fm, slug), header(pathFor(slug)), mobileNav(pathFor(slug)), '  <main>',
    pageHero('Locations', h1, fm.description, bannerFor(slug)),
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
    pageHero('Fleet · ' + (v ? v.badge : ''), h1, v ? ('Up to ' + v.pax + ' passengers · chauffeur-driven across Sydney & Wollongong.') : fm.description, bannerFor(slug)),
    `    <section class="feature"><div class="feature__inner">
        <div class="feature__media reveal"><img src="/${v ? v.img : 'logo.png'}" alt="${attr(h1)}" sizes="(max-width:900px) 100vw, 50vw" loading="lazy" decoding="async"></div>
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
    pageHero(eyebrow || 'Fleet', h1, fm.description, bannerFor(slug)),
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
    pageHero(eyebrow || 'About Us', h1, fm.description, bannerFor(slug)),
    proseSection(null, lines, { dropFirstH1: true }),
    ...(extra || []),
    '  </main>', footer(), FOOT_SCRIPT,
  ]);
}

/* ============================================================
   Wedding Car Hire Sydney (/wedding-limousine-sydney/) — bespoke page.
   This route gets a richer, hand-built layout instead of the generic
   servicePage() template: photo hero, an icon "why-choose" strip, tightened
   copy, photographed package cards, a luxury-fleet grid (Gullwing as the
   headline Chrysler) and the shared homepage "How It Works" steps.
   ============================================================ */
const IC_USER = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>';
const IC_AWARD = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.12"/></svg>';
const IC_CLOCK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const IC_PIN = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg>';

function whyChoose() {
  const cards = [
    ['Professional Chauffeurs', 'Uniformed, experienced drivers who look after your bridal party all day.', IC_USER],
    ['Red Carpet Service', 'Champagne, white satin ribbon and the full VIP treatment for the bride.', IC_AWARD],
    ['On Time & Reliable', 'Early arrivals, planned run sheets, every stop on schedule.', IC_CLOCK],
    ['Sydney Wedding Specialists', 'Local experts who know every venue across Sydney & Wollongong.', IC_PIN],
  ].map(([t, s, ic]) => `          <div class="trust__item">
            <span class="trust__icon">${ic}</span>
            <div class="trust__body"><span class="trust__head">${esc(t)}</span><span class="trust__sub">${esc(s)}</span></div>
          </div>`).join('\n');
  return `    <section class="fleet trust--why" aria-labelledby="whyHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="fleet__inner">
        <div class="fleet__header reveal"><div><span class="label-bracket">Why Show Limousines</span><h2 class="fleet__heading" id="whyHeading">Why couples choose Show Limousines</h2></div></div>
        <div class="trust__inner">
${cards}
        </div>
      </div>
    </section>`;
}

/* Service-page "Why Choose Our … Service" strip — same icon-card layout as the
   wedding whyChoose(), with a per-page heading. Generic cards that fit every
   transfer/event service. */
function whyChooseService(heading) {
  const cards = [
    ['Professional Chauffeurs', 'Uniformed, experienced drivers who get you there relaxed and on time.', IC_USER],
    ['Luxury Fleet', 'Immaculate, air-conditioned vehicles with leather seats, refreshments and Bluetooth.', IC_AWARD],
    ['On Time, Every Time', "Punctual pick-ups and planned routes, so you're never left waiting.", IC_CLOCK],
    ['Sydney & Wollongong', 'Local chauffeurs covering every suburb, terminal and venue.', IC_PIN],
  ].map(([t, s, ic]) => `          <div class="trust__item">
            <span class="trust__icon">${ic}</span>
            <div class="trust__body"><span class="trust__head">${esc(t)}</span><span class="trust__sub">${esc(s)}</span></div>
          </div>`).join('\n');
  return `    <section class="fleet trust--why" aria-labelledby="whyHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="fleet__inner">
        <div class="fleet__header reveal"><div><span class="label-bracket">Why Show Limousines</span><h2 class="fleet__heading" id="whyHeading">${esc(heading)}</h2></div></div>
        <div class="trust__inner">
${cards}
        </div>
      </div>
    </section>`;
}

/* Standard inclusions every package gets — appended only where not already present
   (semantic match), so existing wording is left untouched and nothing is duplicated. */
const PKG_STD = [
  ['Uniformed Chauffeurs', /uniformed chauffeur/i],
  ['Red carpet', /red carpet/i],
  ['White satin ribbon on all cars', /satin ribbon/i],
  ['Chilled bottled water', /bottled water/i],
  ['2 bottles of sparkling wine', /sparkling wine/i],
];
function withStdInclusions(list) {
  const have = list.join(' | ');
  return list.concat(PKG_STD.filter(([, re]) => !re.test(have)).map(([txt]) => txt));
}
/* opts.noHummerStretch — drop the Hummer Stretch Limousine package (Wollongong).
   opts.platinumImg — override the Platinum photo (Wollongong: white sedan, no Hummer photo). */
function weddingPackages(opts) {
  opts = opts || {};
  let PKGS = [
    { title: 'Chrysler Limousine Package', badge: 'Chrysler', img: 'fleet-chrysler-gullwing-v2.jpg', alt: 'Chrysler Super Stretch Gullwing wedding limousine', list: ['Chrysler Super Stretch Gullwing seating up to 10 passengers', 'Uniformed chauffeur', 'Red carpet', 'White satin ribbon on the limousine', 'Chilled bottled water', '2 bottles of sparkling wine'] },
    { title: 'Just Married Package', badge: 'Rolls Royce', img: 'fleet-rolls-royce-phantom-v2.jpg', alt: 'Rolls Royce Phantom luxury wedding sedan', list: ['1 limousine seating up to 10 passengers', '1 sedan of your choice seating up to 4 passengers', 'Uniformed chauffeurs', 'White satin ribbon on each vehicle'] },
    { title: 'Diamond Package', badge: 'Mercedes', img: 'fleet-mercedes-s-class-v2.jpg', alt: 'Mercedes S Class AMG Line Sedan', list: ['1 limousine seating up to 10 passengers', '1 Rolls Royce', '1 Mercedes sedan', 'Getaway vehicle at night for bride and groom'] },
    { title: 'Platinum Package', badge: 'Hummer', img: opts.platinumImg || 'fleet-hummer-white-v2.jpg', alt: 'White Hummer stretch wedding limousine', list: ['1 x white Hummer stretch limousine seating up to 14 or 16 passengers', '1 x white sedan of your choice up to 4 passengers', 'White satin ribbon on all cars'] },
    { title: 'Hummer Stretch Limousine Package', badge: 'Hummer', img: 'fleet-hummer-green-v2.jpg', alt: 'Hummer stretch wedding limousine', list: ['Hummer Stretch Limousine seating up to 14 or 16 passengers'] },
  ];
  if (opts.noHummerStretch) PKGS = PKGS.filter(p => p.title !== 'Hummer Stretch Limousine Package');
  if (opts.platinumImg) { const pl = PKGS.find(p => p.title === 'Platinum Package'); if (pl) { pl.badge = 'Mercedes'; pl.alt = 'White Mercedes sedan wedding car'; } }
  PKGS.forEach(p => { p.list = withStdInclusions(p.list); });
  const cards = PKGS.map(p => `          <article class="fleet-card reveal">
            <div class="fleet-card__media"><img class="fleet-card__img" src="/${p.img}" alt="${attr(p.alt)}" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" loading="lazy" decoding="async"><span class="fleet-card__badge">${esc(p.badge)}</span></div>
            <div class="fleet-card__body">
              <span class="fleet-card__brand">Package</span>
              <span class="fleet-card__model">${esc(p.title)}</span>
              <ul class="pkg-card__list">
${p.list.map(li => `                <li>${esc(li)}</li>`).join('\n')}
              </ul>
            </div>
          </article>`).join('\n');
  return `    <section class="fleet pkg" aria-labelledby="pkgHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="fleet__inner">
        <div class="fleet__header reveal"><div><span class="label-bracket">Wedding Packages</span><h2 class="fleet__heading" id="pkgHeading">Wedding Car Packages</h2></div><p class="fleet__intro">Every package can be custom tailored to your budget and run sheet — mix, match and add cars to build your dream arrival.</p></div>
        <div class="fleet__grid pkg__grid">
${cards}
        </div>
        <div class="pkg__cta"><a href="#quote" class="btn-pill btn-pill--gold btn-magnetic">Enquire about packages <span class="btn-pill__arrow" aria-hidden="true">${ARROW}</span></a></div>
      </div>
    </section>`;
}

/* Verbatim clone of the home-page "How It Works" steps (reference only — the
   home page is never modified). Same copy, tags and "Get a free quote today"
   button; links to this page's own #quote section. */
function howItWorks() {
  const STEPS = [
    ['01', 'Submit your enquiry', "Drop us your event details — date, pick-up, drop-off, passenger count, the occasion. Use the quote form below or call us direct. We'll have everything we need to put a tailored package together.", ['Quote Form', 'Call', 'Email']],
    ['02', "We'll come back to you", "We'll be back with a written quote that confirms availability, vehicle options and total pricing — no hidden extras, no surprises.", ['Written Quote', 'No Surprises']],
    ['03', 'Confirm your booking', "Secure your booking with a small deposit and we'll send you a booking confirmation with all the details.", ['Small Deposit', 'Locked-In Rate', 'Confirmation Pack']],
    ['04', 'Arrive in style', 'Sit back and enjoy the ride with champagne in hand (adults only). Your uniformed chauffeur arrives early, immaculately presented, and gets you to every stop on time, every time.', ['Uniformed Chauffeur', 'Champagne', 'Red Carpet']],
  ];
  const rows = STEPS.map(([num, title, body, tags], i) => {
    const open = i === 0;
    const n = i + 1;
    return `          <div class="how-row reveal${open ? ' is-open' : ''}" data-row="${n}">
            <div class="how-row__top" role="button" tabindex="0" aria-expanded="${open ? 'true' : 'false'}" aria-controls="how-panel-${n}">
              <span class="how-row__num">${num} /</span>
              <h3 class="how-row__title">${esc(title)}</h3>
              <span class="how-row__arrow" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
              </span>
            </div>
            <div class="how-row__panel" id="how-panel-${n}">
              <div class="how-row__panel-inner">
                <p class="how-row__body">${esc(body)}</p>
                <div class="how-row__tags">
${tags.map(t => `                  <span class="how-row__tag">${esc(t)}</span>`).join('\n')}
                </div>
              </div>
            </div>
          </div>`;
  }).join('\n\n');
  return `    <section class="how" id="how" aria-labelledby="howHeading">
      <div class="beam beam--reverse" aria-hidden="true"></div>
      <div class="how__inner">
        <div class="how__header reveal">
          <span class="label-bracket">How It Works</span>
          <h2 class="how__heading" id="howHeading">Four steps to your perfect ride.</h2>
        </div>

        <div class="how__list">

${rows}

        </div>

        <a href="#quote" class="how__book">
          Get a free quote today
          <span class="arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
          </span>
        </a>
      </div>
    </section>`;
}

function weddingSydneyPage(slug) {
  const { fm } = parseMd(slug);
  const h1 = 'Wedding Cars & Wedding Limousine Hire Sydney';
  const sub = 'Luxury wedding cars, stretch limousines and professional chauffeurs for your special day.';
  // Luxury fleet for weddings — Gullwing is the headline Chrysler (global rule):
  // the generic white "Chrysler Super Stretch" is intentionally omitted in its favour.
  const weddingFleet = [
    'vehicle-gullwing-chrysler-super-stretch-limousine',
    'vehicle-black-edition-chrysler-super-stretch-limousine',
    'vehicle-black-chrysler-super-stretch-limousine',
    'vehicle-hummer-h2-stretch-limousine',
    'vehicle-hummer-stretch-limousine',
    'vehicle-mercedes-s-class-amg-sedan',
    'vehicle-mercedes-sprinter-limo-van',
    'vehicle-rolls-royce-phantom-sedan',
    'vehicle-mercedes-valente-premium-minibus',
    'vehicle-volkswagen-crafter-premium-minibus',
  ].map(s => VBY[s]);
  const WEDDING_FAQ = [
    ['How far in advance should I book?', 'We recommend booking as far in advance as possible — like your other wedding vendors, most couples book 6 to 18 months out. That secures your dream wedding car without stressing over limited options. We can often help with last-minute requests too, so get in touch and we will do our best.'],
    ['Where do you service in Sydney?', 'We service all of Sydney — from Western Sydney to the Northern Beaches, down to the Sutherland Shire and Wollongong. We regularly chauffeur clients from the CBD to Parramatta, Campbelltown, the Eastern Suburbs, Marrickville, the Inner West and everywhere in between.'],
    ['How much does wedding car hire cost?', 'Costs vary with the vehicle, date, number of hours and pick-up/drop-off locations. Our wedding cars include Chryslers, stretch Hummers, Rolls Royce sedans and luxury minivans and minibuses. We offer wedding car packages to make hiring a fleet of beautiful cars more affordable.'],
  ];
  const prose = `    <section class="prose">
      <div class="beam" aria-hidden="true"></div>
      <div class="prose__inner reveal">
        <span class="label-bracket">Show Limousines</span>
          <h2 class="prose__h2">Book Your Sydney Wedding Cars with Show Limousines</h2>
          <p>Your wedding day deserves an entrance to match. Show Limousines provides luxury wedding cars, stretch limousines and Hummer limousines with a professional chauffeured service right across Sydney and Wollongong — so the only thing you have to think about is enjoying the day. Whether it is an intimate boutique wedding or a grand celebration, every booking comes with the full VIP treatment: a red carpet for the bride, white satin ribbon on the cars, chilled champagne and an immaculately presented, uniformed chauffeur who looks after your bridal party from the first pick-up to the last.</p>
          <h2 class="prose__h2">Wedding Vehicles That Stand Out From The Crowd</h2>
          <p>From a single bridal car to a full fleet, we tailor affordable wedding packages to suit small, medium and large weddings across Sydney and Wollongong. Need a getaway car? We will whisk the newlyweds away in a luxury sedan or stretch limousine once the reception winds down. Tell us what you have in mind and we will build a package around your budget — call our team on <a href="tel:${TEL}" style="color:var(--color-accent);">${PHONE}</a> to start planning your perfect arrival.</p>
      </div>
    </section>`;
  const wantDifferent = `    <section class="prose">
      <div class="beam" aria-hidden="true"></div>
      <div class="prose__inner reveal">
          <h2 class="prose__h2">Want something different?</h2>
          <p>We can create custom wedding car packages to suit any style, party size and budget. Every car in our fleet is available for wedding hire across Sydney and Wollongong — get in touch and we will make your grand entrance unforgettable.</p>
      </div>
    </section>`;
  return emit(slug, [
    head(fm, slug), header(pathFor(slug)), mobileNav(pathFor(slug)), '  <main>',
    pageHero('Wedding Cars', h1, sub, bannerFor(slug)),
    whyChoose(),
    prose,
    weddingPackages(),
    fleetGrid('Browse Our Luxury Fleet.', 'The cars and limousines couples book for weddings across Sydney & Wollongong — tap any vehicle for full details.', weddingFleet),
    wantDifferent,
    TESTIMONIALS,
    howItWorks(),
    faq(WEDDING_FAQ),
    quoteForm('Get a quick quote.', 'Leave your wedding details below and we will get back to you as soon as possible.'),
    '  </main>', footer(), FOOT_SCRIPT,
  ]);
}

/* When required by a tooling script (restore.js / stamp-chrome.js / nav-update.js)
   rather than run directly, expose the shared generators and stop here — do NOT
   run the full site build. By this point every chrome + section builder and its
   constants are defined, so importers get a single source of truth for chrome. */
if (require.main !== module) {
  module.exports = {
    header, mobileNav, footer, subFooter, head, FOOT_SCRIPT, responsify,
    quoteForm, faq, fleetGrid, fleetCarousel, fleetCard, googleBadge, mapSection,
    pageHero, bannerFor, proseSection, parseMd,
    howItWorks, whyChoose, whyChooseService, weddingPackages,
    NAV, VEHICLES, VBY, SERVICE_FLEET, SERVICE_INFO, TESTIMONIALS, HOME_TESTI, HOME_FAQ,
    PHONE, TEL, EMAIL, SITE, ARROW, RESTORE_SLUGS, PINNED, pathFor,
  };
  return;
}

/* ----- Build everything ----- */
const SERVICES = [
  ['wedding-limousine-sydney', 'Wedding Limousines'], ['wedding-limousine-hire-wollongong', 'Wedding Limousines'],
  ['wedding-limousine-shellharbour', 'Wedding Limousines'], ['wedding-cars-limousines', 'Wedding Limousines'],
  ['airport-limo-transfers-sydney', 'Services'], ['cruise-transfer-sydney', 'Services'], ['birthday-limousine-sydney', 'Services'],
  ['concert-limo-transfers-sydney', 'Services'], ['school-formal-limousine-hire-sydney', 'Services'], ['corporate-transfers', 'Services'],
  ['party-limousine-hire-sydney', 'Services'], ['hens-party-limo-sydney', 'Services'], ['funeral-limo-hire', 'Services'],
];
SERVICES.forEach(([s, e]) => { if (s === 'wedding-limousine-sydney') weddingSydneyPage(s); else servicePage(s, e); });

['limo-hire-bankstown', 'limo-hire-campbelltown', 'limo-hire-eastern-suburbs', 'limo-hire-inner-west', 'limo-hire-liverpool', 'limo-hire-marrickville', 'limo-hire-northern-beaches', 'limo-hire-parramatta', 'limo-hire-penrith', 'limo-hire-sutherland-shire', 'limo-hire-wollongong'].forEach(locationPage);

VEHICLES.forEach(v => vehiclePage(v.slug));

categoryPage('chrysler-limo-hire-sydney', 'Fleet', VEHICLES.filter(v => v.badge === 'Chrysler'));
categoryPage('hummer-limo-hire-sydney', 'Fleet', VEHICLES.filter(v => v.badge === 'Hummer'));
categoryPage('rolls-royce-hire-sydney', 'Fleet', VEHICLES.filter(v => v.badge === 'Rolls Royce'));
categoryPage('fleet', 'Fleet', VEHICLES);
categoryPage('vehicles', 'Fleet', VEHICLES);

// services hub — Show Limousines overview + photo Services showcase (Homepage .occasions
// design) + the Home page's How It Works / Testimonials / FAQ.
function servicesShowcase() {
  // Tiles with `href` link to their own page (clickable); tiles without are display-only
  // (occasions catered for that have no dedicated page). All photos face right.
  // Canonical service order (1→8), then display-only extras after Corporate.
  // `base` derives the responsive set /base-{400,800,1200}.jpg; `src` is a single fixed image.
  const TILES = [
    { name: 'Weddings', desc: 'Make your special day unforgettable.', href: '/wedding-limousine-sydney/', src: '/assets/service-weddings-gullwing.jpg' },
    { name: 'Birthday Celebrations', desc: 'Because you deserve it.', href: '/birthday-limousine-sydney/', src: '/assets/service-birthday-rolls.jpg' },
    { name: 'Parties & Limousines', desc: 'The whole crew, one unforgettable ride.', href: '/party-limousine-hire-sydney/', src: '/assets/service-parties-hummer16.jpg' },
    { name: 'School Formals', desc: 'Arrive like royalty with your crew.', href: '/school-formal-limousine-hire-sydney/', src: '/assets/service-schoolformals-chrysler.jpg' },
    { name: 'Hens & Bucks Parties', desc: 'The big night out, sorted.', href: '/hens-party-limo-sydney/', src: '/assets/service-hensbucks-hummer14.jpg' },
    { name: 'Concert Transfers', desc: 'Arrive to the show in style.', href: '/concert-limo-transfers-sydney/', src: '/assets/service-concert-sprinter.jpg' },
    { name: 'Airport & Cruise Transfers', desc: 'Door to terminal or pier, in total comfort.', href: '/airport-limo-transfers-sydney/', src: '/assets/service-airportcruise-crafter.jpg' },
    { name: 'Corporate Transfers', desc: 'First impressions that matter.', href: '/corporate-transfers/', src: '/assets/service-corporate-sclass.jpg' },
    { name: 'Engagements', desc: 'Pop the question in pure luxury.', base: 'service-engagements' },
    { name: 'Anniversaries', desc: 'Celebrate the years in style.', base: 'service-anniversaries' },
    { name: 'Red Carpet VIP', desc: 'The full A-list arrival treatment.', base: 'service-redcarpet' },
  ];
  const cards = TILES.map((t, i) => {
    const idx = String(i + 1).padStart(2, '0');
    const img = t.src
      ? `            <img class="occ-card__img" alt="" loading="lazy" decoding="async" width="1400" height="781"
                 src="${t.src}">`
      : `            <img class="occ-card__img" alt="" loading="lazy" decoding="async" width="800" height="597"
                 src="/${t.base}-800.jpg"
                 srcset="/${t.base}-400.jpg 400w, /${t.base}-800.jpg 800w, /${t.base}-1200.jpg 1200w"
                 sizes="(min-width: 1025px) 340px, 47vw">`;
    const media = `          <div class="occ-card__media">
${img}
            <span class="occ-card__index">${idx}</span>
          </div>`;
    const body = `          <h3 class="occ-card__name">${esc(t.name)}</h3>
          <p class="occ-card__desc">${esc(t.desc)}</p>`;
    return t.href
      ? `        <a href="${t.href}" class="occ-card reveal" aria-label="${attr(t.name)} — view service">
${media}
${body}
          <span class="occ-card__more">Learn more <span aria-hidden="true">→</span></span>
        </a>`
      : `        <div class="occ-card occ-card--static reveal" aria-label="${attr(t.name)}">
${media}
${body}
          <span class="occ-card__more occ-card__more--static">Available on request</span>
        </div>`;
  }).join('\n');
  return `    <section class="occasions" id="services" aria-labelledby="svcShowcaseHeading">
      <div class="beam beam--reverse" aria-hidden="true"></div>
      <div class="occasions__inner">
        <div class="occasions__header reveal">
          <div>
            <span class="label-bracket">Services</span>
            <h2 class="occasions__heading" id="svcShowcaseHeading">Every occasion, covered.</h2>
          </div>
          <p class="occasions__intro">From weddings and airport runs to birthdays, formals and red-carpet VIP arrivals, Show Limousines caters for every occasion across Sydney &amp; Wollongong.</p>
        </div>
        <div class="occasions__grid">
${cards}
        </div>
      </div>
    </section>`;
}
(function () {
  const { fm } = parseMd('services');
  const showLimo = `    <section class="prose">
      <div class="beam" aria-hidden="true"></div>
      <div class="prose__inner reveal">
        <span class="label-bracket">Show Limousines</span>
          <h2 class="prose__h2">Luxury chauffeured transport for every occasion</h2>
          <p>From weddings and airport runs to birthdays, school formals, corporate events and milestone celebrations, Show Limousines provides chauffeured luxury cars and stretch limousines across Sydney and Wollongong. Whatever you're celebrating and wherever you need to be, our uniformed chauffeurs and immaculate fleet get you there in style — on time, every time.</p>
      </div>
    </section>`;
  emit('services', [head(fm, 'services'), header('/services/'), mobileNav('/services/'), '  <main>',
    pageHero('Services', 'Limousine services for every occasion.', fm.description, bannerFor('services')),
    showLimo,
    servicesShowcase(),
    howItWorks(),
    HOME_TESTI,
    HOME_FAQ,
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
    pageHero('About Us · Blog', 'From the blog.', fm.description, bannerFor('blog')),
    `    <section class="fleet"><div class="beam" aria-hidden="true"></div><div class="fleet__inner"><div class="fleet__header reveal"><div><span class="label-bracket">Blog</span><h2 class="fleet__heading">Latest articles.</h2></div></div><div class="fleet__grid">\n${cards}\n        </div></div></section>`,
    '  </main>', footer(), FOOT_SCRIPT]);
  POSTS.forEach(([s]) => infoPage(s, 'Blog'));
})();

// contact
(function () {
  const { fm } = parseMd('contact');
  emit('contact', [head(fm, 'contact'), header('/contact/'), mobileNav('/contact/'), '  <main>',
    pageHero('Contact Us', "Let's plan your arrival.", fm.description || 'Tell us your event details and we’ll put together a tailored package.', bannerFor('contact')),
    quoteForm('Tell us about your event.', 'Fill in the details below and we will get back to you as soon as possible.'),
    mapSection('Servicing Sydney & Wollongong.'), '  </main>', footer(), FOOT_SCRIPT]);
})();

// thank-you
(function () {
  const { fm } = parseMd('thank-you');
  emit('thank-you', [head(fm.title ? fm : { title: 'Thank You | Show Limousines', description: 'Thanks for your enquiry — we’ll be in touch shortly.' }, 'thank-you'),
    header('#'), mobileNav('#'), '  <main>',
    pageHero('Thank You', 'Thank you — we’ll be in touch.', 'Your enquiry has been received. Our team will get back to you as soon as possible. For anything urgent call ' + PHONE + '.', bannerFor('thank-you')),
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
    header('/sitemap/'), mobileNav('/sitemap/'), '  <main>', pageHero('Sitemap', 'Sitemap.', 'Every page on the Show Limousines site.', bannerFor('sitemap')),
    `    <section class="prose"><div class="prose__inner reveal">\n${html}\n      </div></section>`, '  </main>', footer(), FOOT_SCRIPT]);
})();

/* ---------------- Patch the home page (header/mobile/footer/quote form) ---------------- */
(function patchHome() {
  let h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  h = h.replace(/<header class="nav-wrap"[\s\S]*?<\/header>/, header('/'));
  h = h.replace(/<div class="nav-mobile"[\s\S]*?<\/div>\s*(?=<main>)/, mobileNav('/') + '\n  ');
  h = h.replace(/<footer class="foot"[\s\S]*?<\/footer>(\s*<aside class="sub-foot"[\s\S]*?<\/aside>)?/, footer());
  // point the home quote <form> at Web3Forms
  h = h.replace(/<form class="quote-form[^"]*"[^>]*id="quoteForm"[^>]*>/, `<form class="quote-form reveal" id="quoteForm" action="https://api.web3forms.com/submit" method="POST">\n            <input type="hidden" name="access_key" value="${WEB3FORMS_KEY}">\n            <input type="hidden" name="subject" value="New Show Limousines enquiry">\n            <input type="hidden" name="from_name" value="Show Limousines Website">\n            <input type="hidden" name="redirect" value="${SITE}/thank-you/">\n            <input type="checkbox" name="botcheck" class="visually-hidden" style="display:none" tabindex="-1" autocomplete="off">`);
  // root-relative shared assets
  h = h.replace('href="styles.css"', 'href="/styles.css"').replace('src="main.js"', 'src="/main.js"');

  // Reorder the home fleet grid to the canonical VEHICLES order (Commit 3).
  const ORDER = VEHICLES.map(v => v.img.replace(/\.jpg$/, ''));
  h = h.replace(/(<div class="fleet__grid" id="fleetGrid">)([\s\S]*?)(<\/section>)/, (full, open, body, end) => {
    const lastEnd = body.lastIndexOf('</article>') + '</article>'.length;
    if (lastEnd < '</article>'.length) return full; // no cards found — leave as-is
    const tail = body.slice(lastEnd);
    const blocks = body.slice(0, lastEnd).split(/(?=<!--\s*\d+\.)/).filter(s => s.trim());
    const rank = (b) => { const m = b.match(/fleet-[a-z0-9-]+-v2/); const i = m ? ORDER.indexOf(m[0]) : -1; return i < 0 ? 999 : i; };
    blocks.sort((a, b) => rank(a) - rank(b));
    const renum = blocks.map((b, i) => b.trim().replace(/<!--\s*\d+\.\s*/, `<!-- ${i + 1}. `));
    return open + '\n\n          ' + renum.join('\n\n          ') + tail + end;
  });

  h = responsify(h);
  fs.writeFileSync(path.join(ROOT, 'index.html'), h, 'utf8');
  written.push('/ (home patched)');
})();

console.log('Emitted ' + written.length + ' pages.');
written.forEach(w => console.log('  ' + w));
