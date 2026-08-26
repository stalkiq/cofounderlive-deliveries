# Garden Grid

An interactive product concept created by Maya and Theo in [Cofounder Live](https://nano-banana-guide-26967920041.us-central1.run.app).

## Product

Shared garden supplies, clearly coordinated.

- Revision: 1
- Google capability: Google Calendar
- Capability rationale: Shared workdays and supply pickups are time-based coordination.

## Run locally

Open `index.html` in a modern browser. The interface has no build step.

The Google Calendar interaction uses the hosted Cofounder Live runtime for mission `ep_deliverytest` when a server-side Google Cloud action is required.

## Deploy

See [DEPLOY.md](./DEPLOY.md) for GitHub Pages and Google Cloud Run instructions.

## Repository files

- `index.html` — self-contained product interface
- `product-spec.json` — validated product specification
- `Dockerfile` and `nginx.conf` — Cloud Run container
- `DEPLOY.md` — deployment instructions

## Important

This repository contains an interactive product concept, not a production application. Displayed sample content is fictional and requires validation before use.
