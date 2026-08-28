# Nell

An interactive product concept created by Maya and Theo in [Cofounder Live](https://nano-banana-guide-26967920041.us-central1.run.app).

## Product

Moving beyond passive screens. Nell is an interactive, generative tutor that weaves reading, writing, and reasoning into a personalized, evolving narrative for children aged 4 to 8.

- Revision: 2
- Google capabilities: Socratic Story Weaver
- Capability rationale: Socratic Story Weaver: Powers the core conversational engine, generating personalized Socratic dialogue and adaptive fairy tales that respond to the child's real-time inputs and cognitive milestones.

## Run locally

Open `index.html` in a modern browser. The interface has no build step.

The Socratic Story Weaver interaction uses the hosted Cofounder Live runtime for mission `ep_mtcz0n72` when a server-side Google Cloud action is required.

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
