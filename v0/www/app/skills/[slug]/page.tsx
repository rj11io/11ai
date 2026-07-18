import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ChevronRight, Sparkles } from "lucide-react"

import { CopyButton } from "@/components/copy-button"
import { GithubIcon } from "@/components/github-icon"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { renderMarkdown } from "@/lib/markdown"
import { getSkill, getSkillContent, getSkills } from "@/lib/skills"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return getSkills().map((skill) => ({ slug: skill.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const skill = getSkill(slug)
  if (!skill) return {}
  return {
    title: skill.name,
    description: skill.description.slice(0, 160),
  }
}

export default async function SkillPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const skill = getSkill(slug)
  if (!skill) notFound()

  const html = renderMarkdown(getSkillContent(skill.slug))
  const tryPrompt = `Use ${skill.name} for this task.`

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/skills" className="hover:text-foreground">
          Skills
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/plugins/${skill.pluginSlug}`}
          className="hover:text-foreground"
        >
          {skill.pluginTitle}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-mono text-foreground">{skill.slug}</span>
      </nav>

      {/* Header */}
      <div className="mb-10 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
            {skill.name}
          </h1>
          <Badge variant="outline" className="font-mono">
            <Link href={`/plugins/${skill.pluginSlug}`}>{skill.pluginTitle}</Link>
          </Badge>
        </div>
        <p className="max-w-3xl leading-relaxed text-muted-foreground">
          {skill.description}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={skill.githubUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <GithubIcon data-icon="inline-start" />
            View source on GitHub
          </a>
          <Link
            href={`/skills/${skill.slug}#playbook`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Jump to the playbook
          </Link>
        </div>
      </div>

      {/* Try it */}
      <div className="mb-12 rounded-xl border border-border/80 bg-card p-5">
        <p className="mb-3 flex items-center gap-2 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          <Sparkles className="size-3.5" /> Try it — say this to your agent
        </p>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-4 py-3">
          <code className="min-w-0 overflow-x-auto font-mono text-sm whitespace-nowrap">
            {tryPrompt}
          </code>
          <CopyButton text={tryPrompt} />
        </div>
      </div>

      {/* Playbook */}
      <div id="playbook" className="scroll-mt-20">
        <p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          The full playbook · {skill.repoPath}/SKILL.md
        </p>
        <article
          className="prose-skill"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* Footer CTA */}
      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-6">
        <div>
          <p className="font-medium">Want the source?</p>
          <p className="text-sm text-muted-foreground">
            This page renders the skill&apos;s markdown straight from the
            repository.
          </p>
        </div>
        <a
          href={skill.githubUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants())}
        >
          <GithubIcon data-icon="inline-start" />
          Open on GitHub
        </a>
      </div>

      <Link
        href={`/plugins/${skill.pluginSlug}`}
        className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> More {skill.pluginTitle} skills
      </Link>
    </div>
  )
}
