# Albany K10 gate forensics: "rock climbing gym Albany"

Read-only analysis. Nothing under src, output, keywords, queues or scripts was edited, moved, or run. Only this file was written.

## Method and identity notes

- Gate identity used: `(city_slug, industry, keyword_id, phrase)`. Gate rows in `output/kwsweep/gates.jsonl` carry all four.
- K10 is not unique by id. `keywords/keyword-sets.json:16`, `:35`, `:54`, `:73`, `:92`, `:111`, `:130`, `:149`, `:168`, `:187`, `:206`, `:225` each define a K10. The one matching this phrase is `keywords/keyword-sets.json:206`: `{ "id": "K10", "template": "rock climbing gym {city}" },`, inside the block that opens at `keywords/keyword-sets.json:196`: `"sports-fitness": { "keywords": [`. Industry is therefore sports-fitness.
- `output/kwsweep/nightly-20261027.log` contains NUL bytes. `rg` treats it as binary unless given `-a`. All parsing in this analysis strips NULs. `grep` is aliased in this environment and was not used.
- Timestamps differ by source. Log headers are local time: `output/kwsweep/nightly-20261027.log:1`: `=== 2026-10-27T11:52:26-07:00 start · budget 9 h · args: none`. `gates.jsonl` `finished_at` values are UTC.
- Parser pitfall found and corrected during the work. Passing gates print `Captured 20/20 rankings`. Failing gates print `Captured N rankings (End of Market reached)`. A first-pass regex missed the `20/20` form, so every figure in sections 5 and 6 comes from the corrected parse.
- Labels: OBSERVED means quoted from a file. INFERRED means my reasoning from quoted lines. UNVERIFIED means a claim without a quote here.

---

## 1. Timeline: every attempt at the Albany K10 gate

Five attempts. None completed. Each is one gate run that ended with `[kwsweep] incomplete (exit 1)`.

| # | Log : header line | Gate entered | End lines | gates.jsonl row | finished_at (UTC) | seconds | Verified at lock |
|---|---|---|---|---|---|---|---|
| A | `nightly-20261026.log:4653` | `:4672` | `:4809-4810` | `:555` | 2026-10-26T22:25:11 | 1368 | 46/49 |
| B | `nightly-20261026.log:5301` | `:5320` | `:5390-5391` | `:559` | 2026-10-27T03:19:48 | 388 | 47/49 |
| C | `nightly-20261027.log:26` | `:45` | `:112-113` | `:599` | 2026-10-27T19:05:21 | 377 | 47/49 |
| D | `nightly-20261028.log:26` | `:45` | `:111-112` | `:603` | 2026-10-28T22:53:06 | 291 | 48/49 |
| E | `nightly-20261029.log:26` | `:45` | `:105-106` | `:645` | 2026-10-30T04:38:35 | 159 | 48/49 |

Evidence for the header and entry lines (OBSERVED):
- `output/kwsweep/nightly-20261026.log:4653`: "[kwsweep] Albany · sports-fitness · K10 · 'rock climbing gym Albany'"
- `output/kwsweep/nightly-20261026.log:4672`: ">>> ENTERING GATE FOR KEYWORD [1/1]: [K10] 'rock climbing gym Albany'"
- `output/kwsweep/nightly-20261026.log:5301`: "[kwsweep] Albany · sports-fitness · K10 · 'rock climbing gym Albany'"
- `output/kwsweep/nightly-20261027.log:26`, `nightly-20261028.log:26`, `nightly-20261029.log:26`: same header text as above.
- Attempt B's gate-entry line (`nightly-20261026.log:5320`) is quoted as ">>> ENTERING GATE FOR KEYWORD [1/1]: [K10] 'rock climbing gym Albany'".

Rows in `output/kwsweep/gates.jsonl` (OBSERVED), one per attempt:
- `:555`: `{"city_slug": "albany", "industry": "sports-fitness", "keyword_id": "K10", "phrase": "rock climbing gym Albany", "status": "incomplete (exit 1)", "rows": 0, "seconds": 1368, "finished_at": "2026-10-26T22:25:11.080084+00:00"}`
- `:559`, `:599`, `:603`, `:645`: same keys, with `"seconds": 388`, `377`, `291`, `159` and `"finished_at"` dates 2026-10-27T03:19:48, 2026-10-27T19:05:21, 2026-10-28T22:53:06, 2026-10-30T04:38:35.

Other K10 appearances (OBSERVED):
- `output/kwsweep/nightly-20261026.log:5279`: "[probe] Albany · K10 · 'rock climbing gym Albany': short (2) ['Valley Rock Gym', 'SOLID ROCK FITNESS']". This is the centroid probe before the gate.
- `output/kwsweep/adhoc-20261025-131655.log`: `rg -c -i 'rock climbing'` returned no count for this file. No K10 attempt there.

**Count: 5 attempts** (two in `nightly-20261026.log`, one each in the 10-27, 10-28 and 10-29 logs). Zero complete.

---

## 2. Pins visited, rankings per pin, and pins at 20

All five attempts used the same pass structure. Pins that had already been verified were served from cache (`[CACHED] ... verified with N rankings`). Only the remaining pins were queried live.

| Attempt | Live queries | Cached pins | Live captures OK | "Place jump" lines | "Partial harvest" lines | Verified at lock |
|---|---|---|---|---|---|---|
| A | 49 | 0 | 46 | 20 | 9 | 46/49 |
| B | 3 | 46 | 1 | 7 | 6 | 47/49 |
| C | 2 | 47 | 0 | 6 | 6 | 47/49 |
| D | 2 | 47 | 1 | 6 | 5 | 48/49 |
| E | 1 | 48 | 0 | 3 | 3 | 48/49 |

(Counts are parser output over each section, labelled INFERRED from parsing. The quoted lines in section 3 and below are the verifiable evidence.)

**Pins returning the full 20: zero, in all five attempts.** Quoted evidence: the largest N observed for any Albany K10 pin is 8, at pin 47 (`output/kwsweep/nightly-20261029.log:101`: "[47/49] [CACHED] albany_or_bcrf49_r8.00_SW (8.00 mi SW) verified with 8 rankings.").

**Pins returning fewer than 20, and the stated reason:**
- Attempt A live captures: 46 of 46 were "End of Market reached". The histogram is 2 rankings x42, 4 x1 (pin 39), 5 x2 (pins 35, 36), 8 x1 (pin 47). Example, `output/kwsweep/nightly-20261026.log:4676`: "[OK] Captured 2 rankings (End of Market reached). Top: 'Valley Rock Gym' | Rank #2: 'SOLID ROCK FITNESS'"
- Cached lines carry no reason text. Example, `output/kwsweep/nightly-20261029.log:48`: "[01/49] [CACHED] albany_or_bcrf49_r0.00_centroid (0.00 mi CENTER) verified with 2 rankings."

### Most recent attempt (E, `nightly-20261029.log`): pin -> N

No complete Albany K10 attempt exists, so the most recent attempt is E. Verified pins come from `nightly-20261029.log:48-103`. Pin 30 is the only live query, and it is the pin that failed.

| Pin | Coordinates label | N | Status | Quoted line |
|---|---|---|---|---|
| 01 | r0.00_centroid | 2 | cached | :48 |
| 02-25 | (see lines) | 2 each | cached | :49-:72 |
| 26 | r2.00_N | 1 | cached | :73 "[26/49] [CACHED] albany_or_bcrf49_r2.00_N (2.00 mi N) verified with 1 rankings." |
| 27-29 | | 2 each | cached | :74-:76 |
| **30** | **r2.00_S** | **none** | **FAILED** | :77 "[30/49] Querying albany_or_bcrf49_r2.00_S at (44.6076, -123.1059) \| 2.00 mi S..." |
| 31-34 | | 2 each | cached | :85-:88 |
| 35 | r4.00_NE | 5 | cached | :89 "verified with 5 rankings." |
| 36 | r4.00_E | 5 | cached | :90 |
| 37-38 | | 2 each | cached | :91-:92 |
| 39 | r4.00_SW | 4 | cached | :93 "verified with 4 rankings." |
| 40-46 | | 2 each | cached | :94-:100 |
| 47 | r8.00_SW | 8 | cached | :101 "verified with 8 rankings." |
| 48-49 | | 2 each | cached | :102-:103 |

Count for E: 48 pins verified (every pin except 30). Pins at 20: 0. Pins below 20: 48 (cached values 1, 2, 4, 5, 8). Pin 30's failure sequence: `:78` "[~] Place jump to 'Valley Rock Gym - Google Maps' — re-running the search typed into Maps at the pin.", `:79` "[!] Attempt 1/3: Partial harvest (0/20 listings). Backing off...", `:81` "[!] Attempt 2/3: Partial harvest (0/20 listings). Backing off...", `:83` "[!] Attempt 3/3: Partial harvest (0/20 listings). Backing off...", `:84` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts."

---

## 3. Terminal lines for each attempt (verbatim, file:line)

**Attempt A** (`nightly-20261026.log`, pin 26 at 4729, pin 30 at 4744, pin 40 at 4776):
- `:4729` "[~] Place jump to 'Valley Rock Gym - Google Maps' — re-running the search typed into Maps at the pin."
- `:4730` "[!] Attempt 1/3: Partial harvest (0/20 listings). Backing off..."
- `:4734` "[!] Attempt 3/3: Partial harvest (0/20 listings). Backing off..."
- `:4735` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts."
- `:4750` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts." (second pin)
- `:4780` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts." (third pin)
- `:4809` "[X] GATE LOCKED: Keyword [K10] did not achieve 100% pin verification (46/49). Halting."
- `:4810` "[kwsweep] incomplete (exit 1): 0 rows in 1368 s"

**Attempt B** (`nightly-20261026.log`):
- `:5362` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts." (pin 30)
- `:5379` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts." (pin 40)
- `:5390` "[X] GATE LOCKED: Keyword [K10] did not achieve 100% pin verification (47/49). Halting."
- `:5391` "[kwsweep] incomplete (exit 1): 0 rows in 388 s"

**Attempt C** (`nightly-20261027.log`):
- `:84` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts." (pin 30)
- `:101` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts." (pin 40)
- `:112` "[X] GATE LOCKED: Keyword [K10] did not achieve 100% pin verification (47/49). Halting."
- `:113` "[kwsweep] incomplete (exit 1): 0 rows in 377 s"

**Attempt D** (`nightly-20261028.log`):
- `:84` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts." (pin 30)
- `:99` "[~] Place jump to 'SOLID ROCK FITNESS - Google Maps' — re-running the search typed into Maps at the pin." (pin 40, recovered)
- `:100` "[OK] Captured 2 rankings (End of Market reached). Top: 'Albany's Indoor Rockgym' | Rank #2: 'SOLID ROCK FITNESS'" (pin 40 recovered, not a failure)
- `:111` "[X] GATE LOCKED: Keyword [K10] did not achieve 100% pin verification (48/49). Halting."
- `:112` "[kwsweep] incomplete (exit 1): 0 rows in 291 s"

**Attempt E** (`nightly-20261029.log`):
- `:78` "[~] Place jump to 'Valley Rock Gym - Google Maps' — re-running the search typed into Maps at the pin."
- `:84` "[!] GATE INCOMPLETE: Only captured 0/20 listings after 3 attempts."
- `:105` "[X] GATE LOCKED: Keyword [K10] did not achieve 100% pin verification (48/49). Halting."
- `:106` "[kwsweep] incomplete (exit 1): 0 rows in 159 s"

**Condition reported in every case:** the gate-level threshold is 100% pin verification ("did not achieve 100% pin verification"). The trigger is a single pin that logs three consecutive "Partial harvest (0/20 listings)" lines (attempt counter "Attempt 3/3"), followed by "GATE INCOMPLETE". Every failing K10 section shows exactly this sequence. There is no retry at the gate level. Retries are per pin, capped at 3.

---

## 4. Anything saved after the failure?

**gates.jsonl:** five Albany K10 rows, all `"status": "incomplete (exit 1)"` and `"rows": 0` (rows `:555`, `:559`, `:599`, `:603`, `:645`, quoted in section 1). **No complete row exists** for Albany K10.

**gate-audit.jsonl:** no row mentions Albany or "rock". Case-insensitive match on both strings: 0 hits. The file holds 16 aggregate audit rows. Line 16 carries `"false_pass_no_end_proof": 6067` (`output/kwsweep/gate-audit.jsonl:16`). Those rows do not key on city or keyword, so they cannot be attributed to this gate.

**albany/ artifacts for K10 (OBSERVED from `ls` and `rg --files`):**
- Directory: `output/kwsweep/albany/artifacts_albany_or_sports-fitness/K10/`
- Contains **49 pin folders**, each holding `viewport.html` and `viewport.png`. Confirmed: 49 `viewport.html` and 49 `viewport.png` found.
- Sample pin `albany_or_bcrf49_r0.00_centroid/`: `-rw-r--r-- 1 mikes mikes 427662 Oct 26 15:02 viewport.html` and `-rw-r--r-- 1 mikes mikes 530025 Oct 26 15:02 viewport.png`. The other 48 pins' sizes are UNVERIFIED.
- Folder timestamp of the K10 directory itself: `Oct 26 15:25` (local). This matches gates.jsonl `:555` finished at 22:25 UTC.
- **No K10 rankgrid JSON exists for sports-fitness.** `rg -c 'K10_rankgrid' artifacts_albany_or_sports-fitness` returned exit 1 (no match). Every other sports-fitness K-id (K02-K09, K11-K17) has an `albany_or_K??_rankgrid_V_0_01.json`, for example `albany_or_K11_rankgrid_V_0_01.json`. The rankgrid file is therefore absent for the one gate that failed.
- Sports-fitness evidence DB: `rar_albany_or_sports-fitness_evidence_V_0_01.db` (7,127,040 bytes, Oct 28 15:53). Not opened.

INFERRED: per-pin viewports were written during the attempt and the rankgrid is written only when a gate completes. Quoted support is the absence of K10 rankgrid and the presence of 49 per-pin folders.

---

## 5. Albany K10 versus Albany gates that passed

Passing comparators (OBSERVED):

- **K11 "swimming pool Albany oregon"** (same category, same night):
  - Header `nightly-20261026.log:4811`: "[kwsweep] Albany · sports-fitness · K11 · 'swimming pool Albany oregon'"
  - Pin 1 `:4834`: "[OK] Captured 2 rankings (End of Market reached). Top: 'Albany Community Pool' | Rank #2: 'COOL! Pool'"
  - Terminal `:4942`: "[kwsweep] complete: 98 rows in 639 s"
  - 49 of 49 pins "End of Market reached" at 2 rankings (INFERRED from parse). 0 place jumps (INFERRED from parse).
  - **K11 passed with the same thin two-listing profile that K10 shows at the centroid.**
- **K14 "dance studio Albany oregon"**:
  - Header `nightly-20261026.log:5392`: "[kwsweep] Albany · sports-fitness · K14 · 'dance studio Albany oregon'"
  - Terminal `:5525`: "[kwsweep] complete: 98 rows in 727 s"
  - 2 place jumps (lines 5449, 5469), both recovered with a normal capture (INFERRED from parse; template "[OK] Captured N rankings (End of Market reached). Top: 'X' | Rank #N: 'X's Urban Movement'").
- **K02 "auto repair near me"** (automotive, 20/20 format):
  - Header `nightly-20261023.log:1354`: "[kwsweep] Albany · automotive · K02 · 'auto repair near me'"
  - `:1377`: "[OK] Captured 20/20 rankings. Top: 'F.L. Snyder & Son, Inc.' | Rank #20: 'Caliber Collision'"

Aggregate across all 191 complete Albany gates (INFERRED from parse of every Albany section in the kwsweep logs):

| Measure | Complete Albany gates (191) | Failing Albany K10 gates (5) |
|---|---|---|
| Gates with at least one pin at 20/20 | 164 | 0 |
| Average pins at 20/20 per gate | 35.7 | 0 |
| Gates with zero pins below 20 | 110 | 0 |
| Average "End of Market" pins | 13.3 | 9.6 (all five) |
| Gates containing a "Place jump" line | 36 | 5 of 5 |
| Gates containing an "Attempt N/3" line | 37 | 5 of 5 |
| Highest attempt number seen | 1 | 3 |

Retry counts:
- Every complete Albany gate that retried stopped at "Attempt 1/3". Example: `output/kwsweep/adhoc-20261025-131655.log:74`: "[!] Attempt 1/3: Partial harvest (8/20 listings). Backing off...". The same text appears at `output/kwsweep/nightly-20261023.log:890`.
- One complete Albany gate logged a single 0/20 partial, with no second or third attempt. `output/kwsweep/nightly-20261026.log:6110`: "[!] Attempt 1/3: Partial harvest (0/20 listings). Backing off..." This sits in the section that opens at `:6064` with "[kwsweep] Albany · travel-hospitality · K03 · 'cheap hotel Albany oregon'". Its gates.jsonl row is `:565`, status complete, 675 rows.
- Every failing K10 pin reached "Attempt 3/3" (lines in section 3).

**Comparison summary (INFERRED from the quoted rows):**
- Pins below 20 is **not** what separates K10 from K11. K11 has 49 pins below 20 and passed.
- End-of-Market frequency is similar (K11: 49; K10 attempt A: 46).
- Place jumps are what separates them. K10 attempt A logged 20 place jumps and K11 logged 0. K14 logged 2 and recovered both.
- Retries are what separates them. Passing gates stop at "Attempt 1/3". Every K10 failure reaches "Attempt 3/3".

---

## 6. K10 in other cities

**Medford, "rock climbing gym Medford": PASSED.**
- Header `output/kwsweep/nightly-20261017.log:2765`: "[kwsweep] Medford · sports-fitness · K10 · 'rock climbing gym Medford'"
- Pin 2 capture `:2790`: "[OK] Captured 1 rankings (End of Market reached). Top: 'Rogue Rock Gym' | Rank #1: 'Rogue Rock Gym'"
- Place jump `:2792`: "[~] Place jump to 'Rogue Rock Gym - Google Maps' — re-running the search typed into Maps at the pin."
- Resolution `:2793`: "[~] Typed search landed on the same place — confirmed one-business answer."
- Unlock `:2992`: "[✓] GATE UNLOCKED: Keyword [K10] 'rock climbing gym Medford' fully verified!"
- Terminal `:2996`: "[kwsweep] complete: 49 rows in 2197 s"
- Pins below 20: **49 of 49** (all "End of Market reached" at 1 ranking; INFERRED from parse). 50 place jumps, every one resolved by the "same place" branch (INFERRED from parse).
- The Medford gates.jsonl row is `output/kwsweep/gates.jsonl:174` with `"rows": 49`.

**Grants Pass, "rock climbing gym Grants Pass": PASSED.**
- Header `output/kwsweep/adhoc-20261022-215319.log:3048`: "[kwsweep] Grants Pass · sports-fitness · K10 · 'rock climbing gym Grants Pass'"
- Unlock `:3175`: "[✓] GATE UNLOCKED: Keyword [K10] 'rock climbing gym Grants Pass' fully verified!"
- Terminal `:3179`: "[kwsweep] complete: 598 rows in 806 s"
- Pins below 20: **49 of 49**, with N between 5 and 14 (INFERRED from parse). 0 place jumps, 0 retries.
- gates.jsonl row `:363`, complete, 598 rows.

**Ashland, "rock climbing gym Ashland": NEVER RUN.**
- `rg -n 'Ashland · sports-fitness' output/kwsweep/*.log` returned no lines.
- `rg` for `"city_slug": "ashland", "industry": "sports-fitness"` in gates.jsonl returned no lines.
- Ashland does have 94 gates.jsonl matches overall, all for other industries (INFERRED: `rg -c -i 'ashland' gates.jsonl` returned 94).

**Other incomplete gates, for context:** gates.jsonl has 10 incomplete rows, not 5. Five are Albany K10 (`:555`, `:559`, `:599`, `:603`, `:645`). The other five are Medford, not K10:
- `output/kwsweep/gates.jsonl:77`: `"city_slug": "medford", "industry": "food-dining", "keyword_id": "K14", "phrase": "vegan restaurant Medford", "status": "incomplete (exit 1)"`
- `:78`, `:99`, `:128`: same food-dining K14 vegan restaurant row, and `:112`: `"industry": "health-wellness", "keyword_id": "K15", "phrase": "float spa Medford"`.
- Dated 2026-10-14 and 2026-10-15. So K10 is not the only gate that has been locked, and the Albany failure is not unique in the log.

---

## Candidates (inferred)

Each candidate lists the evidence that supports it and the evidence that cuts against it.

1. **A place-jump landing is handled differently in Albany than in Medford.** For: Albany jumps land on "Valley Rock Gym - Google Maps" (`nightly-20261026.log:4729`), then three "Partial harvest (0/20 listings)" lines and "GATE INCOMPLETE" (`:4730-4735`). Medford jumps land on "Rogue Rock Gym" and resolve as "Typed search landed on the same place — confirmed one-business answer." (`nightly-20261017.log:2793`). The Albany "same place" branch appears only once across the five K10 attempts (`nightly-20261026.log:5350`). Against: Albany attempt A resolved 11 post-jump pins successfully (INFERRED from parse). So the landing is not always fatal. The discriminator per pin is unknown.

2. **The 100% rule with cached pins means one pin can lock the gate.** For: attempt E locks at "(48/49)" (`nightly-20261029.log:105`), and 48 pins are cached (`:48-:103`). Cached pins are never re-queried, so an error on the single live pin (30) is the only thing that is re-tested. Against: none directly. The cache design is INFERRED from the `[CACHED]` lines.

3. **Pins 30, 40 and 26 are repeat failures.** Pin 30 (r2.00_S) fails in B, C, D and E (`nightly-20261027.log:77-84`, `nightly-20261028.log:77-84`, `nightly-20261029.log:77-84`, and B at `nightly-20261026.log:5355-5362`). Pin 40 (r4.00_W) fails in A (`nightly-20261026.log:4775-4780`), B (`:5372-5379`) and C (`nightly-20261027.log:94-101`). It recovers in D at `nightly-20261028.log:99-100`. Pin 26 (r2.00_N) fails in A (`nightly-20261026.log:4728-4735`). Against: the pins also succeed in other attempts, so these are not guaranteed failures.

4. **Market thinness.** For: the centroid probe returns two listings (`nightly-20261026.log:5279`). Against: K11 returns the same two-listing profile and passed (`:4834`, `:4942`). Thinness alone does not explain the failure.

5. **Browser recycling.** Weak. `Recycling browser process (7-pin OS memory purge)` appears six times inside the attempt A section (`nightly-20261026.log:4689`, `:4704`, `:4719`, `:4740`, `:4762`, `:4787`). It does not appear in the B-E K10 sections (parser). Nothing in the log ties it to the failure.

6. **Maps-side block or change.** No line in the five K10 sections mentions a captcha, block, timeout, error or consent. The only non-template line in attempt A is the browser-recycle line in candidate 5 (`rg` over the five sections). This cannot be confirmed or excluded from the log.

---

## Could not determine

- **Why the same "Valley Rock Gym" landing resolves differently in Albany and Medford.** No log line states a cause, and I did not open the per-pin `viewport.html` or `viewport.png` files. That would be needed to see what Maps showed at pins 26, 30 and 40.
- **Why pin 30 (r2.00_S) fails in every attempt after A.** No quoted line gives a reason beyond "Partial harvest (0/20 listings)".
- **Whether a fresh, uncached run would fail on the same pins.** Only attempt A ran all 49 pins live, and it failed at pins 26, 30 and 40. B-E rely on cache for 46-48 pins, so their results do not isolate the live behaviour.
- **Per-pin sizes beyond the one sampled pin** (`albany_or_bcrf49_r0.00_centroid`). Not measured for the other 48.
- **The Medford K10 `Attempt 1/3` line.** The parser counts one partial for Medford K10 (`nightly-20261017.log`, section 2765-2996). I did not quote its line. UNVERIFIED.
- **gate-audit.jsonl cannot be tied to Albany K10.** It has 16 aggregate rows with no city or keyword keys. Its `false_pass_no_end_proof` counter rises from 0 to 6067 across the file (`gate-audit.jsonl:8` 2303, `:16` 6067). What that counter measures was not analysed; it is outside this task.
- **Which of the ten incomplete rows (five Medford) were later repaired.** I did not trace the Medford failures beyond their gates.jsonl rows.
