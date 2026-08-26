# Vesta.OS

An interactive product concept created by Maya and Theo in [Cofounder Live](https://nano-banana-guide-26967920041.us-central1.run.app).

## Product

Real-time WebGL wind vectors and dynamic route-risk calculation for state-level emergency dispatchers.

- Revision: 2
- Google capabilities: Dynamic Evacuation Routing + Toxic Plume Monitoring
- Capability rationale: Dynamic Evacuation Routing: Calculates real-time evacuation corridors bypassing active wildfire thermal plumes and toxic air corridors.
Toxic Plume Monitoring: Monitors live PM2.5 and AQI levels along the active incident zones to feed the Route Risk Index (RRI) calculator.

## Run locally

Open `index.html` in a modern browser. The interface has no build step.

The Dynamic Evacuation Routing + Toxic Plume Monitoring interaction uses the hosted Cofounder Live runtime for mission `ep_mtaar3q3` when a server-side Google Cloud action is required.

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
