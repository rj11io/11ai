#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
const pluginsRoot = path.join(root, "v0", "plugins")
let updated = 0

for (const entry of fs.readdirSync(pluginsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  for (const manifestDir of [".claude-plugin", ".codex-plugin"]) {
    const file = path.join(pluginsRoot, entry.name, manifestDir, "plugin.json")
    if (!fs.existsSync(file)) continue

    const manifest = JSON.parse(fs.readFileSync(file, "utf8"))
    const normalized = {}
    for (const [key, value] of Object.entries(manifest)) {
      if (key === "version") continue
      normalized[key] = value
      if (key === "name") normalized.version = packageJson.version
    }
    if (!("name" in normalized)) {
      throw new Error(`${path.relative(root, file)} is missing its plugin name`)
    }
    fs.writeFileSync(file, `${JSON.stringify(normalized, null, 2)}\n`)
    updated += 1
  }
}

if (updated === 0) throw new Error("No plugin manifests found")
console.log(`Synchronized ${updated} plugin manifests to ${packageJson.version}.`)
