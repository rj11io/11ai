import type { Metadata } from "next"

import { Catalog } from "@/components/catalog"
import { getPlugins, getSkills } from "@/lib/skills"

export const metadata: Metadata = {
  title: "Skill catalog",
  description:
    "Browse every 11ai skill: search by name or purpose and filter by plugin.",
}

export default function SkillsPage() {
  const skills = getSkills()
  const plugins = getPlugins()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
      <div className="mb-10 space-y-3">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Catalog
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          All {skills.length} skills
        </h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          Search by name or purpose, or filter by plugin. Every card links to
          the full playbook and its source on GitHub.
        </p>
      </div>
      <Catalog skills={skills} plugins={plugins} />
    </div>
  )
}
