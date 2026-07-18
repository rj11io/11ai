---
name: 11ai-aws-environment
description: "Inspect AWS CLI profiles, credentials, identity, region, SSO, and execution context safely. Use when the AWS account, role, region, profile, or CLI setup is unknown or when a command might target the wrong environment."
---

# AWS environment

Establish the execution context before any service operation. Prefer evidence from the active CLI environment over assumptions from project files or profile names.

## Inspect context

Run the smallest relevant read-only checks:

```bash
aws --version
aws configure list
aws configure list-profiles
aws sts get-caller-identity
aws configure get region
aws configure get output
aws sts get-caller-identity --profile PROFILE --region REGION
```

Record the account ID, caller ARN, role or user identity, selected profile, and region. Use `--no-cli-pager` for commands whose output might otherwise block. Prefer `--output json` when another command or `jq` will consume the result.

## Select a target

1. Check explicit user input, repository configuration, environment variables, and the active profile in that order.
2. Treat `AWS_PROFILE`, `AWS_REGION`, `AWS_DEFAULT_REGION`, and `AWS_*` credential variables as relevant context; do not echo their secret values.
3. If a profile or region is ambiguous, stop and ask rather than choosing a production-looking or default target.
4. Re-run `sts get-caller-identity` with the final `--profile` and `--region` before a write.

Use a profile explicitly when the task identifies one:

```bash
aws sts get-caller-identity --profile PROFILE --region REGION
```

Do not read or print `~/.aws/credentials`, access keys, session tokens, private keys, or secret configuration values.

## Diagnose access setup

- **No credentials:** distinguish missing configuration from a shell that did not inherit the intended environment.
- **Expired SSO:** identify the profile and explain that `aws sso login --profile PROFILE` changes authentication state; run it only when requested.
- **Wrong account or role:** compare the caller ARN and account ID with the intended target before continuing.
- **Region mismatch:** verify service availability and resource region; do not assume a global service or default region.
- **Access denied:** preserve the service, action, resource, region, and caller ARN. Hand off to `11ai-aws-iam` for evidence-based permission analysis.

Conclude with the resolved context, checks performed, unresolved ambiguity, and the safest next command.
