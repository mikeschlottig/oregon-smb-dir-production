# RAR Scraper & Extractor Composition — Stealth Analysis

- **Subject:** `/home/mikes/oregon-smb-directory/rar/` (36 files, 4,843 LOC, 28 Python).
- **Code index:** `/home/mikes/codebase-intel-toolkit/indexes/rar/codebase_intel_index.json`.
- **Written:** 2026-09-23, from reading the code, not from running it. No browser was
  opened for this analysis.
- **Proof of the method, per Mike:** 550K records over 8 days of continuous scraping, with
  0 bot flags. That figure is Mike's; this document doesn't re-derive it.

Every claim cites `file:line`. **[H]** marks an inference that hasn't been tested.

---

## 1. The two harvest paths

| path | entry point | harvester | used for |
|---|---|---|---|
| **A. BCRF-49 framework** (self-contained) | `orchestrator/bcrf49_framework_V_0_01.py` (`__main__`, `--no-headless` flag at :966) | `harvest_single_pin` :662 | 49-pin business-centred grids, keyword × pin, SQLite resume |
| **B. Pipeline + CLI** | `cli/rar_scan_V_0_01.py` → `orchestrator/pipeline_V_0_01.py` | `harvester/maps_harvester_V_0_01.py` `harvest_single_point` (imported at `cli/rar_scan_V_0_01.py:33`) | polar and H3 grids, optional proxy rotation |

- **Two versions of the harvester module:** `harvester/maps_harvester_V_0_02.py` is a
  newer copy of the harvester, but the CLI still imports V_0_01.
- **Scrapling's role:** in both paths Scrapling is the **parser** (`from scrapling import
  Selector`), not the fetcher. The browser is **Patchright**, a stealth-patched fork of
  Playwright, driving **real installed Google Chrome**.

## 2. Stealth rules as the code enforces them

### 2.1 Browser identity
- **Real Chrome, not bundled Chromium.**
  - Path A: `resolve_chrome_executable()` at `bcrf49…:289-310`, with
    `executable_path=chrome_path` at :829.
  - The V_0_02 harvester: `get_chrome_executable()` at `maps_harvester_V_0_02.py:27-47`.
- **Patchright:** `from patchright.async_api import async_playwright` at `bcrf49…:41` and
  `maps_harvester_V_0_02.py:13`.
- **Launch flags:** `--disable-blink-features=AutomationControlled --disable-infobars
  --no-first-run` (`bcrf49…:811`, `maps_harvester_V_0_02.py:171-173`). This removes the
  `navigator.webdriver` automation signal at the Blink level.
- **Context settings:**
  - viewport 1920×1080
  - `locale="en-US"`
  - `timezone_id="America/Los_Angeles"` (`bcrf49…:678-685`)
  - **geolocation set to the pin itself**, with the geolocation permission granted
    (:683-684), so the browser's location agrees with the `/@lat,lng,14z` viewport
- **Fixed user agent:** Windows Chrome/133 (`bcrf49…:313-318`).

### 2.2 One fresh identity per request
- **New context per pin.** `harvest_single_pin` opens a new `BrowserContext` for every
  pin and closes it in `finally` (:678, :747). There are no cookies or storage between
  pins.
- **Browser process restarted every 7 pins** (:854-863), with a 2 s pause (:858).

### 2.3 Navigation that looks like a person
- **Referrer warmup.** It loads `https://www.google.com/` first and waits 1.2–2.2 s
  (:696-697). Then it goes to Maps with `referer="https://www.google.com/"` (:706-711).
- **URL form:** only the explicit viewport `…/maps/search/<query>/@lat,lng,14z` (:703).
- **Surface boundary:** a UULE location parameter is never mixed into Maps viewport data
  (`uule/uule_codec_V_0_01.py:130-143`, `schemas/data_models_V_0_01.py:12-15`). Maps
  and Search observations are separate datasets.
- **Settle time:** it waits for `div[role="feed"]`, then 1.8–2.6 s at random (:716-719).

### 2.4 Mouse and scroll behaviour
The function is `humanized_feed_scroll`, `bcrf49…:354-410` (V_0_02: :84-130).

- **Never Page Up or Page Down.** It's stated as a rule in the code (:357) and holds: the
  only scroll call is `page.mouse.wheel` (:387).
- **Moving to the list:** the cursor moves to the results list's centre ±10 px at random,
  in 8 interpolated steps (:373-375).
- **Scroll distance:** lognormal, `lognormvariate(6.3, 0.2)` ≈ 545 px median, clamped
  to 350–800 px (:385-386).
- **Tremor:** a small ±4 px cursor move after each wheel step (:390-394).
- **Reading pause:** lognormal, clamped to 1.0–3.5 s (:396). In **12%** of cycles a
  "distraction" adds 1.8–3.2 s (:397-398).
- **Stops early** once 20 results are loaded or Google shows "end of the list"
  (:381-382, :401-405). There's no scrolling past the end.

### 2.5 Pacing
- **Between pins:** 3–6 s at random (`bcrf49…:919`). The comment says lognormal; the code
  is uniform.
- **Retry backoff:** `2**attempt + uniform(1,3)` s, 3 attempts at most (:867-892).
- **Path B, between points:** uniform 1.5–3.5 s by default (`pipeline_V_0_01.py:93-94`,
  :163-166).
- **One browser at a time.** Pins run sequentially: no concurrency, no semaphore, no
  parallel contexts anywhere in `rar/`.

### 2.6 Block detection (circuit breaker)
- **Challenge text checks:**
  - Path A (`check_for_challenge`, `bcrf49…:326-336`): recaptcha, "please verify you
    are a human", "unusual traffic from your computer network", Cloudflare challenge
    markers.
  - V_0_02 adds "detected automated queries" and "please solve this captcha"
    (`maps_harvester_V_0_02.py:63-70`).
- **Where it's checked:** after load (:722-724), and in V_0_02 again after scrolling
  (:239-245).
- **Path B:** trips after **2 consecutive failures** and aborts the scan
  (`pipeline_V_0_01.py:41`, :149-161; the CLI also passes `2` at
  `cli/rar_scan_V_0_01.py:161`).

### 2.7 Proxies (optional)
The adapter is `proxy/proxy_adapter_V_0_01.py`. It is wired into **path B only**. Path A
launches with no proxy, so it uses the machine's own IP.

- **Sticky:** one exit per `scan_id_point_id` session (:63-90).
- **Round robin** across healthy nodes (:85-86).
- **Quarantine:** a node is benched for 300 s after 3 consecutive failures (:94-110).
- **Supported endpoints:** Bright Data residential and Cloudflare (:112-141).

### 2.8 Evidence kept per request
- **What:** each pin saves `viewport.html` and `viewport.png` under
  `artifacts/<keyword>/<pin>/` (`bcrf49…:730-740`).
- **Why:** every ranking can be re-parsed or audited without going back to Google.
- **Resume:** finished pins are skipped on restart (`store.is_pin_completed`, :841-852).
  An interrupted run never re-requests work it already has.

## 3. The extractor (what fields come out)

Two copies:
- `extract_listings_from_html`, `bcrf49…:413-494`
- `extractor/maps_extractor_V_0_01.py`

Both run Scrapling `Selector` over the saved HTML, one card per `div.Nv2PK`:

| field | selector / rule | line |
|---|---|---|
| name | `a.hfpxzc::attr(aria-label)` | :420 |
| Maps URL | `a.hfpxzc::attr(href)` | :423 |
| star rating | `span.MW4etd` → float | :430-434 |
| review count | `span.UY7F9` → `\(([\d,]+)\)` | :438-443 |
| category / phone / address | heuristics over `div.W4Efsd` spans | :445-465 |
| feature ID / CID | `0x…:(0x…)` from the href | :471 |
| place ID | `!1s([^!]+)` from the href | :477-479 |

Two limits:
- **It reads result cards from a search, not a single place page.** A single place page
  (like the Daley link) uses different markup that this extractor doesn't parse. **[H]**
- **The class names are Google's generated names** (`Nv2PK`, `MW4etd`, `UY7F9`, `W4Efsd`).
  When Google renames them, extraction returns empty fields, and nothing raises an error.

## 4. Findings — where code and doctrine disagree

1. **Path A retries after a CAPTCHA.**
   - What happens: `harvest_single_pin` raises `HarvesterCircuitBreakerError` on a
     challenge (:723-724). The retry loop catches **every** `Exception` (:886) and tries
     the same pin twice more, after about 3–5 s and then about 5–7 s of backoff (:891).
   - Why it matters: it retries in the **same browser** within seconds. Mike's rule for a
     block is to tear the browser down, start a new one, come in through a different
     referrer path, and retry. (An earlier draft of this doc said "stop all traffic";
     Claude invented that and Mike rejected it.)
   - **Fix:** implemented in the separate project `/home/mikes/rar-linux` (see its
     `research/CONFIGURATION-BREAKDOWN.md` §3.1). `rar/` itself is unchanged.
   - **Note:** the production data came from the per-business runner scripts in the
     original archive, not from this framework file. See rar-linux's breakdown, §3.4.
2. **The user agent can contradict the platform. [H]**
   - `bcrf49…:313-318` always claims Windows Chrome/133. Run on Linux or WSL (the
     `/usr/bin/google-chrome` branch, :305), `navigator.platform` and the client-hint
     headers will say Linux, and Chrome's real version may not be 133.
   - V_0_02 (:50-60) claims Mac on any non-Windows host.
   - The 550K run presumably ran on Windows, where they agree.
   - **Fix:** leave the user agent at real Chrome's own value, or derive it from the
     running browser.
3. **Some comments overstate the code.**
   - Docstrings say "Bezier steps" (`maps_harvester_V_0_02.py:88`), but
     `mouse.move(steps=8)` is a straight line.
   - A comment says the pin delay is lognormal (`bcrf49…:918`), but it's uniform (:919).
   - Behaviour matches the proven run either way. Only the documentation is off.
4. **Headless is the default** (`bcrf49…:668`, and `--no-headless` to turn it off at
   :966). Whether the 550K run was headless isn't recorded in code. **[H]** Record
   the mode used.
5. **Path A has no proxy.** Every pin goes out from the machine's own IP. That is the
   configuration the 0-flag proof covers. Adding volume beyond it should go through path
   B's sticky residential proxies.

## 5. What this means for the directory work

- **Browser tools must not touch Google.** Chrome DevTools MCP, the Claude browser
  extension, and similar tools launch a browser with none of section 2. There's no
  AutomationControlled flag, no referrer warmup, no fresh context, and no kinematics,
  and a scripted Search query right after a Maps load looks like a bot. The rule saved in
  memory (`google-services-stealth-only`) matches this code.
- **Getting ratings for directory listings, if Mike approves a run:**
  - Reuse path A's `harvest_single_pin` with `query = "<business name> <city>"`,
    `lat,lng` = the business's own coordinates, and one pin per business.
  - Match the extracted card by feature ID, not by name.
  - The pacing and circuit-breaker rules above apply unchanged, with finding 1 fixed
    first.
  - **Nothing has been run.** Browser use waits for Mike's instruction.
