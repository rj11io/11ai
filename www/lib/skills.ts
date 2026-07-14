import fs from "node:fs"
import path from "node:path"

import matter from "gray-matter"

export const GITHUB_REPO_URL = "https://github.com/rj11io/11ai"
export const NPM_URL = "https://www.npmjs.com/package/@rj11io/11ai"
export const INSTALL_COMMAND = "npx skills add rj11io/11ai"

/**
 * Curated per-group presentation data. Skills, counts, and descriptions all
 * come from the skill files themselves; only the short taglines and display
 * order live here.
 */
const GROUP_CONFIG = [
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
    slug: "benchmarks",
    dir: "11ai-benchmarks",
    title: "Benchmarks",
    tagline:
      "Create, run, audit, judge, cost, review, and report benchmarks that compare AI coding models.",
  },
  {
    slug: "cleanup",
    dir: "11ai-cleanup",
    title: "Cleanup",
    tagline:
      "Safely find and remove abandoned local resources: worktrees, threads, ports, and node_modules.",
  },
  {
    slug: "codebase",
    dir: "11ai-codebase",
    title: "Codebase",
    tagline:
      "Playwright setup, npm publishing, and fully automated releases for your repositories.",
  },
  {
    slug: "integrations",
    dir: "11ai-integrations",
    title: "Integrations",
    tagline:
      "Add Convex, WorkOS AuthKit, or both to Next.js applications the right way.",
  },
  {
    slug: "super",
    dir: "11ai-super",
    title: "Super",
    tagline:
      "Long-running specialist routines that audit and fix repeatedly until a high quality bar is met: metadata and SEO, performance, security, READMEs, and UX.",
  },
  {
    slug: "utils",
    dir: "11ai-utils",
    title: "Utilities",
    tagline:
      "Markdown compression, honest reviews, analytics, web design, and repo-driven project sites.",
  },
  {
    slug: "xharness",
    dir: "11ai-xharness",
    title: "Cross-harness",
    tagline:
      "Delegate work to agents running in other CLI harnesses and coordinate between them.",
  },
] as const

export type SkillGroup = {
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
  groupSlug: string
  groupTitle: string
  /** Path from the repo root, e.g. "11ai/v0/11ai-utils/11ai-roast". */
  repoPath: string
  githubUrl: string
}

/**
 * Split frontmatter from body without a YAML parser. Fallback for skill
 * files whose long unquoted descriptions are not strictly valid YAML
 * (e.g. an unquoted "pattern: scan" inside the description).
 */
function parseSkillFileLenient(raw: string): {
  data: Record<string, string>
  content: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const [, frontmatter, content] = match
  const data: Record<string, string> = {}
  let currentKey: string | null = null
  for (const line of frontmatter.split(/\r?\n/)) {
    const keyMatch = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (keyMatch && !line.startsWith(" ")) {
      currentKey = keyMatch[1]
      data[currentKey] = keyMatch[2].replace(/^>-?\s*$/, "")
    } else if (currentKey) {
      data[currentKey] = `${data[currentKey]} ${line.trim()}`.trim()
    }
  }
  return { data, content }
}

function parseSkillFile(raw: string): {
  data: Record<string, unknown>
  content: string
} {
  try {
    return matter(raw)
  } catch {
    return parseSkillFileLenient(raw)
  }
}

function resolveSkillsRoot(): string {
  const candidates = [
    path.join(process.cwd(), "..", "11ai", "v0"),
    path.join(process.cwd(), "11ai", "v0"),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error(
    `Could not locate the 11ai/v0 skills directory from ${process.cwd()}`,
  )
}

/** Find every directory under `dir` (max two levels deep) holding a SKILL.md. */
function findSkillDirs(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const child = path.join(dir, entry.name)
    if (fs.existsSync(path.join(child, "SKILL.md"))) {
      results.push(child)
    } else {
      for (const nested of fs.readdirSync(child, { withFileTypes: true })) {
        if (!nested.isDirectory()) continue
        const nestedDir = path.join(child, nested.name)
        if (fs.existsSync(path.join(nestedDir, "SKILL.md"))) {
          results.push(nestedDir)
        }
      }
    }
  }
  return results.sort()
}

/**
 * Presentation data for a group directory not yet in GROUP_CONFIG: slug from
 * the directory name, title and tagline from its README. Keeps the repo the
 * single source of truth when a new group lands before this file is updated.
 */
function deriveGroupConfig(root: string, dir: string) {
  const slug = dir.replace(/^11ai-/, "")
  let title = slug.replace(/-/g, " ")
  title = title.charAt(0).toUpperCase() + title.slice(1)
  let tagline = ""
  const readmePath = path.join(root, dir, "README.md")
  if (fs.existsSync(readmePath)) {
    const lines = fs.readFileSync(readmePath, "utf8").split(/\r?\n/)
    const heading = lines.find((l) => l.startsWith("# "))
    if (heading) title = heading.replace(/^#\s*/, "").replace(/^11ai[- ]*/i, "") || title
    const paragraph = lines.find((l) => l.trim() && !l.startsWith("#"))
    if (paragraph) tagline = paragraph.replace(/\*\*/g, "").trim()
  }
  return { slug, dir, title, tagline }
}

function loadAllSkills(): { skills: Skill[]; groups: SkillGroup[] } {
  const root = resolveSkillsRoot()
  const skills: Skill[] = []
  const groups: SkillGroup[] = []

  const configured = new Set<string>(GROUP_CONFIG.map((g) => g.dir))
  const discovered = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !configured.has(e.name))
    .map((e) => deriveGroupConfig(root, e.name))

  for (const group of [...GROUP_CONFIG, ...discovered]) {
    const groupDir = path.join(root, group.dir)
    const skillDirs = fs.existsSync(groupDir) ? findSkillDirs(groupDir) : []

    // A group with no skills yet (e.g. a placeholder README) stays hidden.
    if (skillDirs.length === 0) continue

    for (const skillDir of skillDirs) {
      const raw = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8")
      const { data } = parseSkillFile(raw)
      const slug = path.basename(skillDir)
      const repoPath = path
        .join("11ai", "v0", path.relative(root, skillDir))
        .split(path.sep)
        .join("/")
      skills.push({
        slug,
        name: typeof data.name === "string" ? data.name : slug,
        description:
          typeof data.description === "string" ? data.description.trim() : "",
        groupSlug: group.slug,
        groupTitle: group.title,
        repoPath,
        githubUrl: `${GITHUB_REPO_URL}/tree/main/${repoPath}`,
      })
    }

    groups.push({
      slug: group.slug,
      dir: group.dir,
      title: group.title,
      tagline: group.tagline,
      githubUrl: `${GITHUB_REPO_URL}/tree/main/11ai/v0/${group.dir}`,
      skillCount: skillDirs.length,
    })
  }

  return { skills, groups }
}

let cache: { skills: Skill[]; groups: SkillGroup[] } | null = null

function loaded() {
  cache ??= loadAllSkills()
  return cache
}

export function getGroups(): SkillGroup[] {
  return loaded().groups
}

export function getGroup(slug: string): SkillGroup | undefined {
  return loaded().groups.find((g) => g.slug === slug)
}

export function getSkills(): Skill[] {
  return loaded().skills
}

export function getSkillsByGroup(groupSlug: string): Skill[] {
  return loaded().skills.filter((s) => s.groupSlug === groupSlug)
}

export function getSkill(slug: string): Skill | undefined {
  return loaded().skills.find((s) => s.slug === slug)
}

/** Full SKILL.md body (frontmatter stripped) for the detail page. */
export function getSkillContent(slug: string): string {
  const skill = getSkill(slug)
  if (!skill) throw new Error(`Unknown skill: ${slug}`)
  const root = resolveSkillsRoot()
  const filePath = path.join(
    root,
    skill.repoPath.replace(/^11ai\/v0\//, "").split("/").join(path.sep),
    "SKILL.md",
  )
  const { content } = parseSkillFile(fs.readFileSync(filePath, "utf8"))
  return content.trim()
}

export function getSkillCount(): number {
  return loaded().skills.length
}

export function getPackageVersion(): string {
  const root = resolveSkillsRoot()
  const pkgPath = path.join(root, "..", "..", "package.json")
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
    return typeof pkg.version === "string" ? pkg.version : ""
  } catch {
    return ""
  }
}
