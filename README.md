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

## Contributions and the wall (serverless functions)

Two things run as Vercel Functions under `api/` (no other backend):

| Route | What it does |
|---|---|
| `submit.html` -> `POST /api/submit` | Turns the form into a pull request: the Markdown content file(s), an optional PDF (<= 3 MB), a new person file if the speaker is new. Sessions land on the Research Atlas and the Index once merged; everything else in Posts. |
| `POST /api/parse` | Reads a pasted announcement email with Claude (structured output) and pre-fills the form. Optional - without a key the page uses its built-in reader for the group's own email layout. |
| `GET/POST /api/wall` | The anonymous wall on the home page (two boards). Messages are stored as comments on two issues in this repository, labelled `wall`; deleting a comment removes it from the site. |

Review happens by email: GitHub notifies the code owners (`.github/CODEOWNERS`) of the new
pull request; a maintainer replies to that email with `/approve` (or `/changes note`,
`/reject`), and `.github/workflows/intake-approve.yml` merges or sends it back.
`.github/workflows/content-check.yml` validates the content on every pull request.

### One-time setup (maintainers)

1. **Token.** Create a fine-grained personal access token on GitHub scoped to this
   repository with Contents, Pull requests and Issues set to read and write. Add it in
   Vercel (Project -> Settings -> Environment Variables) as `GITHUB_TOKEN`, together with
   `GITHUB_REPO`. Optional: `ANTHROPIC_API_KEY` (email extraction), `INTAKE_PASSPHRASE`
   and `WALL_PASSPHRASE` (gates), `RATE_SALT`. See `.env.example`. Redeploy afterwards.
2. **Reviewers.** Add every maintainer as a collaborator with write access and list their
   GitHub handles in `.github/CODEOWNERS`. Each maintainer adds *both* university
   addresses (`@ed.ac.uk` and `@sms.ed.ac.uk`) to their GitHub account under
   Settings -> Emails, otherwise a reply from the other alias is not recognised.
3. **Notifications.** Each maintainer keeps email notifications on for the repository
   (Watch -> Participating, or All activity). Replying to the notification email posts the
   reply as a comment - that is the whole approval mechanism.
4. **The wall.** Nothing to create: the two issues appear on first use. To moderate,
   watch the repository's issues and delete comments as needed.

### Local run

```powershell
npm run build
copy .env.example .env.local   # fill in GITHUB_TOKEN (a test repository is a good idea)
npm run dev                    # http://127.0.0.1:4174/  serves dist/ and api/
```

## Notes

- `OPTIMISATION_NOTES.md` records the production build and the design chapters.
- Pinned third-party versions and licenses: `assets/vendor/manifest.json` and
  `THIRD_PARTY_LICENSES/NOTICE.md`.
- The Join form prepares an email draft; nothing is submitted or stored automatically.
