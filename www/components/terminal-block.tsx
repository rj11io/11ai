import { CopyButton } from "@/components/copy-button"
import { cn } from "@/lib/utils"

/** A terminal-styled command line with window dots and a copy button. */
export function TerminalBlock({
  command,
  title = "terminal",
  className,
}: {
  command: string
  title?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-yellow-400/80" />
        <span className="size-2.5 rounded-full bg-green-400/80" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <code className="min-w-0 overflow-x-auto font-mono text-sm whitespace-nowrap">
          <span className="text-emerald-500 select-none">$ </span>
          {command}
        </code>
        <CopyButton text={command} />
      </div>
    </div>
  )
}
