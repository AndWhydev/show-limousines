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

// Simple Icons brand marks (public domain). Rendered inside a circle so they
// read as social buttons at signature scale. 96px source = crisp at 32-48px
// display size on retina.
const ICON_SIZE = 96;
const FB_PATH = 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z';
const IG_PATH = 'M12 2.163c3.204 0 3.584.012 4.849.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.849.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';

function socialSvg(pathData, glyphColor, bgColor) {
  // Circle background + brand glyph centered.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="${bgColor}"/>
    <path fill="${glyphColor}" d="${pathData}"/>
  </svg>`;
}

async function generateIcon(name, svg) {
  const dest = path.join(OUT, name);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(dest);
  const size = fs.statSync(dest).size;
  console.log('  wrote', path.relative(ROOT, dest), '(' + size + ' B)');
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

  // Charcoal social icons — match the wordmark colour, keep the signature elegant.
  await generateIcon('icon-facebook.png', socialSvg(FB_PATH, '#ffffff', '#1a1a1a'));
  await generateIcon('icon-instagram.png', socialSvg(IG_PATH, '#ffffff', '#1a1a1a'));
  // Brand-colour alternates for anyone who prefers the classic look.
  await generateIcon('icon-facebook-brand.png', socialSvg(FB_PATH, '#ffffff', '#1877F2'));
  await generateIcon('icon-instagram-brand.png', socialSvg(IG_PATH, '#ffffff', '#E4405F'));

  console.log('Done.');
})().catch((e) => { console.error(e); process.exit(1); });
