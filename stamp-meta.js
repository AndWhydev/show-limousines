/* ============================================================
   stamp-meta.js — keep the <head> SEO description on the PINNED location pages
   in sync with their single source of truth: the `description:` frontmatter in
   content/<slug>.md.

   Why this exists: the /limo-hire-* pages are in both RESTORE_SLUGS and PINNED,
   so build.js emit() deliberately never rewrites them, and stamp-chrome.js only
   touches the CHROME:header / CHROME:footer regions. That left the <head> meta
   with no propagation path — editing frontmatter alone did nothing on disk.
   This script closes that gap for the description tags ONLY; it never touches
   <main>, the frozen layout, or any other head tag.

   Keeps these three in sync from one value:
     <meta name="description">, <meta property="og:description">,
     <meta name="twitter:description">
   (og_description frontmatter wins for the og/twitter pair if it is non-empty,
   mirroring build.js head().)

   Idempotent — safe to re-run. Run: node stamp-meta.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./build.js');
const ROOT = __dirname;

const LOCATION_SLUGS = [
  'limo-hire-bankstown', 'limo-hire-campbelltown', 'limo-hire-eastern-suburbs',
  'limo-hire-inner-west', 'limo-hire-liverpool', 'limo-hire-marrickville',
  'limo-hire-northern-beaches', 'limo-hire-parramatta', 'limo-hire-penrith',
  'limo-hire-sutherland-shire', 'limo-hire-wollongong',
];

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Pull a scalar out of the leading --- frontmatter block. */
function frontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^".*"$/.test(v) || /^'.*'$/.test(v)) v = v.slice(1, -1);
    fm[kv[1]] = v;
  }
  return fm;
}

/* Replace one meta tag's content= in place, preserving the tag's own formatting. */
function setMeta(html, selector, value) {
  const re = new RegExp(`(<meta\\s+${selector}\\s+content=")[^"]*(">)`);
  if (!re.test(html)) return { html, ok: false };
  return { html: html.replace(re, (m, a, b) => a + esc(value) + b), ok: true };
}

let changed = 0, clean = 0, missing = 0;
for (const slug of LOCATION_SLUGS) {
  const mdPath = path.join(ROOT, 'content', `${slug}.md`);
  const file = path.join(ROOT, C.pathFor(slug).replace(/^\/|\/$/g, ''), 'index.html');
  if (!fs.existsSync(mdPath) || !fs.existsSync(file)) {
    console.log(`  ! ${slug}: missing content or index.html`);
    missing++;
    continue;
  }
  const fm = frontmatter(fs.readFileSync(mdPath, 'utf8'));
  const desc = fm.description || '';
  const ogd = fm.og_description || desc;
  if (!desc) { console.log(`  ! ${slug}: empty description in frontmatter`); missing++; continue; }

  const before = fs.readFileSync(file, 'utf8');
  let html = before;
  for (const [sel, val] of [
    ['name="description"', desc],
    ['property="og:description"', ogd],
    ['name="twitter:description"', ogd],
  ]) {
    const r = setMeta(html, sel, val);
    if (!r.ok) console.log(`  ! ${slug}: no <meta ${sel}> tag found`);
    html = r.html;
  }
  if (html === before) { clean++; continue; }
  fs.writeFileSync(file, html, 'utf8');
  console.log(`  ✓ ${slug} (${desc.length} chars)`);
  changed++;
}
console.log(`stamp-meta.js: updated ${changed}, already in sync ${clean}, skipped ${missing}.`);
