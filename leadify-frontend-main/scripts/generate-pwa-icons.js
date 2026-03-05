/**
 * Generate PWA icons for the Leadify CRM application.
 *
 * Uses sharp to render an SVG brand icon (the pulse/heartbeat lines)
 * into properly sized PNG files for the PWA manifest.
 *
 * Usage:
 *   node scripts/generate-pwa-icons.js
 *
 * Output:
 *   public/icon-192x192.png
 *   public/icon-512x512.png
 *   public/apple-touch-icon.png  (180x180)
 *   public/favicon.svg
 *   public/favicon-32x32.png
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

// ---------------------------------------------------------------------------
// SVG icon: stylised vertical pulse lines matching the High Point Technology
// brand mark.  Gradient runs from purple (#7849ff) through magenta to
// red-orange (#ff6633) left-to-right.
//
// The design places the icon centred on a dark rounded-rect background so it
// works well as both a regular and maskable PWA icon.
//
// IMPORTANT: We use gradientUnits="userSpaceOnUse" because the gradient is
// applied to vertical lines whose objectBoundingBox has zero width, which
// would break the default objectBoundingBox gradient calculation.
// ---------------------------------------------------------------------------

function buildSvg(size) {
  // Padding as a fraction of size (safe zone for maskable icons is 10%)
  const pad = Math.round(size * 0.15);
  const innerSize = size - pad * 2;

  // Line parameters - 9 lines forming the pulse shape
  const lineCount = 9;
  const lineSpacing = innerSize / (lineCount + 1);
  const lineWidth = Math.max(Math.round(lineSpacing * 0.38), 2);

  // Heights for each line (as fraction of innerSize) - creates the pulse/heartbeat shape
  // Pattern: short, medium, tall, very-tall, tallest, very-tall, tall, medium, short
  const heightFractions = [0.35, 0.50, 0.65, 0.82, 0.95, 0.82, 0.65, 0.50, 0.35];

  // Compute the leftmost and rightmost x positions for gradient bounds
  const xLeft = pad + lineSpacing;
  const xRight = pad + lineSpacing * lineCount;

  // Build rounded-rect "lines" instead of <line> elements.
  // Each line is a tall thin rounded rectangle. This avoids the
  // objectBoundingBox gradient issue entirely.
  const rects = heightFractions.map((frac, i) => {
    const cx = pad + lineSpacing * (i + 1);
    const h = innerSize * frac;
    const y = pad + (innerSize - h) / 2;
    const x = cx - lineWidth / 2;
    const rx = lineWidth / 2;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${lineWidth}" height="${h.toFixed(1)}" rx="${rx.toFixed(1)}" fill="url(#grad)"/>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" gradientUnits="userSpaceOnUse" x1="${xLeft}" y1="0" x2="${xRight}" y2="0">
      <stop offset="0%" stop-color="#7849ff"/>
      <stop offset="40%" stop-color="#b83dba"/>
      <stop offset="70%" stop-color="#e8433a"/>
      <stop offset="100%" stop-color="#ff6633"/>
    </linearGradient>
    <linearGradient id="bg-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size}" y2="${size}">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1a1040"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="url(#bg-grad)"/>
  <g>
    ${rects}
  </g>
</svg>`;
}

// Favicon SVG - same design, tuned for small sizes
function buildFaviconSvg() {
  const size = 32;
  const pad = 4;
  const innerSize = size - pad * 2;
  const lineCount = 9;
  const lineSpacing = innerSize / (lineCount + 1);
  const lineWidth = 1.8;

  const heightFractions = [0.35, 0.50, 0.65, 0.82, 0.95, 0.82, 0.65, 0.50, 0.35];

  const xLeft = pad + lineSpacing;
  const xRight = pad + lineSpacing * lineCount;

  const rects = heightFractions.map((frac, i) => {
    const cx = pad + lineSpacing * (i + 1);
    const h = innerSize * frac;
    const y = pad + (innerSize - h) / 2;
    const x = cx - lineWidth / 2;
    const rx = lineWidth / 2;
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${lineWidth}" height="${h.toFixed(2)}" rx="${rx.toFixed(2)}" fill="url(#grad)"/>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="grad" gradientUnits="userSpaceOnUse" x1="${xLeft.toFixed(2)}" y1="0" x2="${xRight.toFixed(2)}" y2="0">
      <stop offset="0%" stop-color="#7849ff"/>
      <stop offset="40%" stop-color="#b83dba"/>
      <stop offset="70%" stop-color="#e8433a"/>
      <stop offset="100%" stop-color="#ff6633"/>
    </linearGradient>
    <linearGradient id="bg-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="32" y2="32">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1a1040"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="url(#bg-grad)"/>
  <g>
    ${rects}
  </g>
</svg>`;
}

async function generate() {
  console.log('Generating PWA icons...\n');

  // 1) icon-512x512.png
  const svg512 = buildSvg(512);
  await sharp(Buffer.from(svg512))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-512x512.png'));
  console.log('  Created: public/icon-512x512.png  (512x512)');

  // 2) icon-192x192.png
  const svg192 = buildSvg(192);
  await sharp(Buffer.from(svg192))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-192x192.png'));
  console.log('  Created: public/icon-192x192.png  (192x192)');

  // 3) apple-touch-icon.png (180x180)
  const svg180 = buildSvg(180);
  await sharp(Buffer.from(svg180))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('  Created: public/apple-touch-icon.png  (180x180)');

  // 4) favicon.svg
  const faviconSvg = buildFaviconSvg();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvg, 'utf8');
  console.log('  Created: public/favicon.svg  (32x32)');

  // 5) favicon-32x32.png
  await sharp(Buffer.from(buildSvg(32)))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
  console.log('  Created: public/favicon-32x32.png  (32x32)');

  // Also write the 512 SVG for reference / future use
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), buildSvg(512), 'utf8');
  console.log('  Created: public/icon.svg  (512x512 SVG source)');

  console.log('\nDone! All PWA icons generated successfully.');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
