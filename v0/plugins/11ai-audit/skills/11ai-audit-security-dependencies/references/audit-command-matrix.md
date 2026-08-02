# Dependency audit command matrix

Use the commands that match files discovered in the target project. Run them as
read-only audits. Do not run `audit fix`, update/install commands, package
executables, lifecycle scripts, or application startup code while investigating.

| Evidence | Preferred audit | Notes |
| --- | --- | --- |
| `package-lock.json` or `npm-shrinkwrap.json` | `npm audit --json` | Run once with dev dependencies included and, when production exposure matters, once with `--omit=dev`. Use `--package-lock-only` when you must avoid consulting the installed tree. |
| `pnpm-lock.yaml` | `pnpm audit --json` | Do not run `pnpm install` to make the lockfile complete. |
| `yarn.lock` | `yarn npm audit --json` or the project’s supported Yarn audit command | Record the Yarn version and whether the command supports the lockfile format. |
| Python requirements or `pyproject.toml` | `pip-audit -r requirements.txt -f json` or `pip-audit -f json` | Use the project interpreter/venv when known. `pip-audit` may need network access; it does not need to install packages. |
| `Cargo.lock` | `cargo audit --json` | Prefer the lockfile-only audit. Do not build or run binaries. |
| `go.mod` | `govulncheck -json ./...` | This may load the module graph. Treat unavailable tool/module data as an explicit coverage gap. |
| `Gemfile.lock` | `bundle audit check --format json` | Do not run `bundle install` during a scan. |

## Evidence handling

Capture raw JSON or command output as temporary evidence outside the project or
in an ignored temporary directory. Preserve the command, tool version, date,
lockfile path, exit code, and whether the result includes development
dependencies. A non-zero audit exit code can mean findings, not a failed scan;
parse the output before calling the command unavailable.

If an audit tool is missing, report that fact and continue with the remaining
read-only checks. Never treat “tool not installed,” “offline,” “private
registry unavailable,” or “no lockfile” as “no vulnerabilities.”
