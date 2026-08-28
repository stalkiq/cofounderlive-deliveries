# bluberg

An interactive product concept created by Maya and Theo in [Cofounder Live](https://nano-banana-guide-26967920041.us-central1.run.app).

## Product

The brutalist antidote to infinite backlogs. Keep 90% of your chaotic tasks submerged and focus only on the 6 surface-level slots.

- Revision: 3
- Google capabilities: Monastic Distiller
- Capability rationale: Monastic Distiller: Uses Gemini to analyze a chaotic brain-dump of tasks, distill them down to exactly six high-impact items, and instantly generate 'Commit to Timeline' actions for zero-friction execution.

## Run locally

Open `index.html` in a modern browser. The interface has no build step.

The Monastic Distiller interaction uses the hosted Cofounder Live runtime for mission `ep_mtct6bva` when a server-side Google Cloud action is required.

If the product includes a Google Map, replace `REPLACE_WITH_RESTRICTED_MAPS_BROWSER_KEY` in `index.html` with your own API- and referrer-restricted Maps JavaScript API key. Never commit a valid API key.

## Deploy

See [DEPLOY.md](./DEPLOY.md) for GitHub Pages and Google Cloud Run instructions.

## Repository files

- `index.html` — self-contained product interface
- `product-spec.json` — validated product specification
- `Dockerfile` and `nginx.conf` — Cloud Run container
- `DEPLOY.md` — deployment instructions

## Important

This repository contains an interactive product concept, not a production application. Displayed sample content is fictional and requires validation before use.
