/* ============================================================
   patch-contact-sep.js — insert a visually-hidden "." separator at the end of
   every footer / quote-aside contact row on every index.html in the project.

   Why: the contact rows are adjacent block elements separated only by a newline
   plus indentation. A text extractor that collapses whitespace runs (which is
   what produced the "…WollongongPhone 0422 023 413Email info@…" Google snippet)
   welds the fields together. Whitespace cannot fix this — a whitespace-only
   change is eaten by the same collapse. A non-whitespace character survives it,
   so the fallback text reads "…Wollongong. Phone 0422 023 413. Email info@…".

   The separator uses the existing .visually-hidden utility (clip-rect +
   position:absolute), so it is out of flow: no layout impact, including inside
   the flex contact rows. Screen readers announce a sentence break between
   fields, which is the intended reading.

   Source of truth is build.js footer() / the quote-aside block; this script
   exists because the /limo-hire-*, fleet, about-us and contact pages are PINNED,
   so neither build.js emit() nor stamp-chrome.js will rewrite them.

   Idempotent: a row that already ends with the separator is left alone.
   Run: node patch-contact-sep.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const SEP = '<span class="visually-hidden">. </span>';

/* Match a contact row's trailing </div></div> and insert SEP between them, but
   only when the row actually carries a label (so we never touch other markup)
   and does not already end with the separator. */
const RE_ROW = new RegExp(
  '(<div class="(?:foot__contact-row|quote-aside__row)">' +      // row open
  '(?:(?!<div class=")[\\s\\S])*?' +                             // row body, no nested row
  '<span class="(?:foot__contact-label|quote-aside__label)">[^<]*</span>' +
  '(?:(?!</div>)[\\s\\S])*?</div>)' +                            // inner wrapper close
  '(</div>)',                                                    // row close
  'g'
);

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'assets') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

/* A row that already carries the separator no longer matches RE_ROW (its inner
   </div> is no longer adjacent to the row's </div>), so detect that case
   separately — otherwise a re-run would misreport done pages as "no rows". */
const RE_DONE = new RegExp(
  '<div class="(?:foot__contact-row|quote-aside__row)">' +
  '(?:(?!<div class=")[\\s\\S])*?' + SEP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
);

let patched = 0, already = 0, none = 0, rows = 0;
for (const file of walk(ROOT, [])) {
  const before = fs.readFileSync(file, 'utf8');
  if (!RE_ROW.test(before)) {
    RE_ROW.lastIndex = 0;
    if (RE_DONE.test(before)) already++; else none++;
    continue;
  }
  RE_ROW.lastIndex = 0;
  let n = 0;
  const after = before.replace(RE_ROW, (m, head, tail) => {
    if (head.endsWith(SEP)) return m;            // already separated — idempotent
    n++;
    return head + SEP + tail;
  });
  if (after === before) { already++; continue; }
  fs.writeFileSync(file, after, 'utf8');
  rows += n;
  patched++;
  console.log(`  ✓ ${path.relative(ROOT, file)} (${n} rows)`);
}
console.log(`patch-contact-sep.js: patched ${patched} files (${rows} rows), ${already} already done, ${none} without contact rows.`);
