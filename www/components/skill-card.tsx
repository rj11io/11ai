import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Skill } from "@/lib/skills"

export function SkillCard({
  skill,
  showPlugin = true,
}: {
  skill: Skill
  showPlugin?: boolean
}) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group flex flex-col gap-2.5 rounded-xl border border-border/80 bg-card p-5 transition-colors hover:border-foreground/25"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-medium [overflow-wrap:anywhere]">
          {skill.name}
        </span>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {skill.description}
      </p>
      {showPlugin ? (
        <Badge variant="outline" className="mt-auto w-fit font-mono">
          {skill.pluginTitle}
        </Badge>
      ) : null}
    </Link>
  )
}
