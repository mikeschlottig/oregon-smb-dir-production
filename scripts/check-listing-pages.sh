#!/usr/bin/env bash
# Check listing pages in dist rendered as expected.
# Usage: bash scripts/check-listing-pages.sh <city/industry/slug>...
cd "$(dirname "$0")/../dist/city" || exit 1
for p in "$@"; do
  f="$p/index.html"
  if [ ! -f "$f" ]; then echo "MISSING  $p"; continue; fi
  printf "%-70s verified=%s premium=%s faqld=%s website=%s\n" "$p" \
    "$(grep -o 'Verified' "$f" | wc -l)" \
    "$(grep -o 'data-quotable' "$f" | wc -l)" \
    "$(grep -o 'FAQPage' "$f" | wc -l)" \
    "$(grep -o 'Visit website\|Visit Website' "$f" | wc -l)"
done
