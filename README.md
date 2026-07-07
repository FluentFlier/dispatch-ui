# Dispatch UI

Design-only export of [FluentFlier/dispatch](https://github.com/FluentFlier/dispatch). Use this repo to redesign screens, typography, and components **without touching the production backend**.

## What's included

- All React components (`src/components/`)
- All app routes and layouts (`src/app/`, except real API routes)
- Tailwind theme, globals, and public assets
- Mock data + mock API so pages render with realistic content

## What's **not** included

- Database, InsForge, Stripe, Unipile, cron jobs, webhooks
- Real auth (sessions are mocked)
- Server secrets or `.env` files from production

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

### Key routes to review

| Route | Screen |
|-------|--------|
| `/` | Marketing landing |
| `/login` | Sign in |
| `/pricing` | Pricing |
| `/dashboard` | Home |
| `/generate` | Content generator |
| `/library` | Post library |
| `/calendar` | Calendar |
| `/leads` | Leads feed |
| `/signals` | Signals |
| `/settings` | Settings |
| `/admin` | Admin shell |

Set `NEXT_PUBLIC_UI_MOCK_LOGGED_IN=false` in `.env.local` to preview the logged-out landing page.

## Workflow for designers

1. Edit components in `src/components/` and page layouts in `src/app/`.
2. Tokens live in `tailwind.config.ts` and `src/app/globals.css`.
3. When a design is ready, share a PR here — engineering will port changes back to the main `dispatch` repo.

## Mock API

All `/api/*` requests are handled by `src/app/api/[[...path]]/route.ts` with fixture data from `src/lib/mock/fixtures.ts`. Buttons that would call AI or publish in production return placeholder responses.

## Syncing from main app

Re-export from the main repo when UI structure changes significantly. Ask engineering to run the UI export script or open an issue on the main repo.
