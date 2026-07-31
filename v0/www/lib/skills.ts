import fs from "node:fs"
import path from "node:path"

import matter from "gray-matter"

export const GITHUB_REPO_URL = "https://github.com/rj11io/11ai"
export const NPM_URL = "https://www.npmjs.com/package/@rj11io/11ai"
export const INSTALL_COMMAND = "npx skills add rj11io/11ai --full-depth"

/**
 * Curated per-plugin presentation data. Skills, counts, and descriptions all
 * come from the skill files themselves; only the short taglines and display
 * order live here.
 */
const PLUGIN_CONFIG = [
  {
    slug: "agent-automation",
    dir: "11ai-agent-automation",
    title: "Agent automation",
    tagline:
      "Scheduled autonomous agents that ship real, verifiable work using the Ledger + Conductor + Routine pattern.",
  },
  {
    slug: "ai-chat",
    dir: "11ai-ai-chat",
    title: "AI chat",
    tagline:
      "End-to-end chat products: sessions, tools, models, providers, UI, and messaging-platform extensions.",
  },
  {
    slug: "operator-antdesign-v6",
    dir: "11ai-operator-antdesign-v6",
    title: "Ant Design v6 operator",
    tagline:
      "Ant Design 6 React setup, components, theming, integrations, first-party native skills, reference, and troubleshooting.",
  },
  {
    slug: "operator-aws-cli-v2",
    dir: "11ai-operator-aws-cli-v2",
    title: "AWS CLI v2 operator",
    tagline:
      "AWS CLI v2 operations for common services, deployments, first-party Agent Toolkit skills, integrations, and troubleshooting.",
  },
  {
    slug: "operator-bash",
    dir: "11ai-operator-bash",
    title: "Bash operator",
    tagline:
      "Shell inspection, strict-mode scripting, text processing, files, processes, linting, integrations, and troubleshooting.",
  },
  {
    slug: "benchmarks",
    dir: "11ai-benchmarks",
    title: "Benchmarks",
    tagline:
      "Run resumable soft or final benchmark lifecycles across time-gated models, judging, accounting, reports, and websites.",
  },
  {
    slug: "blog-builder",
    dir: "11ai-blog-builder",
    title: "Blog builder",
    tagline:
      "Build file-backed editorial blogs with composable CMS, author, Markdown, content, navigation, and UI skills.",
  },
  {
    slug: "cleanup",
    dir: "11ai-cleanup",
    title: "Cleanup",
    tagline:
      "Safely find and remove abandoned local resources: worktrees, threads, ports, and node_modules.",
  },
  {
    slug: "operator-clerk-core-3",
    dir: "11ai-operator-clerk-core-3",
    title: "Clerk Core 3 operator",
    tagline:
      "Clerk Core 3 setup, authentication, sessions, users, organizations, webhooks, native skills, and troubleshooting.",
  },
  {
    slug: "codebase",
    dir: "11ai-codebase",
    title: "Codebase",
    tagline:
      "Playwright setup, npm publishing, and fully automated releases for your repositories.",
  },
  {
    slug: "operator-convex",
    dir: "11ai-operator-convex",
    title: "Convex operator",
    tagline:
      "Current Convex setup, schema, functions, auth, storage, deployments, first-party native skills, and troubleshooting.",
  },
  {
    slug: "operator-css-3",
    dir: "11ai-operator-css-3",
    title: "CSS3 operator",
    tagline:
      "Current CSS3-family cascade, selectors, layout, responsive design, theming, motion, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-docker",
    dir: "11ai-operator-docker",
    title: "Docker operator",
    tagline:
      "Common Docker CLI and Compose operations with setup, integrations, safety-first cleanup, registry, storage, and troubleshooting workflows.",
  },
  {
    slug: "operator-git",
    dir: "11ai-operator-git",
    title: "Git operator",
    tagline:
      "Focused, safety-first Git skills for setup, state, commits, branches, worktrees, tags, submodules, hooks, pull requests, bisect, recovery, and troubleshooting.",
  },
  {
    slug: "operator-html-5",
    dir: "11ai-operator-html-5",
    title: "HTML5 operator",
    tagline:
      "Current HTML5 documents, semantics, accessibility, forms, media, metadata, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-javascript-es2026",
    dir: "11ai-operator-javascript-es2026",
    title: "JavaScript ES2026 operator",
    tagline:
      "ECMAScript 2026 modules, async control flow, DOM events, data modeling, standard-library additions, performance, security, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-jest-v30",
    dir: "11ai-operator-jest-v30",
    title: "Jest v30 operator",
    tagline:
      "Setting up, inspecting, running, authoring, de-flaking, speeding up, integrating, and troubleshooting Jest 30 suites.",
  },
  {
    slug: "llm-costs",
    dir: "11ai-llm-costs",
    title: "LLM costs",
    tagline:
      "Project-scoped and machine-wide LLM usage and cost reporting across local coding harnesses.",
  },
  {
    slug: "operator-mongodb-v8",
    dir: "11ai-operator-mongodb-v8",
    title: "MongoDB v8 operator",
    tagline:
      "MongoDB 8 Shell and Database Tools work with transactions, profiling, roles, Atlas, backups, integrations, and read-first safety checks.",
  },
  {
    slug: "operator-nextjs-v16",
    dir: "11ai-operator-nextjs-v16",
    title: "Next.js v16 operator",
    tagline:
      "Next.js 16 App Router, Server and Client Components, Cache Components, mutations, handlers, metadata, deployment, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-nodejs-api-v24",
    dir: "11ai-operator-nodejs-api-v24",
    title: "Node.js API v24 operator",
    tagline:
      "Scaffolding, routing, validation, auth, data, jobs, GraphQL, OpenAPI, testing, and troubleshooting Node.js 24 LTS APIs.",
  },
  {
    slug: "operator-pokeapi-v2",
    dir: "11ai-operator-pokeapi-v2",
    title: "PokéAPI v2 operator",
    tagline:
      "Cache-first PokéAPI v2 setup, Pokémon, moves, items, locations, encounters, evolution, games, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-reactjs-v19",
    dir: "11ai-operator-reactjs-v19",
    title: "React v19 operator",
    tagline:
      "React 19.2 components, state, effects, Actions, Activity, forms, performance, testing, integrations, reference, and troubleshooting.",
  },
  {
    slug: "super",
    dir: "11ai-super",
    title: "Super",
    tagline:
      "Long-running general and specialist routines that perform, audit, fix, and verify repeatedly until a high quality bar is met.",
  },
  {
    slug: "security",
    dir: "11ai-security",
    title: "Security",
    tagline:
      "Read-only dependency auditing with precise installed-version evidence and critical host-harm triage.",
  },
  {
    slug: "operator-ssh",
    dir: "11ai-operator-ssh",
    title: "SSH operator",
    tagline:
      "OpenSSH client setup, keys, host configuration, sessions, tunnels, file transfer, integrations, and troubleshooting.",
  },
  {
    slug: "operator-stripe",
    dir: "11ai-operator-stripe",
    title: "Stripe operator",
    tagline:
      "Stripe setup, customers, prices, Checkout, subscriptions, payments, webhooks, entitlements, and troubleshooting.",
  },
  {
    slug: "operator-supabase",
    dir: "11ai-operator-supabase",
    title: "Supabase operator",
    tagline:
      "Current Supabase setup, Postgres, RLS, auth, storage, edge functions, first-party native skills, and troubleshooting.",
  },
  {
    slug: "operator-typescript-v7",
    dir: "11ai-operator-typescript-v7",
    title: "TypeScript v7 operator",
    tagline:
      "TypeScript 7 native compiler configuration, type modeling, narrowing, generics, modules, packages, migrations, declarations, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-vercel-ai-gateway",
    dir: "11ai-operator-vercel-ai-gateway",
    title: "Vercel AI Gateway operator",
    tagline:
      "Models, routing, fallbacks, authentication, BYOK, budgets, usage, observability, security, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-vercel-ai-sdk-v7",
    dir: "11ai-operator-vercel-ai-sdk-v7",
    title: "Vercel AI SDK v7 operator",
    tagline:
      "AI SDK 7 multimodal generation, streaming UI, structured output, tools, durable agents, providers, telemetry, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-vercel-chat-sdk-v4",
    dir: "11ai-operator-vercel-chat-sdk-v4",
    title: "Vercel Chat SDK v4 operator",
    tagline:
      "Chat SDK 4 adapters, handlers, messages, UI, AI tools, state, concurrency, webhooks, deployment, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-vercel-core",
    dir: "11ai-operator-vercel-core",
    title: "Vercel Core Platform operator",
    tagline:
      "Security, content delivery, Fluid Compute, observability, CI/CD, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-vercel-eve-v0",
    dir: "11ai-operator-vercel-eve-v0",
    title: "Vercel eve v0 operator",
    tagline:
      "eve 0.27 definitions, tools, durable sessions, subagents, approvals, channels, schedules, evaluations, observability, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-vercel-passport",
    dir: "11ai-operator-vercel-passport",
    title: "Vercel Passport operator",
    tagline:
      "Identity providers, project protection, team policies, visitor identity, sessions, audit, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-vercel-sandbox-v2",
    dir: "11ai-operator-vercel-sandbox-v2",
    title: "Vercel Sandbox v2 operator",
    tagline:
      "Sandbox SDK 2 lifecycle, persistent compute, commands, files, runtimes, images, multi-user isolation, networking, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-vercel-workflows-v4",
    dir: "11ai-operator-vercel-workflows-v4",
    title: "Vercel Workflows v4 operator",
    tagline:
      "Workflow SDK 4 definitions, steps, durability, event-sourced runs, retries, events, approvals, encryption, observability, integrations, reference, and troubleshooting.",
  },
  {
    slug: "operator-workos",
    dir: "11ai-operator-workos",
    title: "WorkOS operator",
    tagline:
      "Current WorkOS setup, AuthKit, SSO, directory sync, organizations, webhooks, first-party native skills, and troubleshooting.",
  },
  {
    slug: "utils",
    dir: "11ai-utils",
    title: "Utilities",
    tagline:
      "Git task directors, Markdown compression, reverse engineering, reviews, analytics, publication CMS, calls to action, project sites, and operator-plugin scaffolding.",
  },
  {
    slug: "xharness",
    dir: "11ai-xharness",
    title: "Cross-harness",
    tagline:
      "Delegate work to agents running in other CLI harnesses and coordinate between them.",
  },
  {
    slug: "web-design",
    dir: "11ai-web-design",
    title: "Web design",
    tagline:
      "The 11ai visual language and deliberate content-led styling for accessible, compact, and data-rich interfaces.",
  },
] as const

export type Plugin = {
  slug: string
  dir: string
  title: string
  tagline: string
  githubUrl: string
  skillCount: number
}

export type Skill = {
  /** Directory name, unique across the repo; used as the URL slug. */
  slug: string
  name: string
  description: string
  pluginSlug: string
  pluginTitle: string
  /** Path from the repo root, e.g. "v0/plugins/11ai-utils/skills/11ai-roast". */
  repoPath: string
  githubUrl: string
}

function parseSkillFile(
  raw: string,
  filePath: string
): {
  data: { name: string; description: string }
  content: string
} {
  const match = raw.match(
    /^---\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\ndescription: ("(?:\\.|[^"\\])*")\n---\n([\s\S]*)$/
  )
  if (!match) {
    throw new Error(
      `${filePath} must use canonical skill frontmatter with a plain name and one JSON-quoted description line`
    )
  }

  const parsed = matter(raw)
  const description = JSON.parse(match[2]) as unknown
  if (typeof description !== "string" || !description.trim()) {
    throw new Error(`${filePath} must have a non-empty string description`)
  }
  return {
    data: { name: match[1], description },
    content: parsed.content,
  }
}

function resolvePluginsRoot(): string {
  const candidates = [
    path.join(process.cwd(), "..", "plugins"),
    path.join(process.cwd(), "v0", "plugins"),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error(
    `Could not locate the v0/plugins directory from ${process.cwd()}`
  )
}

/** Find the canonical skill directories directly under a plugin's `skills/`. */
function findSkillDirs(pluginDir: string): string[] {
  const skillsDir = path.join(pluginDir, "skills")
  if (!fs.existsSync(skillsDir)) return []

  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsDir, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, "SKILL.md")))
    .sort()
}

/**
 * Presentation data for a plugin directory not yet in PLUGIN_CONFIG: slug from
 * the directory name, title and tagline from its README. Keeps the repo the
 * single source of truth when a new plugin lands before this file is updated.
 */
function derivePluginConfig(root: string, dir: string) {
  const slug = dir.replace(/^11ai-/, "")
  let title = slug.replace(/-/g, " ")
  title = title.charAt(0).toUpperCase() + title.slice(1)
  let tagline = ""
  const readmePath = path.join(root, dir, "README.md")
  if (fs.existsSync(readmePath)) {
    const lines = fs.readFileSync(readmePath, "utf8").split(/\r?\n/)
    const heading = lines.find((l) => l.startsWith("# "))
    if (heading)
      title = heading.replace(/^#\s*/, "").replace(/^11ai[- ]*/i, "") || title
    const paragraph = lines.find((l) => l.trim() && !l.startsWith("#"))
    if (paragraph) tagline = paragraph.replace(/\*\*/g, "").trim()
  }
  return { slug, dir, title, tagline }
}

function loadAllSkills(): { skills: Skill[]; plugins: Plugin[] } {
  const root = resolvePluginsRoot()
  const skills: Skill[] = []
  const plugins: Plugin[] = []

  const configured = new Set<string>(PLUGIN_CONFIG.map((g) => g.dir))
  const discovered = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !configured.has(e.name))
    .map((e) => derivePluginConfig(root, e.name))

  for (const plugin of [...PLUGIN_CONFIG, ...discovered]) {
    const pluginDir = path.join(root, plugin.dir)
    const skillDirs = fs.existsSync(pluginDir) ? findSkillDirs(pluginDir) : []

    // A plugin with no skills yet (e.g. a placeholder README) stays hidden.
    if (skillDirs.length === 0) continue

    for (const skillDir of skillDirs) {
      const skillFile = path.join(skillDir, "SKILL.md")
      const raw = fs.readFileSync(skillFile, "utf8")
      const { data } = parseSkillFile(raw, skillFile)
      const slug = path.basename(skillDir)
      if (data.name !== slug) {
        throw new Error(
          `${skillFile} name '${data.name}' does not match its containing directory`
        )
      }
      const repoPath = path
        .join("v0", "plugins", path.relative(root, skillDir))
        .split(path.sep)
        .join("/")
      skills.push({
        slug,
        name: data.name,
        description: data.description.trim(),
        pluginSlug: plugin.slug,
        pluginTitle: plugin.title,
        repoPath,
        githubUrl: `${GITHUB_REPO_URL}/tree/main/${repoPath}`,
      })
    }

    plugins.push({
      slug: plugin.slug,
      dir: plugin.dir,
      title: plugin.title,
      tagline: plugin.tagline,
      githubUrl: `${GITHUB_REPO_URL}/tree/main/v0/plugins/${plugin.dir}`,
      skillCount: skillDirs.length,
    })
  }

  return { skills, plugins }
}

let cache: { skills: Skill[]; plugins: Plugin[] } | null = null

function loaded() {
  cache ??= loadAllSkills()
  return cache
}

export function getPlugins(): Plugin[] {
  return [...loaded().plugins].sort((a, b) => a.title.localeCompare(b.title))
}

export function getPlugin(slug: string): Plugin | undefined {
  return loaded().plugins.find((g) => g.slug === slug)
}

export function getSkills(): Skill[] {
  return loaded().skills
}

export function getSkillsByPlugin(pluginSlug: string): Skill[] {
  return loaded().skills.filter((s) => s.pluginSlug === pluginSlug)
}

export function getSkill(slug: string): Skill | undefined {
  return loaded().skills.find((s) => s.slug === slug)
}

/** Full SKILL.md body (frontmatter stripped) for the detail page. */
export function getSkillContent(slug: string): string {
  const skill = getSkill(slug)
  if (!skill) throw new Error(`Unknown skill: ${slug}`)
  const root = resolvePluginsRoot()
  const filePath = path.join(
    root,
    skill.repoPath
      .replace(/^v0\/plugins\//, "")
      .split("/")
      .join(path.sep),
    "SKILL.md"
  )
  const { content } = parseSkillFile(
    fs.readFileSync(filePath, "utf8"),
    filePath
  )
  return content.trim()
}

export function getSkillCount(): number {
  return loaded().skills.length
}

export function getPackageVersion(): string {
  const root = resolvePluginsRoot()
  const pkgPath = path.join(root, "..", "..", "package.json")
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
    return typeof pkg.version === "string" ? pkg.version : ""
  } catch {
    return ""
  }
}
