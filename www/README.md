# 11ai website

The Next.js 16 application for the 11ai project site at https://ai.rj11.io/. It currently renders the starter page and shared component library that the site will build on.

## Run locally

Install and run this app from the `www` directory; it has its own package and lockfile.

```bash
cd www
npm install
npm run dev
```

No environment variables are currently required. Press `d` outside a form field to switch between light and dark themes.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm run format` | Format TypeScript and TSX files with Prettier |

## Layout

- `app/` contains the App Router layout, page, global styles, and favicon.
- `components/ui/` contains the shadcn component set.
- `components/theme-provider.tsx` configures system-aware themes and the `d` hotkey.
- `hooks/` and `lib/` contain shared client hooks and utilities.

The app uses the `@/*` import alias for paths relative to this directory.
