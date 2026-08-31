# Statistics Study Group web optimisation

This folder is an independent, production-built copy of `20260502-New Web`. The original Git repository was not modified.

## What changed

- Replaced runtime Babel and React development builds with a minified production bundle.
- Added a restrained Three.js probability field and a p5.js statistical star field with visibility pausing, reduced-motion handling, and static fallbacks.
- Reworked the visual rhythm into four distinct chapters: an editorial About essay, a full-width deep-sky people stage, a contained Research Atlas instrument, and an asymmetric Posts index.
- Unified the ink theme around the group's deep blue, made the Hero probability contours perceptible, and added fluid sizing from wide desktop down to 320px.
- Merged the navigation into `Maintainers & Contributors`; the Hero now reports both overlapping roles together.
- Upgraded the photo gallery with semantic images, Play/Pause, touch swiping, live slide status, and reduced-motion-aware autoplay.
- Added touch hit-testing for the people canvas, native roster buttons, stronger Atlas selection/focus states, and accessible selection semantics.
- Replaced striped post placeholders with honest statistical covers, one labelled archive photograph, and exact thumbnails rendered from the MOSUM and Fama-MacBeth lecture PDFs.
- Improved mobile navigation, roster layout, keyboard access, modal focus, form validation, link honesty, metadata, and local asset handling.
- Mapped available lecture links to validated local PDFs.
- Corrected the supporting topic, contributor, and AI overview pages without changing their routes.

## Build and preview

```powershell
npm run build:check
npm run build
npm run preview -- -p 4174
```

Open `http://127.0.0.1:4174/` after starting the server.

Pinned third-party versions and licenses are recorded in `assets/vendor/manifest.json` and `THIRD_PARTY_LICENSES/NOTICE.md`.

The Join form prepares an email draft. It does not submit or store personal data automatically.
