# litellm-docs

Source for [docs.litellm.ai](https://docs.litellm.ai) — the documentation site for [LiteLLM](https://github.com/BerriAI/litellm).

Built with [Docusaurus 3](https://docusaurus.io/).

## Local development

```bash
npm install
npm start
```

Open http://localhost:3000 to see the site with live reload.

## Build

```bash
npm run build
```

Static output goes to `build/`.

## Deploy

Deploys are handled automatically by Vercel on push to `main`.

### Firebase Hosting

The `Firebase Hosting` GitHub Actions workflow builds every pull request and
deploys the `main` branch to the Firebase Hosting live channel. It can also be
started manually with `workflow_dispatch`.

This fork deploys the `litellm-docs-zh-tw` target in the
`vertex-ai-sprint` project to the dedicated Hosting site at
<https://litellm-docs-zh-tw-8088.web.app>.

Deploying from another repository or fork requires these GitHub Actions values:

- Repository variable `FIREBASE_PROJECT_ID`: the target Firebase project ID.
- Repository secret `FIREBASE_SERVICE_ACCOUNT`: the complete service account
  JSON key authorized to deploy to Firebase Hosting.

With the GitHub CLI, configure them for a fork as follows:

```bash
gh variable set FIREBASE_PROJECT_ID \
  --repo OWNER/litellm-docs \
  --body FIREBASE_PROJECT_ID

gh secret set FIREBASE_SERVICE_ACCOUNT \
  --repo OWNER/litellm-docs \
  < /secure/path/firebase-service-account.json
```

Follow the official Firebase Action
[service account guide](https://github.com/FirebaseExtended/action-hosting-deploy/blob/main/docs/service-account.md)
to create the JSON key and grant its deployment permissions. The workflow
deploys the static Docusaurus output from `build/`, as configured in
`firebase.json`.

## Contributing

Edits are welcome via pull request. For substantive content changes, please open an issue first to discuss.

The main LiteLLM repository is at <https://github.com/BerriAI/litellm>.
