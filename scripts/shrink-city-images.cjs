// One-off source fix (2026-10-10): three city photos were 9-10 MB PNGs that Astro shipped as-is.
// Re-encodes them as 1600px-wide JPGs. Originals remain in git history (commit before this one).
// Usage: node scripts/shrink-city-images.cjs
const sharp = require(process.cwd() + "/node_modules/sharp");
const dir = "src/images/cities/";
const files = {
  "bend_oregon_website_image.png": "bend.jpg",
  "corvallis_website_image.png": "corvallis.jpg",
  "klamath_falls_oregon.png": "klamath-falls.jpg",
};
(async () => {
  for (const [from, to] of Object.entries(files)) {
    const info = await sharp(dir + from).resize({ width: 1600, withoutEnlargement: true })
      .flatten({ background: "#ffffff" }).jpeg({ quality: 82, mozjpeg: true }).toFile(dir + to);
    console.log(`${from} -> ${to}: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(0)} KB`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
