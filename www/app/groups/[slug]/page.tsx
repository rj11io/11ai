import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { GithubIcon } from "@/components/github-icon"
import { SkillCard } from "@/components/skill-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getGroup, getGroups, getSkillsByGroup } from "@/lib/skills"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return getGroups().map((group) => ({ slug: group.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const group = getGroup(slug)
  if (!group) return {}
  return {
    title: `${group.title} skills`,
    description: group.tagline,
  }
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const group = getGroup(slug)
  if (!group) notFound()

  const skills = getSkillsByGroup(group.slug)

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
            {group.title}
          </h1>
          <Badge variant="outline" className="font-mono">
            {group.skillCount} {group.skillCount === 1 ? "skill" : "skills"}
          </Badge>
        </div>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          {group.tagline}
        </p>
        <a
          href={group.githubUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <GithubIcon data-icon="inline-start" />
          View this group on GitHub
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <SkillCard key={skill.slug} skill={skill} showGroup={false} />
        ))}
      </div>
    </div>
  )
}
