import { marked } from "marked"

/**
 * Render trusted repository markdown (SKILL.md files) to HTML at build time.
 * Content comes from this repo only, so no sanitization pass is needed.
 */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { gfm: true, async: false }) as string
}
