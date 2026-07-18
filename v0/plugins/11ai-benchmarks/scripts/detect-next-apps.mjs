#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

const [rootArg] = process.argv.slice(2)
if (!rootArg) {
  console.error("usage: node detect-next-apps.mjs <benchmark-tree-root>")
  process.exit(2)
}
const root = path.resolve(rootArg)
const ignored = new Set([".git", ".next", "node_modules", "dist", "coverage"])
const apps = []

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(target)
    else if (entry.name === "package.json") inspect(target)
  }
}

function inspect(packageFile) {
  let manifest
  try {
    manifest = JSON.parse(readFileSync(packageFile, "utf8"))
  } catch {
    return
  }
  const dependencies = { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) }
  if (!dependencies.next) return
  const dir = path.dirname(packageFile)
  const configs = ["next.config.js", "next.config.mjs", "next.config.cjs", "next.config.ts"].filter((name) => existsSync(path.join(dir, name)))
  const router = existsSync(path.join(dir, "app")) ? "app" : existsSync(path.join(dir, "pages")) ? "pages" : "unknown"
  const packageManager = existsSync(path.join(dir, "pnpm-lock.yaml")) ? "pnpm" : existsSync(path.join(dir, "yarn.lock")) ? "yarn" : existsSync(path.join(dir, "bun.lock")) || existsSync(path.join(dir, "bun.lockb")) ? "bun" : "npm"
  apps.push({
    appId: path.relative(root, dir).split(path.sep).join("/") || ".",
    path: path.relative(root, dir).split(path.sep).join("/") || ".",
    packagePath: path.relative(root, packageFile).split(path.sep).join("/"),
    nextVersion: dependencies.next,
    router,
    configs,
    packageManager,
  })
}

walk(root)
apps.sort((a, b) => a.path.localeCompare(b.path))
console.log(JSON.stringify({ root, count: apps.length, apps }, null, 2))
