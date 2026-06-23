/* ============================================================
   gen-images.js — responsive image derivative generator.
   For each high-res source (fleet photos), emits WebP + AVIF at
   several widths (capped to the source width — never upscales) into
   /assets/img/, and writes assets/img-manifest.json that build.js
   reads to emit <picture> srcset markup.
   Idempotent: skips variants that already exist. Run: node gen-images.js
   ============================================================ */
'use strict';
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'assets', 'img');
fs.mkdirSync(OUT, { recursive: true });

// Target widths — cover >=2x for fleet cards (shown ~400–600px) and the
// larger feature-media usage. Any width above a source's own width is dropped.
const WIDTHS = [400, 640, 960, 1280, 1600];

// Source set: the real high-res fleet photos (1600x893). banner-service-*.jpg
// are intentionally excluded — they are not referenced anywhere on the site.
const SOURCES = fs.readdirSync(ROOT).filter((f) => /^fleet-.*-v2\.jpg$/.test(f));

(async () => {
  const manifest = {};
  for (const f of SOURCES) {
    const base = f.replace(/\.jpg$/i, '');
    const meta = await sharp(f).metadata();
    const widths = WIDTHS.filter((w) => w <= meta.width);
    if (!widths.length) widths.push(meta.width);
    manifest[f] = { base, w: meta.width, h: meta.height, widths };

    for (const w of widths) {
      const webp = path.join(OUT, `${base}-${w}.webp`);
      const avif = path.join(OUT, `${base}-${w}.avif`);
      if (!fs.existsSync(webp)) await sharp(f).resize(w).webp({ quality: 72 }).toFile(webp);
      if (!fs.existsSync(avif)) await sharp(f).resize(w).avif({ quality: 50 }).toFile(avif);
    }
    console.log(`  ${f} -> ${widths.join(', ')}`);
  }

  fs.writeFileSync(path.join(ROOT, 'assets', 'img-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`manifest: ${Object.keys(manifest).length} images, widths ${WIDTHS.join('/')}`);
})();
