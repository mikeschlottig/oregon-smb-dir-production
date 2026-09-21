# Astro Business Directory Template Handoff

## Current Priority

This folder is the reusable template only:

`/home/mikes/astro-templates/astro-business-directory-template`

It was ported from the React/Vite reference app:

`/home/mikes/astro-templates/premium-directory-hub`

Stop here before changing taxonomy or importing the 15K+ production listings. The next chat should start by cloning this template, then changing taxonomy/data in the fresh clone.

## What Was Built

- Astro 6.2.2 static directory template with `@astrojs/react`.
- React/shadcn/Radix components preserved as islands where interaction is useful.
- Astro file routes replace React Router.
- Static routes exist for home, city, industry, business detail, blog, research, best-of, and 404.
- Business detail URLs now handle duplicate business names by appending a short stable hash only when needed.
- Source images live in `src/images` so Astro can process and optimize them.
- Static passthrough assets live in `public`.
- Generated folders are ignored with `.gitignore`.

## Important Commands

Use Node 22 through nvm. Astro 6 will not work correctly on the old system Node 18.

```bash
cd /home/mikes/astro-templates/astro-business-directory-template
export NVM_DIR=/home/mikes/.nvm
. /home/mikes/.nvm/nvm.sh
nvm use --delete-prefix v22.22.2 --silent
npm run build
```

For dev from WSL, expose the server and use the WSL IP if `localhost` does not bridge into the browser:

```bash
npm run dev -- --host 0.0.0.0 --port 4322
hostname -I | awk '{print $1}'
```

The working browser URL during handoff was:

`http://172.23.86.210:4322/`

Do not switch to Cloudflare/workerd for this template preview. This is a standard static Astro app. The rendering issue was WSL/Windows host binding, not Cloudflare.

## Project Tree

```text
astro-business-directory-template/
  public/
    favicon.ico
    placeholder.svg
    robots.txt
  src/
    components/
      cards/
      layout/
      sections/
      ui/
      BusinessFilterGrid.tsx
      ReportReader.tsx
    data/
      businesses/
      reports/
      businesses.ts
      cities.ts
      content.ts
      industries.ts
    hooks/
    images/
      cities/
      hero-oregon.jpg
    layouts/
      SiteLayout.astro
    lib/
      utils.ts
    pages/
      best-of/
      blog/
      city/
      research/
      404.astro
      index.astro
    styles/
      globals.css
  .gitignore
  .nvmrc
  astro.config.mjs
  package.json
  package-lock.json
  postcss.config.js
  tailwind.config.ts
  tsconfig.json
```

`node_modules/`, `dist/`, and `.astro/` are generated and should not be treated as source.

## Good Patterns

- Keep `src/pages` as the route source of truth.
- Keep shared page chrome in `src/layouts/SiteLayout.astro`.
- Keep mostly static presentation in Astro pages/components.
- Use React islands only where state or shadcn/Radix behavior is needed.
- Keep taxonomy in `src/data/industries.ts` and city metadata in `src/data/cities.ts`.
- Keep listing loading and slug helpers in `src/data/businesses.ts`.
- Import optimized images from `src/images`, not `public`.
- Use `public` only for files that should pass through untouched.
- Run `astro check && astro build` before cloning the template for real data work.

## Lessons Learned

- The folder name must stay generic: `astro-business-directory-template`, not Oregon-specific.
- Finish and verify the template before cloning or loading production listings.
- Astro 6 requires Node 22+ here. The system Node 18 caused misleading install/build noise.
- React Router should be removed in favor of Astro file routing and normal `<a>` links.
- Astro image imports return metadata, so React `<img>` tags need `.src`.
- TypeScript under Astro strict mode needs type-only imports for types such as `FieldPath`, `ButtonProps`, and `VariantProps`.
- Duplicate business names can create duplicate static paths. Use `getBusinessPathSlug()` instead of plain `slugifyBusiness()` for business detail URLs.
- WSL dev server preview may require `--host 0.0.0.0` and the WSL IP address.

## Things To Avoid

- Do not import the 15K+ listings into this template folder.
- Do not change taxonomy in this template; do it in the clone at the start of the next chat.
- Do not assume `localhost` works across WSL, Windows, and the in-app browser.
- Do not run long noisy builds through the main agent when a cheaper delegated build runner is available.
- Do not commit generated folders: `node_modules`, `dist`, `.astro`.
- Do not put authored CSS/JS in `public`.
- Do not use workerd unless the project is actually configured for Cloudflare.

## Agent/Build Note

User requested that future repetitive build/test loops be delegated to `Mistral -Vibe` to reduce main-agent token burn from rereading build output. This session does not expose a callable `Mistral -Vibe` tool, so the final verification was run locally with output captured quietly. Use a delegated build runner next time if available.

## Final Verification

Final clean build after the `src/images` cleanup:

- `astro check`: 0 errors, 0 warnings, 0 hints
- `astro build`: completed successfully
- Static output: 577 pages
- Build log: `/tmp/astro-business-directory-template-final-build.log`
