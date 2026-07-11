# GrowEasy Deployment Guide

## Platform chosen

Render Blueprint, using two free web services from the same GitHub repository:

- `groweasy-ai-crm-importer-web`: Next.js frontend
- `groweasy-ai-crm-importer-api`: Express backend

## Why Render

Vercel is ideal for the Next.js frontend, but this repository also includes a standard long-running Express server with upload endpoints and file-backed import history. Deploying that backend to Vercel would require converting it to serverless functions and replacing local persistence. Render supports the current app shape without a rewrite and can create both services from `render.yaml`.

## Repository shape

- Root: npm workspace monorepo
- Frontend: `frontend`, Next.js 15 App Router, server runtime via `next start`
- Backend: `backend`, Express 4 API compiled from TypeScript to `dist`
- Package manager: npm with root `package-lock.json`
- Backend runtime type: standard Express web server, not serverless
- Persistence: JSON import history under backend `data`; suitable for assignment demos, not long-term production data

## Render services

### Backend service

- Root directory: repository root
- Install command: handled inside build command
- Build command: `npm ci --include=dev && npm run build -w backend`
- Start command: `npm run start -w backend`
- Health check URL: `/health`
- Runtime: Node 22

Environment variables:

```bash
PORT=10000
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=<secret>
FRONTEND_ORIGIN=<injected from frontend service URL>
```

### Frontend service

- Root directory: repository root
- Install command: handled inside build command
- Build command: `npm ci --include=dev && npm run build -w frontend`
- Start command: `npm run start -w frontend`
- Health check URL: `/`
- Runtime: Node 22

Environment variables:

```bash
PORT=10000
NEXT_PUBLIC_API_URL=<injected from backend service URL>
```

## Required secret

Set `GEMINI_API_KEY` in Render when creating the Blueprint. Do not commit the key to git.

## Deploy from GitHub

1. Push this repository to `dashwanth1012/groweasy-ai-crm-importer`.
2. Open Render and choose **New > Blueprint**.
3. Connect the GitHub repository.
4. Render will read `render.yaml` and create both services.
5. Enter the `GEMINI_API_KEY` secret when Render asks for unsynced environment variables.
6. Deploy the Blueprint.

## Post-deployment verification

After Render finishes both builds:

1. Open the frontend public URL.
2. Confirm these routes load: `/`, `/import`, `/history`, `/team-members`, `/ad-accounts`, `/whatsapp`, `/tele-calling`, `/crm-fields`, `/api-center`, `/settings`.
3. Open the backend health URL: `https://<api-service>.onrender.com/health`.
4. Confirm `ok` is `true`, `geminiConfigured` is `true`, and the provider includes Gemini.
5. Upload a valid CSV and confirm preview, import, results, JSON export, CSV export, and history work.
6. Upload an invalid CSV and confirm a polished error appears.
7. Delete one history item and confirm the list updates.
8. Open browser DevTools and confirm there are no console or CORS errors.

## Notes

Render free web services can spin down after inactivity, so the first request after a pause may be slower. For durable multi-user production history, replace the JSON file repository with Postgres or another managed database.
