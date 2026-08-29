# Deployment

## GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Choose **Deploy from a branch**.
3. Select the merged branch and the folder containing this product's `index.html`.

If this product is delivered inside a shared repository folder, copy that folder to a dedicated repository root before enabling Pages.

## Google Cloud Run

Install and authenticate the Google Cloud CLI, then run:

```bash
gcloud run deploy astraea \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Cloud Run builds the included Dockerfile and serves the product on port 8080.

## Google capability

Socratic Primer Engine: Generates personalized, Socratic stories and dialogues that adapt to the child's vocabulary, emotional state, and logical reasoning.

The generated interface uses the hosted Cofounder Live runtime for server-side Google Cloud actions. Replace that runtime with your own authenticated backend before production use.

For a Google Map, replace `REPLACE_WITH_RESTRICTED_MAPS_BROWSER_KEY` in `index.html` at deployment time with your own Maps JavaScript API browser key. Restrict the key to the Maps JavaScript API and your deployed HTTP referrer; never commit it to source control.
