/* ============================================================
   patch-quote-form.js — one-shot migrator that rewrites the quote
   <form> open tag + preceding Web3Forms hidden fields on every
   index.html in the project. Idempotent: skips files already
   pointing at /api/enquiry.

   Run: node patch-quote-form.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const RE_FORM = /<form class="quote-form[^"]*"[^>]*id="quoteForm"[^>]*action="https:\/\/api\.web3forms\.com\/submit"[^>]*>[\s\S]*?(?=<div class="quote-field")/;

const REPLACEMENT =
  '<form class="quote-form reveal" id="quoteForm" action="/api/enquiry" method="POST" novalidate>\n' +
  '            <input type="checkbox" name="botcheck" class="visually-hidden" style="display:none" tabindex="-1" autocomplete="off">\n' +
  '            <input type="hidden" name="submitted_from" id="qSubmittedFrom" value="">\n' +
  '            ';

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
let patched = 0, skipped = 0, missing = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/id="quoteForm"/.test(src)) { missing++; continue; }
  if (!RE_FORM.test(src)) { skipped++; continue; }
  const next = src.replace(RE_FORM, REPLACEMENT);
  if (next !== src) { fs.writeFileSync(file, next, 'utf8'); patched++; }
}
console.log(`patch-quote-form.js: patched ${patched} files, skipped ${skipped} (already migrated), ${missing} without quote form.`);
