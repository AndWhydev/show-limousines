/* ============================================================
   restore.js — rebuild the EJECTED pages (see RESTORE_SLUGS in build.js) as
   static files: each page's unique OLD (commit 5ca3cb4) <main> body is frozen
   verbatim, wrapped with the CURRENT shared chrome (header/nav + footer + sub-footer)
   from build.js, delimited by <!--CHROME:…--> markers so stamp-chrome.js can keep the
   chrome in sync later without ever touching the frozen <main>.

   Pipeline: OLD <head> (frozen, per-page SEO) → CHROME:header → OLD <main>
   (frozen, run through responsify for retina srcset) → CHROME:footer → foot script.

   Keep-item + today's-work transforms are applied to the frozen <main> by
   transforms.js (required below) so this assembler stays readable.
   Run: node restore.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = __dirname;
const OLD = '5ca3cb4';

const C = require('./build.js'); // single source of shared chrome + builders
const transforms = require('./transforms.js'); // keep-items + today's work, applied to <main>

const MARK = {
  hStart: '  <!--CHROME:header start — shared, stamped by stamp-chrome.js; do not hand-edit-->',
  hEnd: '  <!--/CHROME:header end-->',
  fStart: '  <!--CHROME:footer start — shared, stamped by stamp-chrome.js; do not hand-edit-->',
  fEnd: '  <!--/CHROME:footer end-->',
};

function gitShow(file) {
  try { return execFileSync('git', ['show', `${OLD}:${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { return null; }
}

function chromeHeader(active) {
  return `${MARK.hStart}\n${C.header(active)}\n${C.mobileNav(active)}\n${MARK.hEnd}`;
}
function chromeFooter() {
  return `${MARK.fStart}\n${C.footer()}\n${MARK.fEnd}`;
}

const written = [], missing = [];
for (const slug of C.RESTORE_SLUGS) {
  if (C.PINNED && C.PINNED.has(slug)) continue; // frozen verbatim (Fleet pages @ 8bc9c70) — never regenerate
  const route = C.pathFor(slug);
  const dir = route.replace(/^\/|\/$/g, '');
  const file = `${dir}/index.html`;
  const old = gitShow(file);
  if (!old) { missing.push(file); continue; }

  const headM = old.match(/^[\s\S]*?<body>/);
  const mainM = old.match(/<main[^>]*>[\s\S]*?<\/main>/);
  if (!headM || !mainM) { missing.push(file + ' (no head/main)'); continue; }

  const head = headM[0];
  let main = mainM[0];
  main = transforms.apply(slug, main, C); // keep-items + today's work
  main = C.responsify(main);              // retina AVIF/WebP srcset on fleet imgs

  const html = [
    head,
    chromeHeader(route),
    '  ' + main,
    chromeFooter(),
    C.FOOT_SCRIPT,
  ].join('\n') + '\n';

  fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, 'index.html'), html, 'utf8');
  written.push(route);
}

console.log(`restore.js: wrote ${written.length} static pages.`);
if (missing.length) { console.log('MISSING (' + missing.length + '):'); missing.forEach(m => console.log('  ' + m)); }
