# Priorities — from Mike, 2026-09-26 (end of the 2026-09-25 session)

Mike's plan for the next sessions, restructured from his message. **Bold** marks decisions and facts he
stated. "Open" lines are things this file could not confirm. Resolve them at the start of the work, not by
guessing.

---

## 1. Fix and deploy oregon-smb-directory (first up, 2026-09-26)

### What changed since last time — Mike's work

- **Root cause found:** an extraction bug corrupted **review counts** and **average star ratings** for
  businesses. It was caught earlier, but the fix never actually made it into the data.
- **Mike corrected the dataset by hand.**
- **The corrected dataset is now in a Google Sheet.** That sheet is the new source of truth for listing data.
- **The sheet generates JSON-LD schema with formulas.** Mike built spreadsheet formulas that produce proper
  JSON-LD for each listing, so structured data comes from the sheet, not from code.

### The plan

1. Map the Google Sheet's table structure **directly** to a **D1 database** (columns → schema, one-to-one).
2. Load the corrected rows into D1.
3. Use the sheet's formula-generated JSON-LD, not code-generated schema.
4. Fix whatever else is broken, then deploy.

### Open

- The Google Sheet's URL / ID and tab name. Mike to provide.
- How the sheet gets to D1: a CSV export Mike downloads, or a read through the Google Drive connector. Google
  services are handled under the standing rule in memory (`google-services-stealth-only`); confirm the method
  with Mike before touching Google.
- Which D1 database: a new one, or replace the directory's existing one.
- Before relying on the sheet's JSON-LD, validate a sample against validator.schema.org (memory
  `authority-before-code`).
- Status on 2026-09-26 00:37: the Google Maps geo-grid ranking sweep
  (`listings-extraction/`, log `listings-extraction/output/sweep.log`) was running again, detached, from
  Corvallis. It had finished 51 of 144 search batches ("gates": one city × one industry query, 49 map
  points each), with 0 blocks. It collects rankings, not the review/rating fields above. Decide whether its
  output feeds the new D1 dataset.

Live site: `oregonsmbdirectory.com` (Worker `oregonsmbdirectory-site`).

---

## 2. leverageai.network — website enhancement

- Better **SEO**.
- Fix **text / container overflow**.
- Make sure **images are handled optimally**.
- "etc." — run a full audit to list the rest.

Live site: `leverageai.network` and `www.leverageai.network` (Worker `astro-leverage-ai-site-rebuild`). It
must stay public, with no login (Mike, 2026-09-26). Only `intelligence.leverageai.network` requires sign-in.

---

## 3. daleyorganics.com — same treatment as leverageai.network

- SEO, overflow, image handling, full audit.

Live site: `daleyorganics.com` (Worker `daley-organics`). Related on the same domain:
`www.daleyorganics.com` and `contact.daleyorganics.com` (Worker `daley-organics-inbox`), and
`roguevalley.daleyorganics.com` (Worker `roguevalley-recreation-daleyorganics`). This is a **client**
domain.

---

## 4. Oregon roofer directory — SEO + sheet-driven schema

- The site is **already built**. It needs SEO enhancement.
- **Export its data to CSV** → Mike uploads it to Google Sheets → JSON-LD made with formulas, the same
  pattern as the SMB directory.

### Open

- Which project is it? `/home/mikes/oregon-roofer-connect` exists, and an `oregon-roofers-inbox` Worker
  and an `oregon-roofers.com` zone are on the account. Confirm which is "the roofer directory".

---

## 5. Oregon plumber directory — same as the roofer directory

- Already built. SEO enhancement, then CSV → Google Sheets → formula JSON-LD.

### Open

- Project location not found by a quick look. Mike to point to it.

---

## 6. Sales framework — dial it in

- Mike's sales framework needs refinement.

### Open

- Which files / project. Mike to point to it.

---

## 7. rar-grid — enhancements

- Some enhancements are needed.

### Open

- The name as Mike wrote it is "rar-grid". Related folders on disk: `/home/mikes/rar-linux` and
  `/home/mikes/serp-grid`. Confirm which one is meant, and the enhancements wanted.

---

## 8. AI-powered browser extension — dial it in

- It **works well on Mike's Mac**. It needs tuning.

### Open

- Where the source lives. It may be on the Mac, not this machine.

---

## Also

"There are other things as well, but this is plenty to keep us busy." Nothing else is listed yet.

---

## The shared pattern across items 1, 4 and 5

For each directory: **data → Google Sheet (Mike fixes and owns it) → formula-built JSON-LD → D1 → site.**
Build that pipeline once for oregon-smb-directory, correctly, then reuse it for the roofer and plumber
directories. That makes item 1 the template for items 4 and 5.

## Standing rules that apply to all of the above

- No Cloudflare Access on any site unless Mike approves that project. Private apps use the shared sign-in
  (`/home/mikes/leverage-signin/docs/GUIDE.md`).
- Cloudflare Workers, not Pages. Astro 7+. Read the current official docs before writing.
- Workers ship with full observability (logs + traces).
- No hand-rolled scripts where an official library or standard tool exists.
