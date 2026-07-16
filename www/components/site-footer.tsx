import Link from "next/link"

import { GithubIcon } from "@/components/github-icon"
import {
  GITHUB_REPO_URL,
  INSTALL_COMMAND,
  NPM_URL,
  getPackageVersion,
} from "@/lib/skills"

export function SiteFooter() {
  const version = getPackageVersion()

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3 sm:col-span-2">
          <p className="font-mono text-sm font-semibold">
            <span className="text-muted-foreground">~/</span>11ai
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Reusable skills for AI coding agents. Playbooks your agent reads to
            build chat products, run benchmarks, automate scheduled work, and
            keep codebases clean.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {INSTALL_COMMAND}
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-medium">Explore</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/skills" className="hover:text-foreground">
                Skill catalog
              </Link>
            </li>
            <li>
              <Link href="/plugins" className="hover:text-foreground">
                Plugins
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-foreground">
                How it works
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-medium">Project</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <GithubIcon className="size-3.5" /> GitHub
              </a>
            </li>
            <li>
              <a
                href={NPM_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                npm package
              </a>
            </li>
            <li>
              <a
                href={`${GITHUB_REPO_URL}/blob/main/CHANGELOG.md`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Changelog
              </a>
            </li>
            <li>
              <a
                href={`${GITHUB_REPO_URL}/blob/main/LICENSE`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Apache-2.0 license
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 font-mono text-xs text-muted-foreground sm:px-6">
          <a
            href="https://www.rj11.io/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            © {new Date().getFullYear()} rj11io
          </a>
          {version ? <span>v{version}</span> : null}
        </div>
      </div>
    </footer>
  )
}
