# UEBS Statistics Study Group - website

The website of the Statistics Study Group at the University of Edinburgh Business
School: a statistics-based knowledge exchange platform run by PhD researchers -
sessions, materials, a research atlas of the fields we cover, and the people behind it.

## How the site is put together

```
content/              the source of truth: sessions, people, posts, topics (Markdown + YAML)
src/index.source.html the single-page app (HTML + CSS + one JSX block) - the only file to edit for design changes
src/templates/        HTML templates for the generated topic pages
scripts/content.mjs   compiles content/ -> assets/data.js, topics/*.html, contributors.html
scripts/build.mjs     runs the content compiler, then esbuild -> assets/app.min.js and index.html
assets/talks/         lecture slides (PDF) and code
assets/posts/         files attached to posts
```

Generated files (`index.html`, `src/app.jsx`, `assets/app.min.js`, `assets/data.js`,
`assets/data.json`, `topics/*.html`, the data block in `contributors.html`) are
committed so the site can be served as plain static files, but they are never
edited by hand.

## Updating content

See [content/README.md](content/README.md). In short: add or edit a Markdown file
under `content/`, drop any slides into `assets/talks/`, then

```powershell
npm install          # once
npm run build:check  # validate
npm run build        # regenerate the site
npm run preview -- -p 4174   # http://127.0.0.1:4174/
```

and commit. Pushing to `main` deploys.

## Notes

- `OPTIMISATION_NOTES.md` records the production build and the design chapters.
- Pinned third-party versions and licenses: `assets/vendor/manifest.json` and
  `THIRD_PARTY_LICENSES/NOTICE.md`.
- The Join form prepares an email draft; nothing is submitted or stored automatically.
