import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-32 text-center sm:px-6">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        That page doesn&apos;t exist
      </h1>
      <p className="max-w-md text-muted-foreground">
        The skill or group you&apos;re looking for may have been renamed.
        Browse the catalog to find it.
      </p>
      <Link href="/skills" className={cn(buttonVariants())}>
        Browse all skills
      </Link>
    </div>
  )
}
