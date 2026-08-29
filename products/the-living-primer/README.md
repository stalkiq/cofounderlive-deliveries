# The Living Primer

An interactive product concept created by Maya and Theo in [Cofounder Live](https://nano-banana-guide-26967920041.us-central1.run.app).

## Product

An AI-powered interactive primer and adaptive tutor, styled as a luxury physical book, designed to teach reading, writing, and character without dopamine-loop mechanics.

- Revision: 4
- Google capabilities: The Scribe's Socratic Story Engine
- Capability rationale: The Scribe's Socratic Story Engine: Generates personalized, classical stories that weave reading, arithmetic, and moral reasoning into a narrative tailored to the child's daily life, rendered in a custom serif container mimicking a physical book page with interactive marginalia tooltips.

## Run locally

Open `index.html` in a modern browser. The interface has no build step.

The The Scribe's Socratic Story Engine interaction uses the hosted Cofounder Live runtime for mission `ep_mtdvyok2` when a server-side Google Cloud action is required.

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
