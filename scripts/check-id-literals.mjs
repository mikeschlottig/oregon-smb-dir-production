// Fails the build on a Google place ID ("ChIJ…") or feature ID ("0x…:0x…") typed into site
// code. IDs come from data (src/data/**) through src/lib/google-place-id.ts. A literal is
// allowed only with an `id-source:` comment on the same or previous line naming the file it
// was taken from, so every hard-coded ID can be traced and re-checked.
//
// Why (2026-09-24): a place ID copied from a synthetic test fixture was hard-coded into a
// listing's Maps link. It had the right shape and even decoded; it pointed at no business.
// See docs/TAXONOMY.md.
//
//   node scripts/check-id-literals.mjs        exit 1 on any untraced literal
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ID = /ChIJ[A-Za-z0-9_-]{20,}|0x[0-9a-f]{6,}:0x[0-9a-f]{6,}/gi;
const EXEMPT = [/^src\/data\//, /^src\/lib\/google-place-id\.ts$/, /^src\/types\/ids\.ts$/];

const walk = async (dir, out = []) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (/\.(astro|tsx?|mjs|mdx?)$/.test(e.name)) out.push(p);
  }
  return out;
};

const bad = [];
let traced = 0;
for (const file of await walk(path.join(root, "src"))) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  if (EXEMPT.some((r) => r.test(rel))) continue;
  const lines = (await readFile(file, "utf8")).split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(ID)) {
      if (/id-source:/.test(line) || /id-source:/.test(lines[i - 1] ?? "")) traced++;
      else bad.push(`${rel}:${i + 1}  ${m[0]}`);
    }
  });
}
if (bad.length) {
  console.error(`ID LITERALS — ${bad.length} untraced Google ID(s) in site code:`);
  for (const b of bad) console.error(`  ${b}`);
  console.error("Read the ID from the record (src/data) via src/lib/google-place-id.ts, or add an `id-source: <file>` comment.");
  process.exit(1);
}
console.log(`ID LITERALS — 0 untraced (${traced} traced with id-source)`);
