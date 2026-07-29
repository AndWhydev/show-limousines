/* ============================================================
   patch-gtm.js — inserts the Google Tag Manager head + noscript
   body snippets on every index.html in the project. Idempotent:
   files that already contain the GTM container ID are skipped.

   Run: node patch-gtm.js  (also chained by build.js)
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const GTM_ID = 'GTM-TRNBVN7N';

const HEAD_SNIPPET =
  '  <!-- Google Tag Manager -->\n' +
  '  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':\n' +
  '  new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],\n' +
  '  j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=\n' +
  '  \'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);\n' +
  '  })(window,document,\'script\',\'dataLayer\',\'' + GTM_ID + '\');</script>\n' +
  '  <!-- End Google Tag Manager -->\n';

const BODY_SNIPPET =
  '\n  <!-- Google Tag Manager (noscript) -->\n' +
  '  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' + GTM_ID + '"\n' +
  '  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n' +
  '  <!-- End Google Tag Manager (noscript) -->';

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
let patched = 0, skipped = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  if (src.indexOf(GTM_ID) !== -1) { skipped++; continue; }
  // Insert head snippet immediately after the opening <head> tag.
  const nextHead = src.replace(/<head>\s*\n?/, function (m) { return m + HEAD_SNIPPET; });
  // Insert noscript snippet immediately after the opening <body ...> tag.
  const nextBoth = nextHead.replace(/<body\b[^>]*>/, function (m) { return m + BODY_SNIPPET; });
  if (nextBoth !== src) { fs.writeFileSync(file, nextBoth, 'utf8'); patched++; }
  else skipped++;
}
console.log('patch-gtm.js: patched ' + patched + ' files, skipped ' + skipped + ' (already had ' + GTM_ID + ' or no head/body match).');
