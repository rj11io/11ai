import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { GithubIcon } from "@/components/github-icon"
import { SkillCard } from "@/components/skill-card"
import { TerminalBlock } from "@/components/terminal-block"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getPlugin, getPlugins, getSkillsByPlugin } from "@/lib/skills"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return getPlugins().map((plugin) => ({ slug: plugin.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const plugin = getPlugin(slug)
  if (!plugin) return {}
  return {
    title: `${plugin.title} skills`,
    description: plugin.tagline,
  }
}

export default async function PluginPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const plugin = getPlugin(slug)
  if (!plugin) notFound()

  const skills = getSkillsByPlugin(plugin.slug)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <Link
        href="/skills"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> All skills
      </Link>

      <div className="mb-10 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {plugin.title}
          </h1>
          <Badge variant="outline" className="font-mono">
            {plugin.skillCount} {plugin.skillCount === 1 ? "skill" : "skills"}
          </Badge>
        </div>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          {plugin.tagline}
        </p>
        <a
          href={plugin.githubUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <GithubIcon data-icon="inline-start" />
          View this plugin on GitHub
        </a>
      </div>

      <TerminalBlock
        command={`npx skills add rj11io/11ai ${skills.map((skill) => `--skill ${skill.name}`).join(" ")}`}
        className="mb-12"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <SkillCard key={skill.slug} skill={skill} showPlugin={false} />
        ))}
      </div>
    </div>
  )
}
