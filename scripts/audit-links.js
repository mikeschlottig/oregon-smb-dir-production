#!/usr/bin/env node

/**
 * Post-build link audit script for Oregon SMB Directory.
 *
 * Crawls the built `dist/` directory, extracts all internal hrefs,
 * and verifies they resolve to actual built files.
 *
 * Memory-efficient version using regex instead of JSDOM.
 *
 * Usage:
 *   node scripts/audit-links.js [dist-path] [output-path]
 *
 * Defaults:
 *   dist-path: ./dist
 *   output-path: ./audit-report.json
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DIST_PATH = process.argv[2] ?? './dist';
const OUTPUT_PATH = process.argv[3] ?? './audit-report.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect all HTML files in a directory. */
function collectHtmlFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }

  return results;
}

/** Extract all hrefs from HTML using regex (memory-efficient). */
function extractHrefs(html) {
  const hrefs = [];
  // Match href="..." or href='...'
  const regex = /href\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

/** Check if a file exists (try various extensions). */
function fileExists(filePath) {
  if (fs.existsSync(filePath)) return true;
  
  const variations = [
    filePath + '.html',
    path.join(filePath, 'index.html'),
    filePath.replace(/\.html$/, '') + '/index.html',
  ];
  
  for (const variation of variations) {
    if (fs.existsSync(variation)) return true;
  }
  
  return false;
}

/** Check if an href resolves to a built file. */
function checkLink(href, currentPageDir) {
  // Skip non-internal links
  if (!href || 
      href.startsWith('http') || 
      href.startsWith('//') || 
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')) {
    return null; // Not an internal link
  }

  // Resolve relative to current page
  let resolved;
  if (href.startsWith('/')) {
    resolved = path.join(DIST_PATH, href);
  } else {
    resolved = path.resolve(currentPageDir, href);
  }

  // Normalize
  resolved = resolved.split('#')[0].split('?')[0];

  if (fileExists(resolved)) {
    return null; // Link is valid
  }

  return href; // Broken link
}

// ---------------------------------------------------------------------------
// Main audit logic
// ---------------------------------------------------------------------------

function runAudit() {
  if (!fs.existsSync(DIST_PATH)) {
    console.error(`Error: dist path "${DIST_PATH}" does not exist.`);
    process.exit(1);
  }

  console.log(`Auditing links in ${DIST_PATH}...`);

  const htmlFiles = collectHtmlFiles(DIST_PATH);
  console.log(`Found ${htmlFiles.length} HTML files to crawl.`);

  const brokenLinks = [];
  let totalLinksChecked = 0;

  for (const htmlFile of htmlFiles) {
    const relativePath = '/' + path.relative(DIST_PATH, htmlFile).replace(/\\/g, '/');
    const content = fs.readFileSync(htmlFile, 'utf-8');
    const currentPageDir = path.dirname(htmlFile);

    const hrefs = extractHrefs(content);
    totalLinksChecked += hrefs.length;

    for (const href of hrefs) {
      const broken = checkLink(href, currentPageDir);
      if (broken) {
        brokenLinks.push({
          page: relativePath,
          href: broken,
          reason: 'File not found in dist/',
        });
      }
    }

    // Progress indicator
    if (htmlFiles.indexOf(htmlFile) % 1000 === 0) {
      console.log(`  Processed ${htmlFiles.indexOf(htmlFile)}/${htmlFiles.length} files...`);
    }
  }

  // Separate broken links on non-blog pages
  const brokenLinksNonBlog = brokenLinks.filter((link) => !link.page.startsWith('/blog/'));

  const report = {
    pagesCrawled: htmlFiles.length,
    linksChecked: totalLinksChecked,
    brokenLinks,
    brokenCount: brokenLinks.length,
    brokenCountNonBlog: brokenLinksNonBlog.length,
  };

  // Write report
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nAudit complete:`);
  console.log(`  Pages crawled: ${report.pagesCrawled}`);
  console.log(`  Links checked: ${report.linksChecked}`);
  console.log(`  Broken links: ${report.brokenCount}`);
  console.log(`  Broken links (non-blog): ${report.brokenCountNonBlog}`);

  if (brokenLinks.length > 0) {
    console.log(`\nBroken links (showing first 20):`);
    for (const broken of brokenLinks.slice(0, 20)) {
      console.log(`  ${broken.page} -> ${broken.href}`);
    }
    if (brokenLinks.length > 20) {
      console.log(`  ... and ${brokenLinks.length - 20} more`);
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

runAudit();
