"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { PluginCard } from "@/components/plugin-card"
import { Input } from "@/components/ui/input"
import type { Plugin } from "@/lib/skills"

export function PluginCatalog({ plugins }: { plugins: Plugin[] }) {
  const [query, setQuery] = React.useState("")

  const visible = plugins.filter((plugin) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      plugin.title.toLowerCase().includes(q) ||
      plugin.tagline.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plugins by name or purpose…"
          className="h-10 pl-9 font-mono text-sm"
          aria-label="Search plugins"
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No plugins match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((plugin) => (
            <PluginCard key={plugin.slug} plugin={plugin} />
          ))}
        </div>
      )}
    </div>
  )
}
