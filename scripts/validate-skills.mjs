#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const skillsRoot = path.join(root, "11ai", "v0")
const errors = []

function fail(file, message) {
  errors.push(`${path.relative(root, file)}: ${message}`)
}

function walk(dir, predicate, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(entryPath, predicate, results)
    else if (predicate(entryPath)) results.push(entryPath)
  }
  return results
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (error) {
    fail(file, `invalid JSON (${error.message})`)
    return null
  }
}

function parseSkill(file) {
  const raw = fs.readFileSync(file, "utf8")
  const match = raw.match(
    /^---\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\ndescription: ("(?:\\.|[^"\\])*")\n---\n([\s\S]*)$/,
  )
  if (!match) {
    fail(
      file,
      "frontmatter must contain only a plain name and one JSON-quoted description line (block scalars such as >- are not allowed)",
    )
    return null
  }

  let description
  try {
    description = JSON.parse(match[2])
  } catch (error) {
    fail(file, `description is not a valid JSON-compatible YAML string (${error.message})`)
    return null
  }

  const name = match[1]
  if (name.length > 64) fail(file, "name exceeds 64 characters")
  if (path.basename(path.dirname(file)) !== name) {
    fail(file, `name '${name}' does not match its containing directory`)
  }
  if (!description.trim()) fail(file, "description is empty")
  if (description.length > 1024) fail(file, "description exceeds 1024 characters")
  if (/[<>]/.test(description)) fail(file, "description contains angle brackets")
  if (!match[3].trim()) fail(file, "skill body is empty")

  return { file, dir: path.dirname(file), name, description, raw }
}

function parseOpenAiConfig(skill) {
  const file = path.join(skill.dir, "agents", "openai.yaml")
  if (!fs.existsSync(file)) {
    fail(file, "missing Codex skill metadata")
    return
  }

  const lines = fs.readFileSync(file, "utf8").trimEnd().split("\n")
  if (lines[0] !== "interface:") {
    fail(file, "must start with an interface mapping")
    return
  }

  const allowed = new Set([
    "display_name",
    "short_description",
    "default_prompt",
    "icon_small",
    "icon_large",
    "brand_color",
  ])
  const values = new Map()
  for (const line of lines.slice(1)) {
    const match = line.match(/^  ([a-z_]+): ("(?:\\.|[^"\\])*")$/)
    if (!match) {
      fail(file, `non-canonical or unquoted interface line: ${line}`)
      continue
    }
    const [, key, encoded] = match
    if (!allowed.has(key)) fail(file, `unsupported interface field '${key}'`)
    if (values.has(key)) fail(file, `duplicate interface field '${key}'`)
    try {
      values.set(key, JSON.parse(encoded))
    } catch (error) {
      fail(file, `invalid quoted value for '${key}' (${error.message})`)
    }
  }

  for (const key of ["display_name", "short_description", "default_prompt"]) {
    if (typeof values.get(key) !== "string" || !values.get(key).trim()) {
      fail(file, `missing non-empty interface.${key}`)
    }
  }
  const short = values.get("short_description") || ""
  if (short.length < 25 || short.length > 64) {
    fail(file, `short_description must be 25-64 characters (got ${short.length})`)
  }
  const prompt = values.get("default_prompt") || ""
  if (!prompt.includes(`$${skill.name}`)) {
    fail(file, `default_prompt must mention the exact $${skill.name} skill name`)
  }
  for (const key of ["icon_small", "icon_large"]) {
    const value = values.get(key)
    if (value && !fs.existsSync(path.resolve(skill.dir, value))) {
      fail(file, `${key} points to missing asset '${value}'`)
    }
  }
}

function validateLinks(skill) {
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g
  for (const match of skill.raw.matchAll(linkPattern)) {
    let target = match[1].trim().replace(/^<|>$/g, "")
    if (
      !target ||
      target.startsWith("#") ||
      /^[a-z][a-z0-9+.-]*:/i.test(target) ||
      target === "VIDEO_ID" ||
      /[<>]/.test(target)
    ) {
      continue
    }
    target = target.split("#", 1)[0].split("?", 1)[0]
    try {
      target = decodeURIComponent(target)
    } catch {
      fail(skill.file, `link has invalid URL encoding: '${target}'`)
      continue
    }
    const resolved = path.resolve(skill.dir, target)
    if (!fs.existsSync(resolved)) fail(skill.file, `broken relative link '${target}'`)
  }
}

function validateScripts() {
  const scripts = walk(skillsRoot, (file) => file.includes(`${path.sep}scripts${path.sep}`))
  for (const file of scripts) {
    const extension = path.extname(file)
    let result = null
    if (extension === ".sh") {
      if ((fs.statSync(file).mode & 0o111) === 0) fail(file, "shell script is not executable")
      result = spawnSync("bash", ["-n", file], { encoding: "utf8" })
    } else if ([".js", ".cjs", ".mjs"].includes(extension)) {
      result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" })
    } else if (extension === ".py") {
      result = spawnSync(
        "python3",
        ["-c", "import ast, pathlib, sys; ast.parse(pathlib.Path(sys.argv[1]).read_text())", file],
        { encoding: "utf8" },
      )
    }
    if (result && result.status !== 0) {
      fail(file, `script syntax check failed (${(result.stderr || result.stdout).trim()})`)
    }
  }
}

function validateClaude(plugins, pluginSkills) {
  const packageVersion = readJson(path.join(root, "package.json"))?.version
  const marketplaceFile = path.join(root, ".claude-plugin", "marketplace.json")
  const marketplace = readJson(marketplaceFile)
  const entries = new Map()
  for (const entry of marketplace?.plugins || []) {
    if (!entry || typeof entry.name !== "string") {
      fail(marketplaceFile, "every marketplace plugin must have a name")
      continue
    }
    if (entries.has(entry.name)) fail(marketplaceFile, `duplicate plugin '${entry.name}'`)
    entries.set(entry.name, entry)
  }

  for (const plugin of plugins) {
    const manifestFile = path.join(skillsRoot, plugin, ".claude-plugin", "plugin.json")
    const manifest = readJson(manifestFile)
    if (!manifest) continue
    if (manifest.name !== plugin) fail(manifestFile, `name must be '${plugin}'`)
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) {
      fail(manifestFile, "version must use strict semver")
    } else if (manifest.version !== packageVersion) {
      fail(manifestFile, `version must match package.json (${packageVersion})`)
    }
    const paths = Array.isArray(manifest.skills) ? manifest.skills : [manifest.skills]
    if (paths.some((value) => typeof value !== "string" || !value.startsWith("./"))) {
      fail(manifestFile, "skills must be a './'-relative string or array")
    } else {
      for (const skill of pluginSkills.get(plugin)) {
        const covered = paths.some((value) => {
          const base = path.resolve(path.dirname(manifestFile), "..", value)
          const relative = path.relative(base, skill.dir)
          return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
        })
        if (!covered) fail(manifestFile, `skills paths do not cover '${skill.name}'`)
      }
    }

    const entry = entries.get(plugin)
    const expectedSource = `./11ai/v0/${plugin}`
    if (!entry) fail(marketplaceFile, `missing marketplace entry for '${plugin}'`)
    else if (entry.source !== expectedSource) {
      fail(marketplaceFile, `'${plugin}' source must be '${expectedSource}'`)
    }
  }
  for (const name of entries.keys()) {
    if (!plugins.includes(name)) fail(marketplaceFile, `unknown plugin entry '${name}'`)
  }
}

function validateCatalog(plugins, pluginSkills, skills) {
  const rootReadme = fs.readFileSync(path.join(root, "README.md"), "utf8")
  const countPattern = new RegExp(`${skills.length} skills in ${plugins.length} plugins`)
  if (!countPattern.test(rootReadme)) {
    fail(path.join(root, "README.md"), `catalog must state ${skills.length} skills in ${plugins.length} plugins`)
  }
  for (const plugin of plugins) {
    const readme = path.join(skillsRoot, plugin, "README.md")
    if (!fs.existsSync(readme)) {
      fail(readme, "missing plugin README")
      continue
    }
    const contents = fs.readFileSync(readme, "utf8")
    for (const skill of pluginSkills.get(plugin)) {
      if (!contents.includes(skill.name)) fail(readme, `does not list '${skill.name}'`)
    }
  }
}

function validatePackageConfiguration() {
  const packageFile = path.join(root, "package.json")
  const packageJson = readJson(packageFile)
  if (!packageJson) return
  for (const included of ["11ai", ".claude-plugin"]) {
    if (!packageJson.files?.includes(included)) {
      fail(packageFile, `npm files must include '${included}'`)
    }
  }
  if (packageJson.scripts?.["validate-skills"] !== "node ./scripts/validate-skills.mjs") {
    fail(packageFile, "scripts.validate-skills must run the repository validator")
  }
  if (
    packageJson.scripts?.postversion !==
    "node ./scripts/sync-claude-plugin-versions.mjs && npm run validate-skills"
  ) {
    fail(packageFile, "scripts.postversion must synchronize Claude plugin versions")
  }

  const installCommand = "npx skills add rj11io/11ai --full-depth"
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8")
  if (!readme.includes(installCommand)) {
    fail(path.join(root, "README.md"), `install command must be '${installCommand}'`)
  }
  const siteCatalog = fs.readFileSync(path.join(root, "www", "lib", "skills.ts"), "utf8")
  if (!siteCatalog.includes(`INSTALL_COMMAND = "${installCommand}"`)) {
    fail(path.join(root, "www", "lib", "skills.ts"), "site install command must use --full-depth")
  }
  if (!siteCatalog.includes("must use canonical skill frontmatter")) {
    fail(path.join(root, "www", "lib", "skills.ts"), "site skill parser must reject non-canonical frontmatter")
  }
}

if (!fs.existsSync(skillsRoot)) {
  console.error(`Missing skills root: ${skillsRoot}`)
  process.exit(1)
}

const skillFiles = walk(skillsRoot, (file) => path.basename(file) === "SKILL.md").sort()
const inventorySkills = skillFiles.map((file) => ({
  file,
  dir: path.dirname(file),
  name: path.basename(path.dirname(file)),
}))
const names = new Map()
for (const inventorySkill of inventorySkills) {
  const skill = parseSkill(inventorySkill.file)
  if (!skill) {
    parseOpenAiConfig(inventorySkill)
    validateLinks({
      ...inventorySkill,
      raw: fs.readFileSync(inventorySkill.file, "utf8"),
    })
    continue
  }
  if (names.has(skill.name)) fail(skill.file, `duplicate name also used by ${names.get(skill.name)}`)
  else names.set(skill.name, path.relative(root, skill.file))
  parseOpenAiConfig(skill)
  validateLinks(skill)
}

const plugins = fs
  .readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((plugin) =>
    inventorySkills.some((skill) => skill.dir.startsWith(path.join(skillsRoot, plugin))),
  )
  .sort()
const pluginSkills = new Map(
  plugins.map((plugin) => [
    plugin,
    inventorySkills.filter((skill) => skill.dir.startsWith(path.join(skillsRoot, plugin))),
  ]),
)

validateScripts()
validateClaude(plugins, pluginSkills)
validateCatalog(plugins, pluginSkills, inventorySkills)
validatePackageConfiguration()

const trackedArtifacts = spawnSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .stdout.split("\0")
  .filter((file) => file.endsWith(".DS_Store"))
for (const file of trackedArtifacts) fail(path.join(root, file), "tracked operating-system artifact")

if (errors.length > 0) {
  console.error(`Skill validation failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `Validated ${inventorySkills.length} skills across ${plugins.length} plugins: canonical frontmatter, Codex metadata, Claude packaging, links, scripts, and catalogs.`,
)
