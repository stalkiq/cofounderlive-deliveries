# Vane

An interactive product concept created by Maya and Theo in [Cofounder Live](https://nano-banana-guide-26967920041.us-central1.run.app).

## Product

A high-fidelity weather intelligence platform built for global maritime dispatchers and supply chain risk managers.

- Revision: 2
- Google capability: Google Maps
- Capability rationale: Integrating Google Maps allows dispatchers to overlay dynamic weather fronts and isobar vectors directly onto real-world shipping lanes and port coordinates.

## Run locally

Open `index.html` in a modern browser. The interface has no build step.

The Google Maps interaction uses the hosted Cofounder Live runtime for mission `ep_mta96u4t` when a server-side Google Cloud action is required.

## Deploy

See [DEPLOY.md](./DEPLOY.md) for GitHub Pages and Google Cloud Run instructions.

## Repository files

- `index.html` — self-contained product interface
- `product-spec.json` — validated product specification
- `Dockerfile` and `nginx.conf` — Cloud Run container
- `DEPLOY.md` — deployment instructions

## Important

This repository contains an interactive product concept, not a production application. Displayed sample content is fictional and requires validation before use.
