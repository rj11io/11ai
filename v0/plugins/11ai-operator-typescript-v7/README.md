# 11ai TypeScript v7 operator

Ten standalone skills for compiler configuration, type modeling, narrowing, generics, module resolution, declarations, and migrations, with read-first checks around public contracts, compatibility, generated output, and state changes.

Version baseline: TypeScript 7.0 native compiler, with TypeScript 6 retained only where a programmatic compiler API is required.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-typescript-v7-cheatsheet`](./skills/11ai-operator-typescript-v7-cheatsheet/SKILL.md) | Quick commands and patterns |
| [`11ai-operator-typescript-v7-environment`](./skills/11ai-operator-typescript-v7-environment/SKILL.md) | Read-only runtime and project inspection |
| [`11ai-operator-typescript-v7-setup`](./skills/11ai-operator-typescript-v7-setup/SKILL.md) | Project-local installation and configuration |
| [`11ai-operator-typescript-v7-integrations`](./skills/11ai-operator-typescript-v7-integrations/SKILL.md) | Build, test, CI, runtime, and deployment seams |
| [`11ai-operator-typescript-v7-troubleshooting`](./skills/11ai-operator-typescript-v7-troubleshooting/SKILL.md) | Evidence-led failure diagnosis |
| [`11ai-operator-typescript-v7-compiler-config`](./skills/11ai-operator-typescript-v7-compiler-config/SKILL.md) | TSConfig target, libs, strictness, emit, paths, and project references |
| [`11ai-operator-typescript-v7-type-modeling`](./skills/11ai-operator-typescript-v7-type-modeling/SKILL.md) | Unions, intersections, object types, immutability, and API contracts |
| [`11ai-operator-typescript-v7-narrowing-generics`](./skills/11ai-operator-typescript-v7-narrowing-generics/SKILL.md) | Control-flow narrowing, predicates, generics, constraints, and inference |
| [`11ai-operator-typescript-v7-modules-packages`](./skills/11ai-operator-typescript-v7-modules-packages/SKILL.md) | Resolution, exports, imports, ESM/CJS interop, and package types |
| [`11ai-operator-typescript-v7-migrations-declarations`](./skills/11ai-operator-typescript-v7-migrations-declarations/SKILL.md) | JS-to-TS migration, declaration files, allowJs, checkJs, and library typing |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect versions, configuration, source ownership, module mode, and target configured JavaScript runtimes and package consumers before editing.

Never guess runtime target, module and resolver mode, strictness, library set, emitted output, or declaration consumers. Preserve the package manager, lockfile, and public contracts.

Ask before changing compiler semantics, public types, module resolution, declaration output, project references, or package exports. Preview callers, exports, generated output, and deployment effects.

Never print or commit environment values, source-map source content, generated credentials, or user data embedded in fixtures. Count files and inspect diffs before codemods, bulk renames, formatting sweeps, dependency upgrades, or output replacement.
