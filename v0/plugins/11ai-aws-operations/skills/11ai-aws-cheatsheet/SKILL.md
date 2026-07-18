---
name: 11ai-aws-cheatsheet
description: "Answer common AWS CLI questions with concise, safety-aware commands for identity, regions, S3, EC2, Lambda, ECS, ECR, CloudWatch, IAM, and CloudFormation. Use when the user wants a quick reference, flag explanation, or command translation."
---

# AWS CLI cheatsheet

Use [references/cheatsheet.md](references/cheatsheet.md) as the first lookup. Answer the specific question, not the entire reference. Give the smallest useful command, explain the important flag, and state whether it only reads state or changes it.

## Answering questions

1. Identify the service, resource, profile, region, and whether the request is read-only or mutating.
2. Prefer an explicit `--profile PROFILE --region REGION` when the target is known; do not invent either value.
3. Use `--output json`, `--query`, and `--no-cli-pager` when they improve reliable inspection.
4. For writes or deletes, show the exact scope, blast radius, and a dry-run or preview where available before suggesting execution.
5. If the user supplies an error rather than a lookup question, hand off to `11ai-aws-troubleshooting` and preserve the exact error code and request ID.

## Response shape

```text
Command: <smallest useful command>
What it does: <plain-language explanation>
State impact: read-only | local credential state | AWS mutation
Watch for: <one prerequisite or danger>
```

For service-specific questions, use the relevant operation skill when the answer needs a workflow rather than one command.
