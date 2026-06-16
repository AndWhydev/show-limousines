/* logo-swap.js — one-time migration.
 *
 * Swaps the OLD logo assets for the new ones across every page, WITHOUT
 * regenerating page bodies (so hand-built pages like /fleet, /services,
 * /about-us and /wedding-limousine-sydney keep their custom layouts):
 *   - header logo + mobile nav  -> show-limousines-logo.svg (via build.js)
 *   - footer logo <img>         -> show-limousines-logo.svg
 *   - favicon + apple-touch     -> show-limousines-s-mark.png
 *   - <head> fonts link         -> + Cinzel + Montserrat (for the SVG text)
 *   - og:image / twitter:image  -> show-limousines-s-mark.png (added if missing)
 *
 *   Run:  node logo-swap.js
 */
const fs = require('fs');
const path = require('path');
const { header, mobileNav } = require('./build.js');

const ROOT = __dirname;
const SITE = 'https://www.showlimousines.com.au';
const SMARK = '/show-limousines-s-mark.png';
const SVG = '/show-limousines-logo.svg';

const HEADER_RE = /<header class="nav-wrap"[\s\S]*?<\/header>/;
const MOBILE_RE = /<div class="nav-mobile"[\s\S]*?<\/div>\s*(?=<main>)/;
const FOOT_LOGO_RE = /<img src="\/logo\.png"[^>]*class="foot__brand-logo"[^>]*>/;
const ICON_RE = /<link rel="icon"[^>]*href="\/?favicon\.png"[^>]*>/;
const APPLE_RE = /<link rel="apple-touch-icon"[^>]*href="\/?favicon\.png"[^>]*>/;
const FONTS_RE = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Bebas\+Neue[^"]*"[^>]*>/;
const DESC_RE = /<meta name="description"[^>]*>/;

const FOOT_LOGO_NEW = `<img src="${SVG}" alt="Show Limousines — Sydney's Premier Luxury Transport" class="foot__brand-logo" width="1500" height="470">`;
const ICON_NEW = `<link rel="icon" type="image/png" href="${SMARK}">`;
const APPLE_NEW = `<link rel="apple-touch-icon" href="${SMARK}">`;
const FONTS_NEW = `<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@500;600&family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@400;500&display=swap" rel="stylesheet">`;
const OG_IMG = `\n  <meta property="og:image" content="${SITE}${SMARK}">\n  <meta property="og:image:width" content="488">\n  <meta property="og:image:height" content="444">\n  <meta name="twitter:image" content="${SITE}${SMARK}">`;

function findPages(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findPages(full, out);
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

const pages = findPages(ROOT, []);
let n = 0;
const report = { header: 0, mobile: 0, foot: 0, icon: 0, fonts: 0, og: 0 };
for (const file of pages) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const rel = path.relative(ROOT, path.dirname(file)).split(path.sep).join('/');
  const active = rel === '' ? '/' : '/' + rel + '/';

  if (HEADER_RE.test(html)) { html = html.replace(HEADER_RE, header(active)); report.header++; }
  if (MOBILE_RE.test(html)) { html = html.replace(MOBILE_RE, mobileNav(active) + '\n  '); report.mobile++; }
  if (FOOT_LOGO_RE.test(html)) { html = html.replace(FOOT_LOGO_RE, FOOT_LOGO_NEW); report.foot++; }
  if (ICON_RE.test(html)) { html = html.replace(ICON_RE, ICON_NEW); report.icon++; }
  if (APPLE_RE.test(html)) { html = html.replace(APPLE_RE, APPLE_NEW); }
  if (FONTS_RE.test(html)) { html = html.replace(FONTS_RE, FONTS_NEW); report.fonts++; }
  if (!/og:image/.test(html) && DESC_RE.test(html)) {
    html = html.replace(DESC_RE, m => m + OG_IMG); report.og++;
  }

  if (html !== before) { fs.writeFileSync(file, html, 'utf8'); n++; }
}
console.log(`Updated ${n} pages.`);
console.log('  swaps:', JSON.stringify(report));
