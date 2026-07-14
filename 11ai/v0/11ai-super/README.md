# 11ai Super

Seven long-running skills that synchronize a clean repository, perform a project task repeatedly, verify the result, and stop when material issues are resolved or clearly documented.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-super-bugfixing`](./11ai-super-bugfixing/SKILL.md) | Continuously finding, reproducing, fixing, and verifying software defects until no material bug remains |
| [`11ai-super-creator`](./11ai-super-creator/SKILL.md) | Running any specified repository task through repeated implementation and verification passes to a high-confidence result |
| [`11ai-super-metadata`](./11ai-super-metadata/SKILL.md) | Auditing and fixing project metadata, technical SEO, structured data, and social preview images |
| [`11ai-super-performance`](./11ai-super-performance/SKILL.md) | Measuring, fixing, and repeatedly optimizing project speed and resource efficiency |
| [`11ai-super-readme`](./11ai-super-readme/SKILL.md) | Auditing a repository's README files and repeatedly improving them until they match the code to a high bar |
| [`11ai-super-security`](./11ai-super-security/SKILL.md) | Auditing, fixing, and repeatedly hardening a project's security |
| [`11ai-super-ux`](./11ai-super-ux/SKILL.md) | Auditing and improving usability, accessibility, responsiveness, visual consistency, and interface polish |

## Shared workflow

Run these skills from the Git repository you want to improve. Each one requires a clean worktree, synchronizes the current branch, records a rollback point, and uses repeated implementation, audit, and verification passes instead of stopping after the first fix. They may create a conflict-free merge commit when a branch has diverged from upstream and cannot fast-forward; they abort and report any conflicted merge.

The skills preserve unrelated work and do not commit or push unless the user explicitly requests it. `11ai-super-creator` applies the shared workflow to a user-specified task, `11ai-super-bugfixing` applies it to evidence-backed software defects, `11ai-super-readme` is documentation-only, and the other specialist super skills update the project areas named in their playbooks.
