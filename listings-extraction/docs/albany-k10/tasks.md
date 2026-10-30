# Albany K10 investigation — plan (2026-10-30)

Constraint (Mike): live run untouched. The 2026-10-29 21:35 process keeps its old code in memory.

- [x] 1. Index CODE: `intel index` -> codebase-intel-toolkit/indexes/listings-extraction
- [x] 2. Index DOCS: doc-intel -> doc-intel/indexes/listings-extraction.db
- [x] 3. Dispatch ONE persistent Haiku agent: log forensics (done: haiku-log-findings.md)
- [x] 4. Verify Haiku's claims: lines 78-84 and 105 of nightly-20261029.log confirmed; "pins 26, 30, 40" confirmed but incomplete (26 and 40 passed on retry, 30 failed all 5)
- [x] 5. Read the gate code: rar-linux bcrf49_linux.py:1065-1144 + kwsweep.py:271-273
- [x] 6. Root cause (FINDINGS.md section 2): URL jump and typed landing on two different places -> 0 listings x3
- [x] 7. Fix: H32 split place (rar-linux), keep verified pins, skip stalled gates (kwsweep)
- [x] 8. Tests: rar-linux 38 passed, listings-extraction 50 passed
- [x] 9. FINDINGS.md, hypothesis.md, SCOREBOARD entry
- [x] 10. Commit both repos
- [x] 11. Daily monitor registered: Windows task "RAR gate-health daily" 07:30 (runs scripts/gate-health-check.py, proven through wsl.exe) + session cron 07:17 (dies with the session, 7-day limit)
- [ ] 12. 2026-10-31: read daily/2026-10-31.md; H2 must PASS. If not, fix and log it in hypothesis.md
