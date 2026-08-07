import { marked, type Token } from "marked"

import { GITHUB_REPO_URL, getSkills } from "./skills"

/** repoPath of a skill directory -> its URL slug, for internal cross-links. */
let slugByRepoPath: Map<string, string> | null = null

function skillSlugForPath(skillDir: string): string | undefined {
  slugByRepoPath ??= new Map(getSkills().map((s) => [s.repoPath, s.slug]))
  return slugByRepoPath.get(skillDir)
}

/** Resolve `href` against the directory holding the skill's SKILL.md. */
function resolveRepoTarget(repoPath: string, href: string) {
  const url = new URL(href, `file:///${repoPath}/`)
  return {
    path: decodeURIComponent(url.pathname).replace(/^\//, ""),
    hash: url.hash,
  }
}

function rewriteHref(repoPath: string, href: string): string {
  const { path: target, hash } = resolveRepoTarget(repoPath, href)
  if (target.endsWith("/SKILL.md")) {
    const slug = skillSlugForPath(target.slice(0, -"/SKILL.md".length))
    if (slug) return `/skills/${slug}`
  }
  const kind = target.endsWith("/") ? "tree" : "blob"
  return `${GITHUB_REPO_URL}/${kind}/main/${target}${hash}`
}

/**
 * Render trusted repository markdown (SKILL.md files) to HTML at build time.
 * Content comes from this repo only, so no sanitization pass is needed.
 *
 * When `repoPath` (the skill's directory from the repo root) is given,
 * relative links are rewritten: another skill's SKILL.md becomes its
 * /skills/<slug> page, everything else becomes a GitHub blob (file) or
 * tree (directory) URL. Absolute, mailto, and same-page anchor links pass
 * through untouched.
 */
export function renderMarkdown(markdown: string, repoPath?: string): string {
  const walkTokens = repoPath
    ? (token: Token) => {
        if (token.type !== "link") return
        if (/^(https?:|mailto:|#)/i.test(token.href)) return
        token.href = rewriteHref(repoPath, token.href)
      }
    : undefined
  return marked.parse(markdown, {
    gfm: true,
    async: false,
    walkTokens,
  }) as string
}
