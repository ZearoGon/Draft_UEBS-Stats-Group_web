# Third-party notices

The static preview keeps the following pinned browser distributions locally so
the React application and optional visual layers do not depend on a runtime CDN.
The unmodified license texts are stored beside this notice.

| Package | Version | Local artifact | Upstream source | License |
| --- | ---: | --- | --- | --- |
| KaTeX | 0.16.9 | `assets/vendor/katex.min.js` and `auto-render.min.js` | <https://unpkg.com/katex@0.16.9/dist/katex.min.js> | MIT |
| React | 18.3.1 | `assets/vendor/react.production.min.js` | <https://unpkg.com/react@18.3.1/umd/react.production.min.js> | MIT |
| ReactDOM | 18.3.1 | `assets/vendor/react-dom.production.min.js` | <https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js> | MIT |
| Three.js | 0.185.1 | `assets/vendor/three.module.min.js` and its `three.core.min.js` import | <https://unpkg.com/three@0.185.1/build/three.module.min.js> | MIT |
| p5.js | 2.3.2 | `assets/vendor/p5.min.js` | <https://unpkg.com/p5@2.3.2/lib/p5.min.js> | LGPL-2.1 |

Exact byte sizes and SHA-256 digests are recorded in
`assets/vendor/manifest.json` and are checked before each production build.
