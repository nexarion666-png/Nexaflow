# NexaFlow

Bright, mobile-first ZIP-to-GitHub app built with Next.js.

## Workflow
Upload ZIP → Extract ZIP & Preview Files → select repository and branch → push extracted file contents as a GitHub commit. The ZIP archive itself is not committed.

## Run
```bash
npm install
npm run dev
```

Deploy as a Next.js app on Vercel. This personal-use MVP uses a GitHub token entered in the UI; do not expose it to public multi-user use. ZIP limit: 100 MB; push limit: 500 files.
