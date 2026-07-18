import type { Metadata } from "next"

import { PluginCard } from "@/components/plugin-card"
import { getPlugins, getSkillCount } from "@/lib/skills"

export const metadata: Metadata = {
  title: "Plugins",
  description:
    "Browse every 11ai plugin: workflow-sized skill collections you install and combine.",
}

export default function PluginsPage() {
  const plugins = getPlugins()
  const skillCount = getSkillCount()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <div className="mb-10 space-y-3">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Plugins
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          All {plugins.length} plugins
        </h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          {skillCount} skills, packaged into workflow-sized plugins you can
          install and combine. Start with the plugin that matches your job,
          then drill into the skill you need.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plugins.map((plugin) => (
          <PluginCard key={plugin.slug} plugin={plugin} />
        ))}
      </div>
    </div>
  )
}
