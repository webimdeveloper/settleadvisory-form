# wi-form

This repository contains the `wi-form` WordPress plugin used by the Settleadvisory site.

## Local development
- Start the local WordPress test environment from the project root with `docker compose up -d`.
- Open http://localhost:8000 and use the shortcode `[wi_form_trademark]` on a page to test the plugin.

## Deployment flow
- Work on `dev`.
- Merge to `main`.
- GitHub Actions creates a PR to `live`.
- Merging `live` triggers deployment to the live server.
