# oregon-smb-directory

The agent contract for this project is **[`AGENTS.md`](AGENTS.md)**. Read it.

Navigate by the six rules at the top of `AGENTS.md`: start at
`/home/mikes/.claude/ROOT-POINTER.md` and follow pointer → index → query.

<!-- doc-intel:begin -->
## Docs index (doc-intel)

This project's documentation is indexed. Query it before opening files:

```bash
uv run --project /home/mikes/doc-intel doc-intel section "<heading>" --db /home/mikes/doc-intel/indexes/oregon-smb-directory.db --body
uv run --project /home/mikes/doc-intel doc-intel query "<terms>" --db /home/mikes/doc-intel/indexes/oregon-smb-directory.db
```

Browse: http://127.0.0.1:8490/#/c/oregon-smb-directory
Re-index: Curated index — check `stats` before re-indexing; do not change its scope.

That index covers `src/` only. Two more cover the rest of this folder:

| index | covers | query |
|---|---|---|
| `oregon-smb-directory-notes` | everything outside `src/`, `listings-extraction/`, `public/` — research, reports, handoffs, rar, requests, expert, docs | `doc-intel query "<terms>" --db /home/mikes/doc-intel/indexes/oregon-smb-directory-notes.db` |
| `oregon-smb-listings-extraction` | the whole `listings-extraction/` project (its own CLAUDE.md has the block) | `doc-intel query "<terms>" --db /home/mikes/doc-intel/indexes/oregon-smb-listings-extraction.db` |

Re-index notes: `uv run --project /home/mikes/doc-intel doc-intel index "/home/mikes/oregon-smb-directory" --db /home/mikes/doc-intel/indexes/oregon-smb-directory-notes.db --exclude src --exclude listings-extraction --exclude public`
<!-- doc-intel:end -->
