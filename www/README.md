# 11ai website

The Next.js 16 application for the 11ai project site at https://ai.rj11.io/. It turns the repository's `SKILL.md` files into a searchable catalog with plugin and skill detail pages.

## Run locally

The app has its own package and lockfile. From the repository root:

```bash
cd www
npm install
npm run dev
```

No environment variables are currently required. The app reads skill content and the package version directly from the repository, so run it with the sibling `11ai/` directory and root `package.json` present. Press `d` outside a form field to switch between light and dark themes.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm run format` | Format TypeScript and TSX files with Prettier |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Introduce the collection, installation flow, plugins, and agent-automation pattern |
| `/skills` | Search every skill by name, purpose, or plugin |
| `/plugins` | List every plugin (old `/groups` links redirect here) |
| `/plugins/[slug]` | List the skills in one plugin (old `/groups/[slug]` links redirect here) |
| `/skills/[slug]` | Render a skill's description, suggested prompt, and full Markdown playbook |

## Content source

`lib/skills.ts` discovers plugins under `../11ai/v0`, reads each skill's frontmatter, and exposes the catalog data used by the routes. The current plugins have curated display order and taglines; an unconfigured plugin can also be discovered from its directory and README. `lib/markdown.ts` renders each `SKILL.md` body for its detail page.

Skill and plugin routes are generated from repository content. Update the source `SKILL.md` and plugin README files instead of copying catalog data into page components.

## Layout

- `app/` contains the App Router home, catalog, plugin, skill, and not-found pages plus global styles and metadata.
- `components/` contains catalog cards, navigation, installation UI, theme controls, and the shared shadcn component set under `components/ui/`.
- `components/theme-provider.tsx` configures system-aware themes and the `d` hotkey.
- `hooks/` and `lib/` contain shared client hooks, Markdown rendering, repository discovery, and utilities.

The app uses the `@/*` import alias for paths relative to this directory.
