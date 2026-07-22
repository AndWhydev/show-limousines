/* ============================================================
   crawl.js — Phase 1 content crawler for the reference site.
   Fetches every reference URL (showlimousines.com.au), extracts
   exact SEO metadata + the Divi entry-content copy (headings,
   paragraphs, list items, image alts), and writes a reviewable
   content/<slug>.md per page + content/assets.json + a report.
   Run: node crawl.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = __dirname;
const OUT = path.join(ROOT, 'content');
const BASE = 'https://www.showlimousines.com.au/';
fs.mkdirSync(OUT, { recursive: true });

// slug = local content filename ; url path = source (trailing slash)
const PAGES = [
  ['home', ''],
  ['services', 'services/'],
  ['fleet', 'fleet/'],
  ['vehicles', 'vehicles/'],
  ['about-us', 'about-us/'],
  ['gallery', 'gallery/'],
  ['reviews', 'reviews/'],
  ['blog', 'blog/'],
  ['term-conditions', 'term-conditions/'],
  ['contact', 'contact/'],
  ['thank-you', 'thank-you/'],
  ['sitemap', 'sitemap/'],
  ['wedding-limousine-sydney', 'wedding-limousine-sydney/'],
  ['wedding-limousine-hire-wollongong', 'wedding-limousine-hire-wollongong/'],
  ['wedding-limousine-shellharbour', 'wedding-limousine-shellharbour/'],
  ['wedding-cars-limousines', 'wedding-cars-limousines/'],
  ['airport-limo-transfers-sydney', 'airport-limo-transfers-sydney/'],
  ['cruise-transfer-sydney', 'cruise-transfer-sydney/'],
  ['birthday-limousine-sydney', 'birthday-limousine-sydney/'],
  ['concert-limo-transfers-sydney', 'concert-limo-transfers-sydney/'],
  ['school-formal-limousine-hire-sydney', 'school-formal-limousine-hire-sydney/'],
  ['corporate-transfers', 'corporate-transfers/'],
  ['party-limousine-hire-sydney', 'party-limousine-hire-sydney/'],
  ['hens-party-limo-sydney', 'hens-party-limo-sydney/'],
  ['chrysler-limo-hire-sydney', 'chrysler-limo-hire-sydney/'],
  ['hummer-limo-hire-sydney', 'hummer-limo-hire-sydney/'],
  ['rolls-royce-hire-sydney', 'rolls-royce-hire-sydney/'],
  ['vehicle-chrysler-super-stretch-limousine', 'vehicle/chrysler-super-stretch-limousine/'],
  ['vehicle-black-chrysler-super-stretch-limousine', 'vehicle/black-chrysler-super-stretch-limousine/'],
  ['vehicle-black-edition-chrysler-super-stretch-limousine', 'vehicle/black-edition-chrysler-super-stretch-limousine/'],
  ['vehicle-gullwing-chrysler-super-stretch-limousine', 'vehicle/gullwing-chrysler-super-stretch-limousine/'],
  ['vehicle-hummer-stretch-limousine', 'vehicle/hummer-stretch-limousine/'],
  ['vehicle-hummer-h2-stretch-limousine', 'vehicle/hummer-h2-stretch-limousine/'],
  ['vehicle-mercedes-s-class-amg-sedan', 'vehicle/mercedes-s-class-amg-sedan/'],
  ['vehicle-mercedes-valente-premium-minibus', 'vehicle/mercedes-valente-premium-minibus/'],
  ['vehicle-mercedes-sprinter-limo-van', 'vehicle/mercedes-sprinter-limo-van/'],
  ['vehicle-rolls-royce-phantom-sedan', 'vehicle/rolls-royce-phantom-sedan/'],
  ['vehicle-volkswagen-crafter-premium-minibus', 'vehicle/volkswagen-crafter-premium-minibus/'],
  ['limo-hire-bankstown', 'limo-hire-bankstown/'],
  ['limo-hire-campbelltown', 'limo-hire-campbelltown/'],
  ['limo-hire-eastern-suburbs', 'limo-hire-eastern-suburbs/'],
  ['limo-hire-inner-west', 'limo-hire-inner-west/'],
  ['limo-hire-liverpool', 'limo-hire-liverpool/'],
  ['limo-hire-marrickville', 'limo-hire-marrickville/'],
  ['limo-hire-northern-beaches', 'limo-hire-northern-beaches/'],
  ['limo-hire-parramatta', 'limo-hire-parramatta/'],
  ['limo-hire-penrith', 'limo-hire-penrith/'],
  ['limo-hire-sutherland-shire', 'limo-hire-sutherland-shire/'],
  ['limo-hire-wollongong', 'limo-hire-wollongong/'],
  ['blog-dont-get-too-drunk', 'dont-get-too-drunk-in-your-limo-ride-you-will-definitely-pay-the-price-and-so-will-everyone-around-you/'],
  ['blog-limousine-hire-costs-sydney', 'limousine-hire-costs-sydney/'],
  ['blog-dos-and-donts', 'the-dos-and-donts-when-rolling-in-a-limousine-to-your-next-event/'],
  ['blog-wedding-limo-checklist', 'wedding-limo-checklist/'],
];

function decode(s) {
  if (!s) return '';
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/&#0?39;|&#x27;|&rsquo;|&lsquo;|&#8217;|&#8216;/g, "'")
    .replace(/&ndash;|&#8211;/g, '–').replace(/&mdash;|&#8212;/g, '—')
    .replace(/&ldquo;|&#8220;/g, '"').replace(/&rdquo;|&#8221;/g, '"')
    .replace(/&hellip;|&#8230;/g, '…')
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(+n); } catch (e) { return ''; } })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch (e) { return ''; } });
}
const strip = (h) => decode(h.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
function metaName(html, name) {
  const re = new RegExp('<meta[^>]+name=["\']' + name + '["\'][^>]*content=["\']([^"\']*)["\']', 'i');
  const re2 = new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*name=["\']' + name + '["\']', 'i');
  const m = html.match(re) || html.match(re2); return m ? decode(m[1]) : '';
}
function metaProp(html, prop) {
  const re = new RegExp('<meta[^>]+property=["\']' + prop + '["\'][^>]*content=["\']([^"\']*)["\']', 'i');
  const m = html.match(re); return m ? decode(m[1]) : '';
}
function tag1(html, tag) { const m = html.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i')); return m ? m[1] : ''; }

const report = [];
const assets = {};
for (const [slug, rel] of PAGES) {
  const url = BASE + rel;
  let html = '', code = '0';
  try {
    code = execSync(`curl -sL --max-time 40 -A "Mozilla/5.0 (content-migration)" -o /tmp/c.html -w "%{http_code}" ${JSON.stringify(url)}`, { encoding: 'utf8' }).trim();
    html = fs.readFileSync('/tmp/c.html', 'utf8');
  } catch (e) { code = 'ERR'; }

  if (code !== '200' || !html) {
    report.push(`${code}\t${slug}\t${url}`);
    fs.writeFileSync(path.join(OUT, slug + '.md'), `---\nslug: ${slug}\nsource: ${url}\nstatus: ${code} (NOT AVAILABLE on reference — build from template)\n---\n`, 'utf8');
    continue;
  }

  const title = strip(tag1(html, 'title'));
  const desc = metaName(html, 'description');
  const canonM = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  const canonical = canonM ? canonM[1] : url;
  const ogTitle = metaProp(html, 'og:title');
  const ogDesc = metaProp(html, 'og:description');
  const ogImg = metaProp(html, 'og:image');
  const twCard = metaName(html, 'twitter:card');

  // main content = the post <article>…</article>
  const art = tag1(html, 'article') || html;
  const body = art.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

  // ordered headings / paragraphs / lists
  const lines = [];
  const seen = new Set();
  const re = /<(h1|h2|h3|h4|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(body))) {
    const tag = m[1].toLowerCase();
    const txt = strip(m[2]);
    if (!txt || txt.length < 2) continue;
    const key = tag + '|' + txt.toLowerCase();
    if (seen.has(key)) continue; seen.add(key);
    const pre = tag === 'h1' ? '# ' : tag === 'h2' ? '## ' : tag === 'h3' ? '### ' : tag === 'h4' ? '#### ' : tag === 'li' ? '- ' : tag === 'blockquote' ? '> ' : '';
    lines.push(pre + txt);
  }

  // images (src/data-src + alt) within article
  const imgs = [];
  const imgRe = /<img\b[^>]*>/gi; let im;
  while ((im = imgRe.exec(art))) {
    const tagHtml = im[0];
    const src = (tagHtml.match(/\bdata-src=["']([^"']+)["']/i) || tagHtml.match(/\bsrc=["']([^"']+)["']/i) || [])[1];
    const alt = (tagHtml.match(/\balt=["']([^"']*)["']/i) || [])[1] || '';
    if (src && !/data:image|spacer|blank\.gif/i.test(src)) imgs.push({ src, alt: decode(alt) });
  }
  assets[slug] = { url, ogImage: ogImg, images: imgs };

  const fm = [
    '---',
    `slug: ${slug}`,
    `source: ${url}`,
    `status: 200`,
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(desc)}`,
    `canonical: ${canonical}`,
    `og_title: ${JSON.stringify(ogTitle)}`,
    `og_description: ${JSON.stringify(ogDesc)}`,
    `twitter_card: ${twCard || 'summary'}`,
    `images: ${imgs.length}`,
    '---',
    '',
    lines.join('\n'),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, slug + '.md'), fm, 'utf8');
  report.push(`200\t${slug}\t${lines.length} blocks, ${imgs.length} imgs`);
}

fs.writeFileSync(path.join(OUT, 'assets.json'), JSON.stringify(assets, null, 2), 'utf8');
fs.writeFileSync(path.join(OUT, '_crawl-report.txt'), report.join('\n') + '\n', 'utf8');
console.log(report.join('\n'));
console.log('\nWrote ' + PAGES.length + ' files to content/');
