# Portfolio — Mohammed Abdullah Khan

Editorial single-page portfolio. Plain HTML, CSS and JavaScript — no build step.

## Structure
```
index.html          the page
css/style.css        styles (light + dark)
js/app.js            behaviour (theme, reveal, counters)
assets/profile.jpg   your portrait (already included; replace to update)
images/              your app screenshots (see images/README.txt for names)
```

## Before publishing — two things
1. Add screenshots to `images/` using the filenames in `images/README.txt`.
2. Fix the two "View code" links in `index.html` (ExpenseEcho, Shopify): once the
   repos are public, replace the placeholder `https://github.com/abdullahmurdana`
   with the exact repo URLs. If a repo is not public yet, remove that link line.

## Deploy to GitHub Pages (free)
1. Create a public repo named `abdullahmurdana.github.io`.
2. Upload everything (keep the folder structure: css/, js/, assets/, images/).
3. Settings → Pages → Deploy from branch → main → / (root) → Save.
4. Live at https://abdullahmurdana.github.io after ~1 minute.

## Notes
- Portrait is rendered as a duotone via an SVG filter, matched to the palette.
- Follows the visitor's system light/dark by default; the toggle remembers a manual choice.
- Respects reduced-motion; responsive from small phones to wide screens; includes a print style.
- WhatsApp button points to wa.me/923009691591.
