# Handoff — P17: local and GitHub reconciled, live site shipped from one tree (2026-11-21)

Claude (Opus 5.5), Windows session working the WSL repo. Plan and evidence: `tasks.md` P17; reasoning: `hypothesis.md` H35.

## State now

- `master` == `origin/master` (pushed). Live = deploy **29194195**, built from this tree. Rollback: `a5356ae6`
  (the 10-24 deploy from Jons-MacBook-Air).
- Before today the two had diverged for a month: local 21 commits ahead (listings-extraction, kwsweep, doc-intel
  pointers), GitHub 4 ahead (robots sitemap, astro:assets WebP, cookieless PostHog + /privacy/, WebP city cards, pnpm).
  The live site was the GitHub side, deployed from the Mac. Deploying from here before the merge would have removed
  PostHog, /privacy/ and the image work from production.

## What was committed (it had been uncommitted, some since September)

| commit | what | why kept |
|---|---|---|
| b5442b3 | `.gitignore`: `__pycache__/`, `*.pyc` | bytecode was showing as untracked |
| 15a6c1b | 2026-09-24 operator edits: AGENTS/README/TAXONOMY/guide drop "never commit to master", second-model review, Rule 0 text; add "agents may not make arbitrary rules"; new businesses go into the database. Plus 2026-11-21 guide §2.1: ratings from maps-intel by CID | no agent session made the 09-24 edits — treated as Mike's |
| 67994b8 | albany-k10 daily gate-health logs 11-02..11-20; listings-extraction/hypothesis.md kwsweep note | continuation of a committed series |
| 980574a | `rar/` V_0_01 scraper source + Grants Pass spec (36 files, 4,843 lines) | **only copy on disk**; `~/rar-linux` has none of these modules |
| dea80e4, 9571da9 | `expert/` report + skill; projectstd CLAUDE.md backup → `_archive/projectstd-backup-20260923-175600/` | docs; archive, never delete |
| 0d1d52b | merge origin/master | clean, no conflicts |

## Things the next session must know

1. **Building needs `.env`.** `PUBLIC_POSTHOG_TOKEN` (public `phc_` token) is in the gitignored `.env` here and in
   keyring `oregon-smb-directory`. Without it the build passes every gate and ships a site with no analytics.
   The Mac has its own `.env`; keep them the same.
2. **pnpm in WSL:** `corepack enable pnpm` was run in nvm node v22.22.2. Without it, `pnpm` resolves to the Windows
   global shim and the build dies in 1 s with `C:\Windows\package.json`.
3. **The site has a Worker now** (`worker/index.ts`, PostHog relay on `/lv-relay/*`, `run_worker_first`). The listing
   pipeline's on-demand route (proposal: `/mnt/c/Dev/ops-console/docs/PROPOSAL-listing-pipeline-2026-11-21.md`) goes there.
4. **Rule 0's code still runs:** `scripts/check-id-literals.mjs` is in the build; only its doc text was removed.
   Keep or drop is Mike's call.
5. **Guide rule 3 (line 84) still says ratings come from Mike**; §2.1 says maps-intel (Mike, 2026-11-21). The line-84
   edit was blocked by a permission check — Mike to edit.
6. **albany-k10 health:** 14 of the last 21 daily checks FAIL (latest 11-20). Nobody has looked.
7. Stale remote branches, untouched: `dev`, `main`, `feat/add-daley-organics-listing`, `feat/daley-organics-listing-v2`,
   `perf/city-images`, `feat/posthog-analytics`.

## Hygiene from here (Mike: Tailscale connects the machines now)

One rule of thumb, not a new repo rule: `git pull` before building, `git push` after deploying, on whichever machine
ships — and both machines hold the same `.env`.
