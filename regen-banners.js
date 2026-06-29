/* regen-banners.js — regenerate the page-hero banner JPEGs from their sharp
   native sources at high quality. The banner-*.jpg were low-quality 1.2x upscales
   of the native photos (heavy JPEG compression → soft when shown large). Each is
   re-rendered at 1920x1080 (16:9, same as before) from the best source with a mild
   sharpen and high JPEG quality. Same framing (the banner is the same photo).
   Excludes banner-svc-* (individual service pages) and the homepage poster source.
   Run: node regen-banners.js */
'use strict';
const sharp = require('sharp');
const fs = require('fs');

// banner file  ->  native source (sharper / higher-res, same framing)
const MAP = {
  'banner-fleet-chrysler-black-v2.jpg': 'fleet-chrysler-black-v2.jpg',
  'banner-fleet-chrysler-white-v2.jpg': 'fleet-chrysler-white-v2.jpg',
  'banner-fleet-chrysler-gullwing-v2.jpg': 'fleet-chrysler-gullwing-v2.jpg',
  'banner-fleet-chrysler-black-edition-v2.jpg': 'fleet-chrysler-black-edition-v2.jpg',
  'banner-fleet-rolls-royce-phantom-v2.jpg': 'fleet-rolls-royce-phantom-v2.jpg',
  'banner-fleet-mercedes-s-class-v2.jpg': 'fleet-mercedes-s-class-v2.jpg',
  'banner-fleet-mercedes-valente-v2.jpg': 'fleet-mercedes-valente-v2.jpg',
  'banner-fleet-mercedes-sprinter-v2.jpg': 'fleet-mercedes-sprinter-v2.jpg',
  'banner-fleet-hummer-white-v2.jpg': 'fleet-hummer-white-v2.jpg',
  'banner-fleet-hummer-green-v2.jpg': 'fleet-hummer-green-v2.jpg',
  'banner-fleet-vw-crafter-v2.jpg': 'fleet-vw-crafter-v2.jpg',
  'banner-hero-gullwing-poster.jpg': 'hero-gullwing-poster.jpg',
  'banner-wedding-rolls-royce.jpg': 'wedding-rolls-royce.png',
  'banner-wedding-mercedes-s-class.jpg': 'wedding-mercedes-s-class.png',
  'banner-wedding-chrysler-white.jpg': 'wedding-chrysler-white.png',
  'banner-wedding-chrysler-gullwing.jpg': 'wedding-chrysler-gullwing.png',
};

(async () => {
  for (const [out, src] of Object.entries(MAP)) {
    if (!fs.existsSync(src)) { console.log('SKIP (no source):', out); continue; }
    const sm = await sharp(src).metadata();
    const tmp = out + '.tmp.jpg';
    await sharp(src)
      .resize(1920, 1080, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
      .sharpen({ sigma: 0.6 })
      .jpeg({ quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toFile(tmp);
    const before = fs.statSync(out).size, after = fs.statSync(tmp).size;
    fs.renameSync(tmp, out);
    console.log(`${out}  <= ${src} (${sm.width}x${sm.height})  ${(before/1024|0)}KB -> ${(after/1024|0)}KB`);
  }
})();
