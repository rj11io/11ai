import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  FileText,
  Terminal,
} from "lucide-react"

import { GithubIcon } from "@/components/github-icon"
import { PluginCard } from "@/components/plugin-card"
import { TerminalBlock } from "@/components/terminal-block"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  GITHUB_REPO_URL,
  INSTALL_COMMAND,
  getPackageVersion,
  getPlugins,
  getSkill,
  getSkillCount,
} from "@/lib/skills"
import { cn } from "@/lib/utils"

export default function Page() {
  const plugins = getPlugins()
  const skillCount = getSkillCount()
  const version = getPackageVersion()
  const exampleSkill = getSkill("11ai-roast")

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-8 py-20 text-center sm:py-28">
        <Badge variant="outline" className="h-6 gap-2 px-3 font-mono">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {version ? `v${version} · ` : ""}
          {skillCount} skills · Apache-2.0
        </Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Reusable skills for AI coding agents
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-balance text-muted-foreground">
          Open-source playbooks your agent installs once and follows by name —
          for building chat products, automating scheduled work, running
          benchmarks, and keeping codebases clean.
        </p>
        <TerminalBlock command={INSTALL_COMMAND} className="w-full max-w-xl text-left" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/skills"
            className={cn(buttonVariants({ size: "lg" }), "px-5")}
          >
            Browse all skills
            <ArrowRight data-icon="inline-end" />
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-5")}
          >
            <GithubIcon data-icon="inline-start" />
            View source on GitHub
          </a>
        </div>
      </section>

      {/* ── What is a skill ──────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-border/60 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                How it works
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                What is a skill?
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                A skill is a folder of markdown instructions your coding agent
                reads before doing a job. Each one is led by a{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                  SKILL.md
                </code>{" "}
                file: a name, a description of when to use it, and a detailed,
                battle-tested playbook. No runtime, no lock-in — just knowledge
                your agent can follow.
              </p>
            </div>
            <ol className="space-y-5">
              <Step
                number={1}
                icon={<Terminal className="size-4" />}
                title="Install the collection"
                body={
                  <>
                    Run{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {INSTALL_COMMAND}
                    </code>{" "}
                    and pick the skills you want. Works with any agent that
                    supports the skills format.
                  </>
                }
              />
              <Step
                number={2}
                icon={<FileText className="size-4" />}
                title="Ask your agent by name"
                body={
                  <>
                    Say{" "}
                    <em>
                      &ldquo;Use 11ai-ai-chat-stack to add a chat surface to
                      this app&rdquo;
                    </em>{" "}
                    — the agent loads the matching playbook.
                  </>
                }
              />
              <Step
                number={3}
                icon={<BookOpen className="size-4" />}
                title="The agent follows the playbook"
                body="It applies the architecture, patterns, and checklists from the skill instead of improvising from scratch."
              />
            </ol>
          </div>

          {exampleSkill ? (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/60 bg-muted/50 px-4 py-2.5">
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {exampleSkill.repoPath}/SKILL.md
                </span>
              </div>
              <div className="space-y-3 p-5 font-mono text-xs leading-relaxed sm:text-sm">
                <p className="text-muted-foreground">---</p>
                <p>
                  <span className="text-sky-600 dark:text-sky-400">name:</span>{" "}
                  {exampleSkill.name}
                </p>
                <p className="text-muted-foreground">
                  <span className="text-sky-600 dark:text-sky-400">
                    description:
                  </span>{" "}
                  <span className="line-clamp-6 inline">
                    {exampleSkill.description}
                  </span>
                </p>
                <p className="text-muted-foreground">---</p>
                <p className="pt-1 font-semibold"># 11ai Roast</p>
                <p className="text-muted-foreground">
                  Blunt, prioritized, read-only critique of any work product…
                </p>
                <Link
                  href={`/skills/${exampleSkill.slug}`}
                  className="inline-flex items-center gap-1 pt-1 font-sans text-sm font-medium text-foreground hover:underline"
                >
                  Read the full skill <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Plugins ──────────────────────────────────────────── */}
      <section id="plugins" className="scroll-mt-20 border-t border-border/60 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Plugins
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              {skillCount} skills, {plugins.length} plugins
            </h2>
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              Every skill belongs to a plugin. Start with the plugin that
              matches your job, then drill into the skill you need.
            </p>
          </div>
          <Link
            href="/plugins"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Browse all plugins
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <PluginCard key={plugin.slug} plugin={plugin} />
          ))}
        </div>
      </section>

      {/* ── Ledger + Conductor + Routine ─────────────────────── */}
      <section className="border-t border-border/60 py-20">
        <div className="mb-12 space-y-3">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Concept spotlight
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Ledger + Conductor + Routine
          </h2>
          <p className="max-w-2xl leading-relaxed text-muted-foreground">
            The agent-automation plugin is built on one pattern for autonomous
            agents that ship real, verifiable work on a schedule. Three pieces,
            one loop.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <PatternCard
            icon={<FileText className="size-5" />}
            title="Ledger"
            body="One JSON file as the single source of truth: configuration plus work items, each with a status and a milestone plan. Read first, write last."
          />
          <PatternCard
            icon={<BookOpen className="size-5" />}
            title="Conductor"
            body="One spec the agent re-reads every run: the state machine, the per-tick algorithm, a depth bar, a review rule, and a quality gate."
          />
          <PatternCard
            icon={<CalendarClock className="size-5" />}
            title="Routine"
            body="A scheduler that fires a provider-agnostic headless agent CLI with a thin trigger prompt and a single-instance lock."
          />
        </div>

        <div className="mt-6 rounded-xl border border-border/80 bg-card p-6">
          <p className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Each run (&ldquo;tick&rdquo;) is a pure function
          </p>
          <p className="overflow-x-auto font-mono text-sm whitespace-nowrap sm:text-base">
            <span className="text-muted-foreground">(</span>ledger, conductor
            <span className="text-muted-foreground">)</span>
            <span className="mx-2 text-emerald-500">→</span>
            one milestone
            <span className="mx-2 text-emerald-500">→</span>
            new ledger
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A milestone is a complete vertical slice — failing checks,
            implementation, one evidence-backed review, and a quality gate —
            shipped in a single run. Green typecheck and lint alone never
            finish an item; automated probes must prove a stranger could
            actually use the output.
          </p>
          <Link
            href="/plugins/agent-automation"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Explore the agent-automation skills{" "}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* ── Providers ────────────────────────────────────────── */}
      <section className="border-t border-border/60 py-14">
        <p className="mb-6 text-center font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Provider-agnostic · works with your agent
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-sm text-muted-foreground">
          {["Claude Code", "Codex", "Gemini CLI", "Cursor", "aider", "opencode"].map(
            (name) => (
              <span key={name}>{name}</span>
            ),
          )}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="border-t border-border/60 py-20">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/80 bg-card px-6 py-14 text-center">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance">
            Give your agent a head start
          </h2>
          <p className="max-w-xl leading-relaxed text-balance text-muted-foreground">
            One command installs the whole collection. Everything is plain
            markdown, versioned on npm, and open source on GitHub.
          </p>
          <TerminalBlock command={INSTALL_COMMAND} className="w-full max-w-xl text-left" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/skills" className={cn(buttonVariants({ size: "lg" }), "px-5")}>
              Explore the catalog
              <ArrowRight data-icon="inline-end" />
            </Link>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-5")}
            >
              <GithubIcon data-icon="inline-start" />
              Star on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

function Step({
  number,
  icon,
  title,
  body,
}: {
  number: number
  icon: React.ReactNode
  title: string
  body: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card font-mono text-sm text-muted-foreground">
        {number}
      </span>
      <div className="space-y-1">
        <p className="flex items-center gap-2 font-medium">
          {icon}
          {title}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  )
}

function PatternCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
        {icon}
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}
