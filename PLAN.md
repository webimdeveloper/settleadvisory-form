Plan: settleadvisory-plugin (wi-form)

Status summary
- [x] Inspect SSH config and keys (local)
- [x] Add public key to provider and verify SSH access to live
- [x] Locate git repos and remotes on VPS; found plugin repo at `/var/www/wordpress/wp-content/plugins/wi-form` (remote: https://github.com/webimdeveloper/wi-form)
- [x] Pull live files into local working directory (`/Users/serhiihryshyn/Documents/Projects/settleadvisory/wp-content/plugins/wi-form`)
- [x] Initialize local git repo and commit initial import
- [x] Start local Docker WordPress environment (http://localhost:8000) and verify plugin page
- [ ] Configure GitHub repo, branches and Actions workflow (next)
- [ ] Add repository secrets for deploy (next)
- [ ] Create/verify deploy workflow to push `live` to server (next)

Next actions (priority)
1. Create GitHub repository `settleadvisory-plugin` under your account and add it as `origin` (private).
2. Push `main` and create `dev` branch; create an empty `live` branch.
3. Add repository secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY`, `KNOWN_HOSTS`.
4. Push the `create-pr-to-live` workflow (already present) then verify PR creation on push to `main`.
5. Create a `deploy-live.yml` workflow to deploy when `live` is updated (I can generate this for you).
6. Workflow validation: merge a test PR from `dev`→`main`→auto PR to `live`, then merge `live` to trigger deploy.

Local testing reminders
- Test shortcode on http://localhost:8000/?page_id=2
- Use WP-CLI in container: `php /tmp/wp-cli.phar` with `--allow-root` when called from container as root.

When you're ready tomorrow I will:
- Create the GitHub repo and push branches (with your approval).
- Add and configure Actions secrets (you will paste secret values into `gh secret set` or repo UI).
- Generate and test a `deploy-live.yml` workflow that uses `DEPLOY_KEY` to rsync files to the server.

If anything changes overnight (different target repo or deploy user), tell me and I'll adapt the steps.
