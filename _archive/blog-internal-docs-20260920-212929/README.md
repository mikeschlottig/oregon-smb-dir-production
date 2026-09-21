# Internal content-ops documents, removed from the published blog — 20260920-212929

These three files sat in `src/content/blog/` and were therefore published as blog posts
at /blog/<slug>/. They are not articles:

- `i-5-oregon-corridor-eeat-content-hub` — a production tracker. Its body is a Notion
  table with a per-row **Status** column ("Drafting"), assigned writing style, and word
  counts. Its links point at Notion export filenames
  (`Merlin,%20Oregon%20The%20Last%20Address...html`), which is where 123 of the site's
  broken internal links came from.
- `i-5-article-structure-template-style-blended-eeat-framework` — the section-by-section
  writing template the articles are built from.
- `i-5-oregon-corridor-master-city-list-south-north` — the corridor city list with exit
  numbers and populations.

All three carry `date: ""`, `excerpt` equal to the title, empty `topics`, empty `city`.
The empty date is why they failed the BlogPosting datePublished check.

Removed from the collection rather than dated, because dating them would publish an
internal tracker as an article. Nothing is deleted — restore by moving a file back into
`src/content/blog/` and filling in real frontmatter.
