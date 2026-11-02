/* ============================================================
   patch-gads.js — inserts the Google Ads gtag (AW-10950182554)
   plus the "calls from website" phone conversion config right
   after the GTM head snippet on every index.html. Idempotent:
   files that already contain the Ads ID are skipped.

   The site otherwise only loads GTM, so gtag() is defined here
   rather than pasting the bare Google snippet (which would throw).

   Run: node patch-gads.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const AW_ID = 'AW-10950182554';
const CALL_LABEL = AW_ID + '/ksVNCKHt8-ccEJqNuuUo';
const PHONE = '0422 023 413';
const ANCHOR = '<!-- End Google Tag Manager -->';

const SNIPPET =
  '\n  <!-- Google Ads: calls-from-website conversion -->\n' +
  '  <script async src="https://www.googletagmanager.com/gtag/js?id=' + AW_ID + '"></script>\n' +
  '  <script>\n' +
  '    window.dataLayer = window.dataLayer || [];\n' +
  '    function gtag(){dataLayer.push(arguments);}\n' +
  "    gtag('js', new Date());\n" +
  "    gtag('config', '" + AW_ID + "');\n" +
  "    gtag('config', '" + CALL_LABEL + "', {\n" +
  "      'phone_conversion_number': '" + PHONE + "'\n" +
  '    });\n' +
  '  </script>\n' +
  '  <!-- End Google Ads -->';

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'assets') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'index.html') out.push(full);
  }
}

const files = [];
walk(ROOT, files);
let patched = 0, skipped = 0, missing = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (src.indexOf(AW_ID) !== -1) { skipped++; continue; }
  const i = src.indexOf(ANCHOR);
  if (i === -1) { missing.push(path.relative(ROOT, file)); continue; }
  const at = i + ANCHOR.length;
  fs.writeFileSync(file, src.slice(0, at) + SNIPPET + src.slice(at), 'utf8');
  patched++;
}
console.log('patch-gads.js: patched ' + patched + ', skipped ' + skipped + ' (already had ' + AW_ID + ').');
if (missing.length) console.log('No GTM anchor (not patched): ' + missing.join(', '));
