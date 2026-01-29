# Single Vercel Deployment: Remix (API + landing) + Taro H5 (SPA)

Goal: deploy once to Vercel, and have:
- Remix handle:
  - `/api/*` backend
  - `/` landing page
- Taro H5 handle:
  - `/app/*` product pages (SPA)

This avoids running two Vercel projects.

---

## Approach

1) Build Taro H5 into Remix public assets:
- Taro config sets `outputRoot` to `../../public/app` when `TARO_ENV === 'h5'`.
- H5 assets are served as static files from Remix `public/`.

2) Route `/app/*` to the H5 SPA entry:
- Vercel routes are configured to:
  - serve existing static files first (`handle: filesystem`)
  - otherwise rewrite `/app` and `/app/*` to `/app/index.html`

3) Keep `/api/*` and `/` on Remix:
- `/api/*` are Remix route modules.
- `/` is Remix landing page.

---

## Repo Convention

- Taro app lives at `apps/app`.
- Remix app lives at repo root (current state), so Vercel framework detection remains stable.
- pnpm workspace installs dependencies for both root and `apps/app`.

---

## Build Commands

Root `package.json` defines:
- `pnpm run build`:
  - `pnpm -C apps/app build:h5` (emits to `public/app`)
  - `remix vite:build` (builds Remix server/client)

---

## Notes / Caveats

- Any request to `/app/assets/*` must remain a real file; this is why routing uses `handle: filesystem` first.
- Taro H5 base path is `/app`:
  - `apps/app/config/index.ts` sets `h5.publicPath = '/app/'` and `h5.router.basename = '/app'`.

