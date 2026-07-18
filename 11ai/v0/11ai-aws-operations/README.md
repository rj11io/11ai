# 11ai AWS operations

Eleven standalone, AWS CLI-first skills for common cloud operations. The plugin is read-first and context-aware: identify the account, role, region, and resource before making a change, and require explicit approval for destructive or externally visible actions.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-aws-environment`](./11ai-aws-environment/SKILL.md) | Inspecting profiles, credentials, identity, region, SSO, and target context |
| [`11ai-aws-s3`](./11ai-aws-s3/SKILL.md) | Listing buckets, inspecting objects, copying data, syncing paths, and checking bucket safety |
| [`11ai-aws-ec2`](./11ai-aws-ec2/SKILL.md) | Inspecting instances, status, volumes, tags, and security groups; carefully changing instance state |
| [`11ai-aws-lambda`](./11ai-aws-lambda/SKILL.md) | Inspecting, invoking, updating, publishing, and diagnosing Lambda functions |
| [`11ai-aws-ecs`](./11ai-aws-ecs/SKILL.md) | Inspecting clusters, services, tasks, deployments, and ECS execution behavior |
| [`11ai-aws-ecr`](./11ai-aws-ecr/SKILL.md) | Inspecting repositories and images, authenticating Docker, and managing image tags |
| [`11ai-aws-cloudwatch`](./11ai-aws-cloudwatch/SKILL.md) | Querying logs, metrics, alarms, dashboards, and operational time windows |
| [`11ai-aws-iam`](./11ai-aws-iam/SKILL.md) | Inspecting users, roles, policies, permission boundaries, and simulated access |
| [`11ai-aws-cloudformation`](./11ai-aws-cloudformation/SKILL.md) | Validating templates and inspecting stacks, events, resources, and change sets |
| [`11ai-aws-cheatsheet`](./11ai-aws-cheatsheet/SKILL.md) | Answering quick AWS CLI command, flag, output, and safety questions |
| [`11ai-aws-troubleshooting`](./11ai-aws-troubleshooting/SKILL.md) | Diagnosing AWS CLI and service failures from reproducible evidence |

## Safety model

- Resolve the target profile, account, role, region, and resource identifiers before acting.
- Start with read-only commands and preserve exact error codes, messages, and request IDs.
- Treat `delete`, `terminate`, `destroy`, `rm`, `prune`, policy changes, public access, credential creation, and production deploys as high-impact.
- Show the exact mutating command, scope, and expected impact before executing it unless the user has already given clear authorization.
- Never print credentials, tokens, secret values, private keys, signed URLs, or sensitive environment variables.
- Verify the original objective after a change; do not infer success from a zero exit code alone.

## Suggested v0.1 additions

These are deliberately separate candidates rather than hidden scope in v0:

- `11ai-aws-ssm` for Session Manager, Run Command, and port forwarding
- `11ai-aws-rds` for instances, snapshots, parameter groups, and maintenance state
- `11ai-aws-route53` for hosted zones, records, health checks, and DNS diagnosis
- `11ai-aws-vpc` for subnets, routes, security groups, network ACLs, and reachability evidence
- `11ai-aws-secrets` for Secrets Manager and SSM Parameter Store without exposing values
- `11ai-aws-costs` for Cost Explorer, budgets, and spend triage
- `11ai-aws-cloudtrail` for audit-event lookup and change attribution
- `11ai-aws-deployments` for a provider-neutral deployment and rollback workflow

Keep each addition standalone and service-focused. A future orchestration skill can compose them, but should not replace the narrow skills.
