# Convex Setup

## Required Values

Local Convex setup usually writes these automatically:

```env
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
```

Some projects may also use:

```env
NEXT_PUBLIC_CONVEX_SITE_URL=
```

If CI will deploy Convex, gather:

```env
CONVEX_DEPLOY_KEY=
```

Never commit deploy keys.

## Local Initialization

From the repo root:

```bash
npm install convex
npx convex dev
```

During setup:

1. Log in to Convex.
2. Select the intended team.
3. Create or select the intended project.
4. Let Convex write local env values.
5. Keep `npx convex dev` running while testing live functions.

## Dashboard Location

Convex does not show a local folder as a separate dashboard project. The dashboard shows the cloud deployment linked by local env vars.

To open the exact linked deployment:

```bash
npx convex dashboard
```

If the deployment is not where expected:

```bash
npx convex logout
npx convex dev
```

Then log in with the correct account/team.

## Next.js Provider Pattern

Use a client provider:

```tsx
"use client"

import * as React from "react"
import { ConvexProvider, ConvexReactClient } from "convex/react"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  if (!convexUrl) {
    return <>{children}</>
  }

  return (
    <ConvexProvider client={new ConvexReactClient(convexUrl)}>
      {children}
    </ConvexProvider>
  )
}
```

After Convex codegen exists, use generated references:

```tsx
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"

const data = useQuery(api.demo.getStatus)
```

## Function Pattern

After initialization, prefer generated server helpers:

```ts
import { query } from "./_generated/server"

export const getStatus = query({
  handler: async () => {
    return {
      ok: true,
      message: "Convex is connected.",
      checkedAt: Date.now(),
    }
  },
})
```

Use validators for functions that accept arguments.

## Production and CI

- Put `NEXT_PUBLIC_CONVEX_URL` in Vercel environment variables.
- Use `CONVEX_DEPLOY_KEY` only if GitHub Actions deploys Convex.
- Store `CONVEX_DEPLOY_KEY` in GitHub secrets, never in workflow literals.
- Keep generated Convex files committed when Convex expects them for type-safe clients.
- Ignore `convex/_generated/**` in ESLint if generated eslint-disable directives create warnings.

## Verification

- Run `npx convex dev`.
- Open `npx convex dashboard` and confirm the expected deployment.
- Run app typecheck, lint, build, and tests.
- Exercise one query and one mutation before calling the integration complete.

## Official References

- Convex Next.js quickstart: https://docs.convex.dev/quickstart/nextjs
- Convex dashboard: https://dashboard.convex.dev
- Convex production hosting: https://docs.convex.dev/production/hosting
