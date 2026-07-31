---
name: 11ai-operator-aws-cli-v2-native-skills
description: "Discover, compatibility-check, install, update, or explain AWS's first-party Agent Toolkit skills for AWS CLI v2. Use when asked about AWS native skills, Agent Toolkit for AWS, aws agent-toolkit, or whether installed AWS skills match this AWS CLI v2 operator."
---

# AWS CLI v2 native skills

Version baseline: AWS CLI v2, using the current stable v2 patch and the first-party Agent Toolkit for AWS skill collection. AWS CLI v1 is outside this plugin's scope.

## Inspect before installing

1. Run `aws --version` and require an `aws-cli/2.*` result.
2. Resolve only the CLI installation and supported agent destinations; do not read or print credential files.
3. Inspect existing AWS skills, source metadata, and recorded revisions.
4. Read the current [Agent Toolkit skills documentation](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/skills.html) and first-party [`aws/agent-toolkit-for-aws`](https://github.com/aws/agent-toolkit-for-aws) repository.
5. Use `aws help` and live v2 command help for service syntax because AWS service models update independently of this plugin.

## Enforce CLI v2 compatibility

- Reject AWS CLI v1-only installers, flags, credential behavior, or examples.
- Confirm the selected native skill documents an AWS CLI fallback or current Agent Toolkit behavior compatible with CLI v2.
- If an installed v2 patch lacks `aws agent-toolkit`, use the documented `npx skills` path rather than silently changing the CLI.
- A native skill may describe AWS MCP tools, but MCP availability is optional; its CLI fallback must still preserve account, role, region, and approval checks.
- Installing a skill never authorizes authenticated AWS calls or infrastructure changes.

## Install only on request

Use the AWS CLI's guided installer when the installed v2 release supports it:

```sh
aws configure agent-toolkit
```

Or use the documented first-party collection:

```sh
npx skills add aws/agent-toolkit-for-aws/skills
```

Let the user select individual domain skills and agent scope. Do not install the entire catalog, overwrite local skills, configure credentials, start an MCP server, or authenticate as a side effect without explicit approval.

## Verify

Report the AWS CLI v2 patch, source, selected skills, destination and scope, revision or release, whether each skill supports CLI operation without MCP, and the compatibility result. If compatibility cannot be proved, leave the existing installation unchanged and name the missing evidence.
