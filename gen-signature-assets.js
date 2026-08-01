/* ============================================================
   gen-signature-assets.js — email signature asset generator.
   The site's logo.png has a WHITE wordmark ("SHOW LIMOUSINES") on
   a transparent background, which reads perfectly on the site's dark
   pages but disappears when pasted into Gmail's white signature area.
   This script produces a signature-ready variant that swaps near-white
   pixels for dark charcoal so the wordmark renders on any background,
   while leaving the gold "S" monogram untouched.
   Outputs to /email/. Idempotent — safe to re-run.
   Run: node gen-signature-assets.js
   ============================================================ */
'use strict';
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'email');
fs.mkdirSync(OUT, { recursive: true });

// Threshold: any pixel with R,G,B all >= 200 is treated as "white wordmark"
// and swapped for CHARCOAL. Anti-aliased edges (partial-white pixels between
// 200 and 255) get partial swap via linear interpolation so the letterforms
// stay smooth instead of hard-edged.
const WHITE_MIN = 200;
const CHARCOAL = [26, 26, 26]; // #1a1a1a — deep neutral, reads on white AND light-cream backgrounds

async function generateSignatureLogo(sourceName, outName) {
  const src = path.join(ROOT, sourceName);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  for (let i = 0; i < out.length; i += 4) {
    const r = out[i], g = out[i + 1], b = out[i + 2];
    // Detect near-white: all three channels high AND close to each other (rules out gold, which is warm)
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    if (minC >= WHITE_MIN && (maxC - minC) <= 25) {
      // How white is it? 200 = 0% swap, 255 = 100% swap. Preserves anti-alias.
      const t = (minC - WHITE_MIN) / (255 - WHITE_MIN);
      out[i]     = Math.round(r * (1 - t) + CHARCOAL[0] * t);
      out[i + 1] = Math.round(g * (1 - t) + CHARCOAL[1] * t);
      out[i + 2] = Math.round(b * (1 - t) + CHARCOAL[2] * t);
    }
  }

  const dest = path.join(OUT, outName);
  await sharp(out, { raw: info }).png({ compressionLevel: 9 }).toFile(dest);
  const size = fs.statSync(dest).size;
  console.log('  wrote', path.relative(ROOT, dest), '(' + Math.round(size / 1024) + ' KB, ' + info.width + 'x' + info.height + ')');
}

(async () => {
  console.log('Generating signature assets...');
  // Full lockup with tagline
  await generateSignatureLogo('logo.png', 'logo-signature.png');
  // Wordmark-only variant (no tagline) — cleaner for tight signature layouts
  await generateSignatureLogo('logo-wordmark.png', 'logo-signature-wordmark.png');
  // Monogram-only fallback — self-contained, works on any background
  fs.copyFileSync(path.join(ROOT, 'favicon.png'), path.join(OUT, 'logo-monogram.png'));
  console.log('  wrote email/logo-monogram.png (copy of favicon.png)');
  console.log('Done.');
})().catch((e) => { console.error(e); process.exit(1); });
