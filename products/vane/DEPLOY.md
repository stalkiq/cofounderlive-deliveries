# Deployment

## GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Choose **Deploy from a branch**.
3. Select the merged branch and the folder containing this product's `index.html`.

If this product is delivered inside a shared repository folder, copy that folder to a dedicated repository root before enabling Pages.

## Google Cloud Run

Install and authenticate the Google Cloud CLI, then run:

```bash
gcloud run deploy vane \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Cloud Run builds the included Dockerfile and serves the product on port 8080.

## Google capability

Google Maps was selected by Theo because: Integrating Google Maps allows dispatchers to overlay dynamic weather fronts and isobar vectors directly onto real-world shipping lanes and port coordinates.

Maps and Calendar actions open official Google destinations. Gemini and BigQuery actions use the Cofounder Live Google Cloud runtime referenced by the generated interface; replace that runtime with your own authenticated backend before production use.
