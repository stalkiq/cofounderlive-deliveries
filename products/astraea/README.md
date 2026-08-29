# Astraea

An interactive product concept created by Maya and Theo in [Cofounder Live](https://nano-banana-guide-26967920041.us-central1.run.app).

## Product

Inspired by science fiction, engineered for reality. Astraea is an adaptive AI companion that evolves alongside your child, teaching deep reasoning, character, and foundational intellect through a tactile, living-book interface.

- Revision: 4
- Google capabilities: Socratic Primer Engine
- Capability rationale: Socratic Primer Engine: Generates personalized, Socratic stories and dialogues that adapt to the child's vocabulary, emotional state, and logical reasoning.

## Run locally

Open `index.html` in a modern browser. The interface has no build step.

The Socratic Primer Engine interaction uses the hosted Cofounder Live runtime for mission `ep_mtdv52h3` when a server-side Google Cloud action is required.

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
