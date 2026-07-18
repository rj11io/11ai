#!/usr/bin/env node
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { relative, resolve, sep } from "node:path"

const args = process.argv.slice(2)
let root = process.cwd()
if (args[0] === "--root") {
  if (!args[1]) throw new Error("--root requires a directory")
  args.shift()
  root = resolve(args.shift())
}
const files = args.map((file) => resolve(file)).sort()
if (!files.length) {
  console.error("usage: node hash-inputs.mjs [--root dir] <file> [file ...]")
  process.exit(2)
}

const hash = createHash("sha256")
for (const file of files) {
  const bytes = readFileSync(file)
  const label = relative(root, file).split(sep).join("/")
  if (label === ".." || label.startsWith("../")) throw new Error(`${file} is outside hash root ${root}`)
  const pathBytes = Buffer.from(label)
  hash.update(Buffer.from(String(pathBytes.length)))
  hash.update(Buffer.from([0]))
  hash.update(pathBytes)
  hash.update(Buffer.from([0]))
  hash.update(Buffer.from(String(bytes.length)))
  hash.update(Buffer.from([0]))
  hash.update(bytes)
  hash.update(Buffer.from([0]))
}
process.stdout.write(`${hash.digest("hex")}\n`)
