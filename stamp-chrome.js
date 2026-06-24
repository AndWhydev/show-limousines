/* ============================================================
   stamp-chrome.js — keep the SHARED chrome on the static (ejected) pages in sync
   with the single source in build.js. Rewrites ONLY the regions between the
   <!--CHROME:header …--> / <!--CHROME:footer …--> markers that restore.js placed;
   the frozen OLD <main> between them is never touched.

   Run this after editing header()/mobileNav()/footer()/subFooter() in build.js so
   nav/footer/sub-footer changes propagate to these pages too.
   Run: node stamp-chrome.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./build.js'); // single source of chrome
const ROOT = __dirname;

const RE_HEADER = /(  <!--CHROME:header start[^\n]*-->\n)[\s\S]*?(\n  <!--\/CHROME:header end-->)/;
const RE_FOOTER = /(  <!--CHROME:footer start[^\n]*-->\n)[\s\S]*?(\n  <!--\/CHROME:footer end-->)/;

let stamped = 0, skipped = 0;
for (const slug of C.RESTORE_SLUGS) {
  const route = C.pathFor(slug);
  const file = path.join(ROOT, route.replace(/^\/|\/$/g, ''), 'index.html');
  if (!fs.existsSync(file)) { skipped++; continue; }
  let html = fs.readFileSync(file, 'utf8');
  if (!RE_HEADER.test(html) || !RE_FOOTER.test(html)) { skipped++; continue; }
  html = html.replace(RE_HEADER, (m, a, b) => a + C.header(route) + '\n' + C.mobileNav(route) + b);
  html = html.replace(RE_FOOTER, (m, a, b) => a + C.footer() + b);
  fs.writeFileSync(file, html, 'utf8');
  stamped++;
}
console.log(`stamp-chrome.js: re-stamped chrome on ${stamped} pages (${skipped} skipped).`);
