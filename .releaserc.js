module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        npmPublish: true,
        tarballDir: "dist",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: [
          "package.json",
          "CHANGELOG.md",
          "v0/plugins/*/.claude-plugin/plugin.json",
          "v0/plugins/*/.codex-plugin/plugin.json",
        ],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          { path: "dist/*.tgz", label: "npm package tarball" },
          { path: "CHANGELOG.md", label: "Changelog" },
        ],
      },
    ],
  ],
};
