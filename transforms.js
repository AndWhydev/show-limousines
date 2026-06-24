/* ============================================================
   transforms.js — applied to each ejected page's frozen OLD <main> by restore.js.
   (a) STEP-4 keep-items (yesterday's changes to retain) and (b) re-integration of
   today's wedding/services work. Every spliced fragment is recovered from a real
   commit (OLD 5ca3cb4 / YDAY 90123a4 / TODAY content) — never authored from memory.
   apply(slug, main, C) -> transformed <main> string.
   ============================================================ */
'use strict';

/* --- K7: the one FAQ item added yesterday (verbatim from 90123a4) --- */
const WEDDING_FAQ_Q = 'Do you offer wedding cars in Sydney?';
const WEDDING_FAQ_A = 'Yes. We offer a range of wedding cars and stretch limousines including Rolls Royce Phantom, Chrysler Super Stretch Limousines, Hummer Stretch Limousines, Mercedes S Class AMG line sedan and Mercedes Sprinter Limo Vans throughout Sydney.';
function faqItem(q, a) {
  return `          <div class="faq-item reveal">
            <div class="faq-item__top" role="button" tabindex="0" aria-expanded="false">
              <h3 class="faq-item__q">${q}</h3>
              <span class="faq-item__arrow" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span>
            </div>
            <div class="faq-item__panel"><p class="faq-item__a">${a}</p></div>
          </div>`;
}

/* --- K2: new fleet card order (front-to-back rank by image) --- */
const FLEET_RANK = [
  'fleet-hummer-green-v2', 'fleet-hummer-white-v2',          // 1) Hummers
  'fleet-mercedes-sprinter-v2',                              // 2) Sprinter
  'fleet-chrysler-gullwing-v2', 'fleet-chrysler-black-edition-v2',
  'fleet-chrysler-white-v2', 'fleet-chrysler-black-v2',     // 3) Chryslers (gullwing,BE,white,black)
  'fleet-rolls-royce-phantom-v2',                           // 4) Rolls
  'fleet-mercedes-s-class-v2',                              // 5) S Class
  'fleet-vw-crafter-v2',                                    // 6) Crafter
  'fleet-mercedes-valente-v2',                              // 7) Valente
];
function rankOf(article) {
  const m = article.match(/fleet-[a-z0-9-]+-v2/);
  const i = m ? FLEET_RANK.indexOf(m[0]) : -1;
  return i < 0 ? 999 : i;
}
function reorderFleetGrids(main) {
  return main.replace(/(<div class="fleet__grid"[^>]*>)([\s\S]*?)(<\/div>\s*<a [^>]*fleet__viewall)/g, (full, open, body, tail) => {
    const arts = body.match(/<article class="fleet-card[\s\S]*?<\/article>/g);
    if (!arts || arts.length < 2) return full;
    const sorted = arts.slice().sort((a, b) => rankOf(a) - rankOf(b));
    if (sorted.join() === arts.join()) return full;
    return open + '\n          ' + sorted.join('\n          ') + '\n        ' + tail;
  });
}

/* --- today: airport Valente -> white Chrysler super stretch (svc-show card) --- */
function airportValenteToWhiteStretch(main) {
  return main.replace(
    /<article class="fleet-card">\s*<div class="fleet-card__media"><img class="fleet-card__img" src="\/fleet-mercedes-valente-v2\.jpg"[\s\S]*?<\/article>/,
    `<article class="fleet-card">
            <div class="fleet-card__media"><img class="fleet-card__img" src="/fleet-chrysler-white-v2.jpg" alt="White Chrysler Super Stretch" loading="lazy" decoding="async"><span class="fleet-card__badge">Chrysler</span></div>
            <div class="fleet-card__body"><span class="fleet-card__brand">Chrysler</span><span class="fleet-card__model">White Chrysler Super Stretch</span><span class="fleet-card__capacity">Up to 10 passengers</span><div class="fleet-card__footer"><a href="/vehicle/chrysler-super-stretch-limousine/" class="btn-outline-sm">View Details</a></div></div>
          </article>`);
}

/* --- today: View Fleet button appended inside svc-show --- */
function addViewFleetButton(main, C) {
  if (/class="fleet__cta"/.test(main)) return main;
  const btn = `        <div class="fleet__cta"><a href="/fleet/" class="btn-pill btn-pill--gold btn-magnetic">View Fleet <span class="btn-pill__arrow" aria-hidden="true">${C.ARROW}</span></a></div>\n`;
  return main.replace(/(<section class="svc-show"[\s\S]*?)(\s*<\/section>)/, `$1\n${btn}    $2`);
}

/* --- today: rebuild the prose section from today's bulleted content md (two main
   blocks only, before the "Services We Provide / collection / FAQ" tail) --- */
function todaysProse(slug, C) {
  let parsed; try { parsed = C.parseMd(slug); } catch (e) { return null; }
  const stop = /^#+\s*(Services We Provide|our collection|Browse Our|Frequently Asked|FAQ|FAQs)/i;
  const drop = /^#+\s*(Call\b|Get a Free Quote|Get a quick quote)/i;
  const lines = [];
  for (const l of parsed.lines) { if (stop.test(l)) break; if (!drop.test(l)) lines.push(l); }
  return C.proseSection('Show Limousines', lines, { dropFirstH1: true });
}

const SERVICE_SLUGS = new Set([
  'airport-limo-transfers-sydney', 'cruise-transfer-sydney', 'birthday-limousine-sydney',
  'concert-limo-transfers-sydney', 'school-formal-limousine-hire-sydney', 'corporate-transfers',
  'party-limousine-hire-sydney', 'hens-party-limo-sydney',
]);

function apply(slug, main, C) {
  /* ---------- universal keep-items (any page that has the section) ---------- */
  // K5 testimonials label
  main = main.replace(/(<div class="testi__trust"><span>Trusted by<\/span>)160\+ Sydney clients/g,
    '$1160+ Five-Star reviews');
  // K4 quote field rename
  main = main.replace(/>Additional Comments</g, '>Additional Details<');
  // K7 add the wedding-cars FAQ (keep page-specific items; insert as first)
  if (main.includes('class="faq__list"') && !main.includes(WEDDING_FAQ_Q)) {
    main = main.replace(/(<div class="faq__list">\s*)/, `$1\n${faqItem(WEDDING_FAQ_Q, WEDDING_FAQ_A)}\n`);
  }
  // K2 fleet card order (only fires where a fleet__grid exists)
  main = reorderFleetGrids(main);

  /* ---------- service pages: keep-item How It Works + today's work ---------- */
  if (SERVICE_SLUGS.has(slug)) {
    const info = (C.SERVICE_INFO || {})[slug] || {};
    // today: rename svc-why heading -> "Why Choose Our <Service> Service"
    if (info.why) main = main.replace('Why Choose Show Limousines', info.why);
    // today: exact hero subheading (airport / cruise only)
    if (info.sub) main = main.replace(/(class="page-hero__sub">)[^<]*/, `$1${info.sub}`);
    // today: paragraphs -> bullets (rebuild prose from today's md)
    const prose = todaysProse(slug, C);
    if (prose) main = main.replace(/<section class="prose">[\s\S]*?<\/section>/, prose);
    // today: airport featured vehicle Valente -> white stretch
    if (slug === 'airport-limo-transfers-sydney') main = airportValenteToWhiteStretch(main);
    // today: View Fleet button in the vehicles ("Best for") section
    main = addViewFleetButton(main, C);
    // K3 How It Works -> yesterday's version (replaces OLD svc-steps)
    if (C.howItWorks) main = main.replace(/<section class="svc-steps"[\s\S]*?<\/section>/, C.howItWorks());
  }

  /* ---------- wedding pages: re-integrate today's bespoke sections ---------- */
  if (WEDDING_SLUGS.has(slug)) main = applyWedding(slug, main, C);

  return main;
}

/* --- wedding re-integration (see approved merge plan) --- */
const WEDDING_SLUGS = new Set([
  'wedding-limousine-sydney', 'wedding-cars-limousines', 'wedding-limousine-hire-wollongong',
]);
const PKG_PAGES = new Set(['wedding-limousine-sydney', 'wedding-limousine-hire-wollongong']);
const SYDNEY = 'wedding-limousine-sydney';
const SYDNEY_SUB = 'Luxury wedding cars, stretch limousines and professional chauffeurs for your special day.';

/* "165+ 5-Star Google Reviews | 10+ Years | 365 Days a year" trust bar under the hero,
   reusing the homepage hero stat typography (.hero__stat-num/.hero__stat-label/.hero__stat-sep). */
function statsStrip() {
  const stat = (n, l) => `<div class="hero__stat"><span class="hero__stat-num">${n}</span><span class="hero__stat-label">${l}</span></div>`;
  const sep = '<span class="hero__stat-sep" aria-hidden="true"></span>';
  return `    <section class="wstat" aria-label="Show Limousines at a glance">
      <div class="wstat__inner reveal">
        ${stat('165+', '5-Star Google Reviews')}
        ${sep}
        ${stat('10+', 'Years')}
        ${sep}
        ${stat('365', 'Days a year')}
      </div>
    </section>`;
}

function applyWedding(slug, main, C) {
  // Sydney only: today's exact hero subheading (others keep OLD)
  if (slug === SYDNEY) main = main.replace(/(class="page-hero__sub">)[^<]*/, `$1${SYDNEY_SUB}`);
  // Sydney + Wollongong: OLD packages-as-text prose -> today's photographed cards (Gullwing rule)
  if (PKG_PAGES.has(slug)) main = main.replace(/<section class="prose">[\s\S]*?<\/section>/, C.weddingPackages());
  // All 3: stats strip + why-couples strip, directly under the hero (in that order)
  main = main.replace(/(<section class="page-hero[\s\S]*?<\/section>)/, `$1\n${statsStrip()}\n${C.whyChoose()}`);
  // All 3: How It Works, placed after the testimonials section
  main = main.replace(/(<section class="testi"[\s\S]*?<\/section>)/, `$1\n${C.howItWorks()}`);
  // Unify testimonials label to 165+ on wedding pages (overrides keep-item #5 here only)
  main = main.replace(/(<div class="testi__trust"><span>Trusted by<\/span>)160\+ Five-Star reviews/, '$1165+ Five-Star reviews');
  return main;
}

module.exports = { apply };
