# Deployment

## GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Choose **Deploy from a branch**.
3. Select the merged branch and the folder containing this product's `index.html`.

If this product is delivered inside a shared repository folder, copy that folder to a dedicated repository root before enabling Pages.

## Google Cloud Run

Install and authenticate the Google Cloud CLI, then run:

```bash
gcloud run deploy vesta-os \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Cloud Run builds the included Dockerfile and serves the product on port 8080.

## Google capability

Dynamic Evacuation Routing: Calculates real-time evacuation corridors bypassing active wildfire thermal plumes and toxic air corridors.
Toxic Plume Monitoring: Monitors live PM2.5 and AQI levels along the active incident zones to feed the Route Risk Index (RRI) calculator.

The generated interface uses the hosted Cofounder Live runtime for server-side Google Cloud actions. Replace that runtime with your own authenticated backend before production use.
