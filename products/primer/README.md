# Primer

An interactive product concept created by Maya and Theo in [Cofounder Live](https://nano-banana-guide-26967920041.us-central1.run.app).

## Product

An adaptive, screen-healthy AI tutor that evolves from basic literacy to deep critical thinking, inspired by classical education.

- Revision: 3
- Google capabilities: Socratic Narrative Engine
- Capability rationale: Socratic Narrative Engine: Generates personalized, Socratic stories and adaptive lessons based on the child's real-world experiences and cognitive development.

## Run locally

Open `index.html` in a modern browser. The interface has no build step.

The Socratic Narrative Engine interaction uses the hosted Cofounder Live runtime for mission `ep_mtdvi5ug` when a server-side Google Cloud action is required.

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
