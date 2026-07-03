#!/usr/bin/env node
/**
 * link-audit.mjs — Post-build link audit for Oregon SMB Directory.
 *
 * Walks dist HTML, builds internal-link graph, reports:
 * - Orphan pages (0 inbound links)
 * - Broken internal hrefs (target not in dist)
 * - Per-page link counts
 *
 * Output: link-audit-report.json + console summary.
 *
 * @see /home/mikes/docs/oregon-smb/InterlinkingResearch-astro-auto-linking-2026-07-03.md
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "..", "dist");
const reportPath = path.join(distPath, "link-audit-report.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all HTML files in dist */
async function getHtmlFiles() {
  const files = await glob("**/*.html", { cwd: distPath, absolute: true });
  return files;
}

/** Extract all internal hrefs from an HTML file */
function extractInternalLinks(html, baseUrl) {
  const links = new Set();
  // Match href="..." or href='...' (not starting with http, //, #, mailto:, tel:)
  const regex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    // Skip external, anchors, mailto, tel, javascript
    if (
      href.startsWith("http") ||
      href.startsWith("//") ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }
    // Normalize: remove trailing index.html, trailing slash
    let normalized = href
      .replace(/\/index\.html$/, "/")
      .replace(/\.html$/, "")
      .replace(/\/+$/, "") || "/";
    links.add(normalized);
  }
  return Array.from(links);
}

/** Check if a link target exists in dist */
function linkTargetExists(href, allFiles) {
  // Check various possible file paths
  const possiblePaths = [
    href,
    href + ".html",
    href + "/index.html",
    href.replace(/^\//, "") + ".html",
    href.replace(/^\//, "") + "/index.html",
  ];

  for (const p of possiblePaths) {
    const fullPath = path.join(distPath, p);
    if (fs.existsSync(fullPath)) return true;
  }

  // Also check if it's a directory with index.html
  const dirPath = path.join(distPath, href.replace(/^\//, ""));
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    if (fs.existsSync(path.join(dirPath, "index.html"))) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Main audit
// ---------------------------------------------------------------------------

async function runAudit() {
  console.log("🔍 Starting link audit...");
  console.log(`📁 Dist path: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    console.error("❌ Dist directory not found. Run `npm run build` first.");
    process.exit(1);
  }

  const htmlFiles = await getHtmlFiles();
  console.log(`📄 Found ${htmlFiles.length} HTML files`);

  const pageData = new Map(); // url → { outbound: [], file: string }
  const allUrls = new Set(); // all URLs that exist

  // First pass: collect all URLs and outbound links
  for (const file of htmlFiles) {
    const relativePath = path.relative(distPath, file);
    let url = "/" + relativePath.replace(/\\/g, "/").replace(/index\.html$/, "").replace(/\.html$/, "");
    if (url.endsWith("/")) url = url.slice(0, -1);
    if (url === "") url = "/";

    allUrls.add(url);

    const html = fs.readFileSync(file, "utf-8");
    const outbound = extractInternalLinks(html, url);

    pageData.set(url, {
      file: relativePath,
      outbound,
      inbound: [], // populated in second pass
    });
  }

  // Second pass: build inbound links
  for (const [url, data] of pageData.entries()) {
    for (const outUrl of data.outbound) {
      if (pageData.has(outUrl)) {
        pageData.get(outUrl).inbound.push(url);
      }
    }
  }

  // Third pass: find broken links and orphans
  const brokenLinks = [];
  const orphans = [];
  const linkCounts = [];

  for (const [url, data] of pageData.entries()) {
    // Check for broken outbound links
    for (const outUrl of data.outbound) {
      if (!allUrls.has(outUrl) && !linkTargetExists(outUrl, htmlFiles)) {
        brokenLinks.push({
          source: url,
          target: outUrl,
          file: data.file,
        });
      }
    }

    // Check for orphans (0 inbound, and not homepage)
    if (data.inbound.length === 0 && url !== "/") {
      orphans.push({
        url,
        file: data.file,
      });
    }

    linkCounts.push({
      url,
      outbound: data.outbound.length,
      inbound: data.inbound.length,
    });
  }

  // Summary stats
  const totalPages = pageData.size;
  const totalLinks = linkCounts.reduce((sum, p) => sum + p.outbound, 0);
  const avgLinks = totalPages > 0 ? (totalLinks / totalPages).toFixed(2) : 0;

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages,
      totalInternalLinks: totalLinks,
      avgLinksPerPage: parseFloat(avgLinks),
      brokenLinks: brokenLinks.length,
      orphans: orphans.length,
    },
    brokenLinks,
    orphans: orphans.slice(0, 50), // limit orphan list
    perPageStats: linkCounts.sort((a, b) => a.url.localeCompare(b.url)),
  };

  // Write report
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Report written to: ${reportPath}`);

  // Console summary
  console.log("\n═══════════════════════════════════════");
  console.log("  LINK AUDIT SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`  Total pages:         ${totalPages}`);
  console.log(`  Total internal links: ${totalLinks}`);
  console.log(`  Avg links/page:      ${avgLinks}`);
  console.log(`  Broken internal:      ${brokenLinks.length}`);
  console.log(`  Orphans (0 inbound): ${orphans.length}`);
  console.log("═══════════════════════════════════════\n");

  if (brokenLinks.length > 0) {
    console.log("❌ BROKEN INTERNAL LINKS (first 10):");
    brokenLinks.slice(0, 10).forEach((b) => {
      console.log(`   ${b.source} → ${b.target} (${b.file})`);
    });
    if (brokenLinks.length > 10) {
      console.log(`   ... and ${brokenLinks.length - 10} more`);
    }
  } else {
    console.log("✅ No broken internal links!");
  }

  if (orphans.length > 0) {
    console.log(`\n⚠️  Orphans (0 inbound, first 10 of ${orphans.length}):`);
    orphans.slice(0, 10).forEach((o) => {
      console.log(`   ${o.url} (${o.file})`);
    });
  }

  // Exit with error if broken links found
  if (brokenLinks.length > 0) {
    console.log("\n❌ Audit FAILED: broken internal links found.");
    process.exit(1);
  } else {
    console.log("\n✅ Audit PASSED: zero broken internal links.");
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
