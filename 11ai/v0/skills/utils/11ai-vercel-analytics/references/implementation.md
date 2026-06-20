# Vercel Web Analytics implementation

## Official setup sequence

1. Enable Web Analytics for the project from the Analytics section of the Vercel dashboard.
2. Install `@vercel/analytics` with the repository’s package manager.
3. Add the framework integration once at the application root.
4. Deploy the application to Vercel.
5. Visit the deployed application and confirm a Fetch/XHR request to the configured analytics view endpoint, then inspect data in the dashboard.

Enabling Web Analytics adds Vercel-managed analytics routes after the next deployment. Code integration does not enable the dashboard feature by itself.

## Install

Use the package manager already established by the lockfile:

```bash
npm install @vercel/analytics
```

```bash
pnpm add @vercel/analytics
```

```bash
yarn add @vercel/analytics
```

```bash
bun add @vercel/analytics
```

Do not replace the project’s package manager or install the Vercel CLI solely to add the library.

## Next.js App Router

Add one component to the root `app/layout.tsx` or equivalent root layout:

```tsx
import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

Keep existing providers and layout structure. Place `Analytics` inside `body`, normally after application content.

## Next.js Pages Router

Add one component to `pages/_app.tsx`:

```tsx
import type { AppProps } from "next/app"
import { Analytics } from "@vercel/analytics/next"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

If both `app` and `pages` directories exist, determine which root owns the routes in scope and avoid mounting duplicate components.

## Other frameworks

Use the framework adapter documented in Vercel’s quickstart rather than copying the Next.js import. Examples include `@vercel/analytics/react`, `/sveltekit`, `/remix`, `/astro`, `/vue`, and `/nuxt`. Recheck the official framework selector because adapter APIs can change.

## Verification

Run the repository’s normal quality commands, typically:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Adapt to scripts that actually exist. Confirm:

- the package is recorded in the manifest and lockfile;
- exactly one root Analytics integration exists;
- the application compiles and existing tests pass;
- Web Analytics is enabled in the Vercel dashboard;
- the next deployment receives a request to the Vercel-configured view endpoint when a page is visited.

Dashboard data may take time to appear. Do not treat the absence of immediate dashboard data as a code failure when the deployed request succeeds.

## Advanced configuration

Keep default automatic configuration unless requirements justify an override. The package supports options such as `mode`, `debug`, `beforeSend`, `scriptSrc`, `eventEndpoint`, and `viewEndpoint`.

Use `beforeSend` when the user explicitly needs URL redaction or route exclusion. Return `null` to suppress an event. Never send secrets, tokens, personal data, or sensitive query parameters as analytics URLs or custom event properties.

## Official sources

- [Vercel Web Analytics quickstart](https://vercel.com/docs/analytics/quickstart)
- [Advanced `@vercel/analytics` configuration](https://vercel.com/docs/analytics/package)
- [Next.js on Vercel: Web Analytics](https://vercel.com/docs/frameworks/nextjs#web-analytics)
