"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { SkillCard } from "@/components/skill-card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { Plugin, Skill } from "@/lib/skills"
import { cn } from "@/lib/utils"

export function Catalog({
  skills,
  plugins,
  initialPlugin = "all",
}: {
  skills: Skill[]
  plugins: Plugin[]
  initialPlugin?: string
}) {
  const [query, setQuery] = React.useState("")
  const [activePlugin, setActivePlugin] = React.useState(initialPlugin)

  const visible = skills.filter((skill) => {
    if (activePlugin !== "all" && skill.pluginSlug !== activePlugin) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (
      skill.name.toLowerCase().includes(q) ||
      skill.description.toLowerCase().includes(q) ||
      skill.pluginTitle.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills by name or purpose…"
          className="h-10 pl-9 font-mono text-sm"
          aria-label="Search skills"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          count={skills.length}
          active={activePlugin === "all"}
          onClick={() => setActivePlugin("all")}
        />
        {plugins.map((plugin) => (
          <FilterChip
            key={plugin.slug}
            label={plugin.title}
            count={plugin.skillCount}
            active={activePlugin === plugin.slug}
            onClick={() => setActivePlugin(plugin.slug)}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No skills match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {label}
      <Badge
        variant={active ? "secondary" : "outline"}
        className={cn(
          "h-4 px-1.5 font-mono text-[10px]",
          active && "border-transparent bg-background/20 text-background",
        )}
      >
        {count}
      </Badge>
    </button>
  )
}
