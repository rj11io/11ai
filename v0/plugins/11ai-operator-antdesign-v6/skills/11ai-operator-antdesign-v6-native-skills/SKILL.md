---
name: 11ai-operator-antdesign-v6-native-skills
description: "Discover, compatibility-check, install, update, or explain Ant Design's first-party agent skill for Ant Design 6. Use when asked about native Ant Design skills, agent setup, the Ant Design CLI skill, or whether an installed Ant Design skill matches this v6 operator."
---

# Ant Design 6 native skills

Version baseline: Ant Design 6.x (6.4.3 current stable at this review) and the first-party `antd` skill published by `ant-design/ant-design-cli`. The upstream CLI contains metadata for v3 through v6, so select and validate v6 explicitly.

## Inspect before installing

1. Read the package manager files and determine the installed `antd` version.
2. Inspect project and user skill locations supported by the active agent; do not assume one global path.
3. If the first-party skill is already installed, read its `SKILL.md`, source metadata, and any recorded revision before recommending an update.
4. Read the current Ant Design [For Agents](https://ant.design/docs/react/for-agents/) page and the upstream [`antd` skill](https://github.com/ant-design/ant-design-cli/tree/main/skills/antd).

Do not treat `llms.txt`, `design.md`, an MCP server, or a community skill as the native agent skill. They are useful companion resources, but the first-party Agent Skills source is `ant-design/ant-design-cli`.

## Enforce v6 compatibility

- Require the host project to use `antd` 6.x for this operator. If it uses another major, stop and report the mismatch.
- Confirm the upstream skill still documents or queries Ant Design v6 before installing it.
- When using `@ant-design/cli`, pass or infer the installed project version and reject v5 examples or migrations as a v6 implementation baseline.
- Inspect v6 deprecations with `antd lint`, component details with `antd info`, and exact documentation with `antd doc` when the CLI is available.
- Never upgrade `antd`, React, or the native skill merely to make the versions agree unless the user requested that upgrade.

## Install only on request

Use the documented interactive installer from the project root:

```sh
npx skills add ant-design/ant-design-cli
```

Let the user choose the agent and project/user scope. Do not add `--all`, overwrite an existing skill, or install the global `@ant-design/cli` package unless requested. Review the upstream `SKILL.md` and scripts before granting them shell access.

## Verify

After installation:

1. Locate the installed skill and confirm its name is `antd`.
2. Confirm its recorded source is the first-party repository.
3. Re-read its version guidance and prove it exposes v6 documentation.
4. Confirm the active agent discovers the destination directory.
5. Report the source, revision or release when available, destination, scope, Ant Design project version, and compatibility result.

If compatibility cannot be established, leave the existing installation unchanged and explain what evidence is missing.
