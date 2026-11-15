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
Covers this whole folder except `listings-extraction/`, which is its own project with its own
index, `oregon-smb-listings-extraction` (see `listings-extraction/CLAUDE.md`).
Refreshed nightly. Scope and exact rebuild command: `uv run --project /home/mikes/doc-intel doc-intel manifest --db /home/mikes/doc-intel/indexes/oregon-smb-directory.db`
<!-- doc-intel:end -->
