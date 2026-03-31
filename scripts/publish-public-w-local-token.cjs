"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const envFile = path.join(process.cwd(), ".env");

if (!fs.existsSync(envFile)) {
  console.error(".env file not found at project root");
  process.exit(1);
}

const envText = fs.readFileSync(envFile, "utf8");
const tokenLine = envText
  .split(/\r?\n/)
  .find((line) => line.startsWith("NPM_TOKEN="));

if (!tokenLine) {
  console.error("NPM_TOKEN not found in .env");
  process.exit(1);
}

let token = tokenLine.slice("NPM_TOKEN=".length).trim();

if (
  (token.startsWith("\"") && token.endsWith("\"")) ||
  (token.startsWith("'") && token.endsWith("'"))
) {
  token = token.slice(1, -1);
}

if (!token) {
  console.error("NPM_TOKEN is empty");
  process.exit(1);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const tempNpmrc = path.join(process.cwd(), ".npmrc.codex-publish-temp");

fs.writeFileSync(
  tempNpmrc,
  `//registry.npmjs.org/:_authToken=${token}\n`,
  "utf8"
);

const result = spawnSync(npmCommand, ["publish", "--access", "public"], {
  stdio: "inherit",
  env: {
    ...process.env,
    npm_config_userconfig: tempNpmrc
  },
  shell: process.platform === "win32"
});

if (result.error) {
  console.error(result.error.message);
}

try {
  fs.rmSync(tempNpmrc, { force: true });
} catch (error) {
  console.error(`Failed to remove temporary npm config: ${error.message}`);
}

process.exit(result.status ?? 1);
