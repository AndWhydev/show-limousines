/* nav-update.js — one-time migration.
 *
 * Surgically replaces ONLY the nav (desktop <header class="nav-wrap"> and the
 * mobile <div class="nav-mobile">) in every generated index.html with the
 * current multi-level dropdown nav from build.js. Nothing else on any page is
 * touched — body, quote form, footer, styles and JS are left exactly as-is.
 *
 * The header()/mobileNav() generators come straight from build.js (required as
 * a module), so there is ONE shared nav source and every page is identical.
 *
 *   Run:  node nav-update.js
 */
const fs = require('fs');
const path = require('path');
const { header, mobileNav } = require('./build.js');

const ROOT = __dirname;
const HEADER_RE = /<header class="nav-wrap"[\s\S]*?<\/header>/;
const MOBILE_RE = /<div class="nav-mobile"[\s\S]*?<\/div>\s*(?=<main>)/;

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
let patched = 0;
const skipped = [];
for (const file of pages) {
  let html = fs.readFileSync(file, 'utf8');
  if (!HEADER_RE.test(html) || !MOBILE_RE.test(html)) { skipped.push(path.relative(ROOT, file)); continue; }
  const rel = path.relative(ROOT, path.dirname(file)).split(path.sep).join('/');
  const active = rel === '' ? '/' : '/' + rel + '/';
  html = html.replace(HEADER_RE, header(active));
  html = html.replace(MOBILE_RE, mobileNav(active) + '\n  ');
  fs.writeFileSync(file, html, 'utf8');
  patched++;
}
console.log(`Patched nav on ${patched} pages.`);
if (skipped.length) console.log('Skipped (no nav block found): ' + skipped.join(', '));
