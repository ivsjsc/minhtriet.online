# minhtriet.online

Personal portfolio for Nguyen Minh Triet, covering professional experience, featured ventures, applied technology products, case studies, and long-form updates.

## Source of truth

All deployable source files live under `src/`:

- `src/site/`: static pages, scripts, languages, images, PDFs, and legacy public pages.
- `src/content/`: structured venture, case-study, and update content.
- `src/templates/`: templates used to generate bilingual update pages.
- `scripts/`: deterministic build, validation, link checking, and local preview.
- `public/`: generated output only. Do not edit it manually.

The build checks a migration allowlist before replacing `public/`, so required PDFs, images, videos, favicon, robots, CNAME, and language files cannot disappear silently.

## Commands

```powershell
npm run build
npm run validate
npm run check:links
npm run preview
```

Local preview: `http://127.0.0.1:4173/en`

## Deployment parity

Firebase and Netlify both deploy `public/` and run `npm run build` first:

- Netlify: `[build] command = "npm run build"`, `publish = "public"`.
- Firebase: `hosting.public = "public"`, `hosting.predeploy = ["npm run build"]`.

Production deployment is intentionally separate from the build and preview workflow.

## Localized update routes

- `/updates/` redirects permanently to `/en/updates/`.
- `/en/updates/` and `/vi/updates/` are the only indexable language collections.
- Each update has matching `/en/updates/<slug>/` and `/vi/updates/<slug>/` pages.
- The remaining eight homepage languages continue to fall back to English for new untranslated keys; no duplicate update URLs are generated for them.

Update entries with no verified `datePublished` are rendered as drafts with `noindex` and excluded from sitemaps. `dateModified` is optional and must never exist without `datePublished`.

## Visual assets

Editorial visual backgrounds are stored in `src/site/images/ventures/` as:

- 1600×900 WebP content covers.
- 1200×630 WebP Open Graph derivatives.

Official logos remain separate source assets and are not regenerated or color-altered.
