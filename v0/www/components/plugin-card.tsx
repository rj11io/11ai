import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Plugin } from "@/lib/skills"

export function PluginCard({ plugin }: { plugin: Plugin }) {
  return (
    <Link
      href={`/plugins/${plugin.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-6 transition-colors hover:border-foreground/25"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{plugin.title}</h3>
        <Badge variant="outline" className="font-mono">
          {plugin.skillCount} {plugin.skillCount === 1 ? "skill" : "skills"}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {plugin.tagline}
      </p>
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">
        Explore plugin
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
