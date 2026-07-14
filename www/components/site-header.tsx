import Link from "next/link"

import { GithubIcon } from "@/components/github-icon"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { GITHUB_REPO_URL } from "@/lib/skills"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
          <span className="text-muted-foreground">~/</span>11ai
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/skills"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-foreground",
            )}
          >
            Skills
          </Link>
          <Link
            href="/#groups"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-foreground",
            )}
          >
            Groups
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="11ai on GitHub"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <GithubIcon />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
