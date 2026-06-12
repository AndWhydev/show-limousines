/* One-off: lift the inline <style> and inline app <script> out of index.html
   into shared styles.css + main.js (verbatim), and relink. The design system
   is unchanged — only relocated so every page can share it. */
'use strict';
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// --- CSS: the single inline <style>…</style> ---
const styleM = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleM) throw new Error('no inline <style> found');
fs.writeFileSync('styles.css', styleM[1].replace(/^\n/, ''), 'utf8');
html = html.replace(styleM[0], '<link rel="stylesheet" href="styles.css">');

// --- JS: the inline app <script> (the one WITHOUT a src=) ---
// Match a <script> with no attributes immediately followed by JS.
const scriptM = html.match(/<script>\s*\n([\s\S]*?)<\/script>\s*<\/body>/);
if (!scriptM) throw new Error('no inline app <script> before </body> found');
fs.writeFileSync('main.js', scriptM[1].replace(/^\n/, ''), 'utf8');
html = html.replace(scriptM[0], '<script src="main.js"></script>\n</body>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('styles.css:', fs.statSync('styles.css').size, 'bytes');
console.log('main.js   :', fs.statSync('main.js').size, 'bytes');
console.log('index.html now links external CSS/JS; inline blocks removed.');
