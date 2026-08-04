# rishabh-somvanshi-developer

Portfolio of Rishabh Somvanshi — Senior Frontend Engineer (React).
Dark, technical, minimal. All content sourced from the 2026 resume
(`public/Rishabh_Somvanshi_Resume.pdf`) — see `src/data/content.js`.

## Stack

- React 18 + Vite
- Framer Motion (only animation library — `LazyMotion` keeps it lean)
- Vanilla CSS with design tokens — see `DESIGN_SYSTEM.md`
- Self-hosted variable fonts (Inter, Space Grotesk, JetBrains Mono)

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Deploy

Netlify — site name `rishabh-somvanshi-developer`. `netlify.toml` sets the
build command and caching/security headers (`public/_headers` covers
drag-and-drop deploys of `dist/`).

## Editing content

All copy lives in `src/data/content.js`. Rule: no claim goes in that isn't
backed by the resume. Update the resume first, then the site.
