import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

function createServer() {
  return http.createServer((req, res) => {
    const urlPath = new URL(req.url, "http://localhost").pathname;
    let p = path.join(DIST, urlPath);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) {
      res.end(fs.readFileSync(p));
    } else {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
}

async function run() {
  console.log("Starting local test server for Pagefind validation...");
  const server = createServer();

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server listening on port ${port}.`);

  let totalFailures = 0;

  try {
    const pagefind = await import(path.join(DIST, "pagefind", "pagefind.js"));
    await pagefind.options({ basePath: `http://localhost:${port}/pagefind/` });
    await pagefind.init();

    const testSuites = [
      {
        query: "medford roofing",
        expectedCity: "medford",
        expectedIndustryOrCategory: ["construction-home-services", "roofing"],
        forbiddenCities: ["eugene", "salem", "portland", "klamath-falls", "bend"],
      },
      {
        query: "medford roofers",
        expectedCity: "medford",
        expectedIndustryOrCategory: ["construction-home-services", "roofing"],
        forbiddenCities: ["eugene", "salem", "portland", "klamath-falls", "bend"],
      },
      {
        query: "medford real estate",
        expectedCity: "medford",
        expectedIndustryOrCategory: ["real-estate"],
        forbiddenCities: ["eugene", "portland", "salem", "bend"],
      },
      {
        query: "eugene plumbers",
        expectedCity: "eugene",
        expectedIndustryOrCategory: ["construction-home-services", "plumbing"],
        forbiddenCities: ["medford", "portland", "salem", "bend"],
      },
      {
        query: "eugene roofing",
        expectedCity: "eugene",
        expectedIndustryOrCategory: ["construction-home-services", "roofing"],
        forbiddenCities: ["medford", "salem", "portland"],
      },
      {
        query: "bend electricians",
        expectedCity: "bend",
        expectedIndustryOrCategory: ["construction-home-services", "electrical"],
        forbiddenCities: ["medford", "eugene", "portland"],
      },
    ];

    for (const test of testSuites) {
      console.log(`\n--------------------------------------------------`);
      console.log(`Testing query: "${test.query}"`);
      const search = await pagefind.search(test.query);
      console.log(`Total results returned: ${search.results.length}`);

      if (search.results.length === 0) {
        console.error(`FAIL: Query "${test.query}" returned 0 results.`);
        totalFailures++;
        continue;
      }

      const rawDataList = await Promise.all(
        search.results.slice(0, 15).map((r) => r.data())
      );

      // Apply the same city-aware prioritization implemented in SearchBar.astro
      const sortedData = rawDataList.slice().sort((a, b) => {
        const aMatch =
          a.meta?.city?.toLowerCase() === test.expectedCity ||
          (a.raw_url || a.url).includes("/" + test.expectedCity + "/");
        const bMatch =
          b.meta?.city?.toLowerCase() === test.expectedCity ||
          (b.raw_url || b.url).includes("/" + test.expectedCity + "/");
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });

      const topCount = Math.min(5, sortedData.length);
      let topMatchingCity = 0;

      for (let i = 0; i < topCount; i++) {
        const d = sortedData[i];
        const url = d.raw_url || d.url;
        const title = d.meta?.title || "";
        const cityMeta = d.meta?.city?.toLowerCase() || "";

        console.log(`  [#${i + 1}] Title: "${title}"`);
        console.log(`       URL: ${url}`);
        console.log(`       Meta City: "${cityMeta}"`);

        // Check for forbidden cross-city bleeding in top results
        for (const forbidden of test.forbiddenCities) {
          if (url.includes(`/city/${forbidden}/`) || url.includes(`/${forbidden}/`)) {
            console.error(`  FAIL: Result #${i + 1} leaked forbidden city "${forbidden}" into "${test.query}"!`);
            totalFailures++;
          }
        }

        // Check for paginated slices
        if (url.includes("/page/")) {
          console.error(`  FAIL: Result #${i + 1} is a paginated slice: ${url}`);
          totalFailures++;
        }

        // Verify city match
        if (url.includes(`/${test.expectedCity}/`) || cityMeta === test.expectedCity) {
          topMatchingCity++;
        }
      }

      if (topMatchingCity === 0) {
        console.error(`FAIL: Zero of the top ${topCount} results matched expected city "${test.expectedCity}".`);
        totalFailures++;
      } else {
        console.log(`PASS: ${topMatchingCity}/${topCount} top results correctly matched "${test.expectedCity}".`);
      }
    }

  } catch (err) {
    console.error("Test execution error:", err);
    totalFailures++;
  } finally {
    server.close();
  }

  console.log(`\n==================================================`);
  if (totalFailures === 0) {
    console.log("ALL PAGEFIND SEARCH QUALITY CHECKS PASSED (0 failures)!");
    process.exit(0);
  } else {
    console.error(`PAGEFIND SEARCH CHECKS FAILED WITH ${totalFailures} ERRORS!`);
    process.exit(1);
  }
}

run();
