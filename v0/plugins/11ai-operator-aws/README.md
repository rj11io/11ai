# 11ai AWS operator

Twenty-one standalone, AWS CLI-first skills for common cloud operations. The plugin is read-first and context-aware: identify the account, role, region, and resource before making a change, and require explicit approval for destructive or externally visible actions.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-aws-setup`](./skills/11ai-operator-aws-setup/SKILL.md) | Installing the AWS CLI and configuring profiles, SSO, regions, and role assumption from zero |
| [`11ai-operator-aws-environment`](./skills/11ai-operator-aws-environment/SKILL.md) | Inspecting profiles, credentials, identity, region, SSO, and target context |
| [`11ai-operator-aws-integrations`](./skills/11ai-operator-aws-integrations/SKILL.md) | Connecting AWS to CI pipelines, container registries, infrastructure-as-code, and application runtime configuration |
| [`11ai-operator-aws-s3`](./skills/11ai-operator-aws-s3/SKILL.md) | Listing buckets, inspecting objects, copying data, syncing paths, and checking bucket safety |
| [`11ai-operator-aws-ec2`](./skills/11ai-operator-aws-ec2/SKILL.md) | Inspecting instances, status, volumes, tags, and security groups; carefully changing instance state |
| [`11ai-operator-aws-lambda`](./skills/11ai-operator-aws-lambda/SKILL.md) | Inspecting, invoking, updating, publishing, and diagnosing Lambda functions |
| [`11ai-operator-aws-ecs`](./skills/11ai-operator-aws-ecs/SKILL.md) | Inspecting clusters, services, tasks, deployments, and ECS execution behavior |
| [`11ai-operator-aws-ecr`](./skills/11ai-operator-aws-ecr/SKILL.md) | Inspecting repositories and images, authenticating Docker, and managing image tags |
| [`11ai-operator-aws-cloudwatch`](./skills/11ai-operator-aws-cloudwatch/SKILL.md) | Querying logs, metrics, alarms, dashboards, and operational time windows |
| [`11ai-operator-aws-iam`](./skills/11ai-operator-aws-iam/SKILL.md) | Inspecting users, roles, policies, permission boundaries, and simulated access |
| [`11ai-operator-aws-cloudformation`](./skills/11ai-operator-aws-cloudformation/SKILL.md) | Validating templates and inspecting stacks, events, resources, and change sets |
| [`11ai-operator-aws-ssm`](./skills/11ai-operator-aws-ssm/SKILL.md) | Reaching instances through Session Manager, running commands across a target set, and forwarding ports |
| [`11ai-operator-aws-rds`](./skills/11ai-operator-aws-rds/SKILL.md) | Inspecting databases, snapshotting before changes, restoring, resizing, and reading maintenance state |
| [`11ai-operator-aws-vpc`](./skills/11ai-operator-aws-vpc/SKILL.md) | Inspecting subnets, routes, security groups, and network ACLs, and proving a path with Reachability Analyzer |
| [`11ai-operator-aws-route53`](./skills/11ai-operator-aws-route53/SKILL.md) | Reading and changing DNS records, planning a cutover with time-to-live, and diagnosing lookups |
| [`11ai-operator-aws-secrets`](./skills/11ai-operator-aws-secrets/SKILL.md) | Reading, creating, and rotating secrets and parameters without printing their values |
| [`11ai-operator-aws-cloudtrail`](./skills/11ai-operator-aws-cloudtrail/SKILL.md) | Attributing an account change to a person or service from audit events |
| [`11ai-operator-aws-costs`](./skills/11ai-operator-aws-costs/SKILL.md) | Reporting spend by service or tag, finding what drove an increase, and setting budgets |
| [`11ai-operator-aws-deployments`](./skills/11ai-operator-aws-deployments/SKILL.md) | Deploying an immutable artifact, verifying the user-visible objective, and rolling back |
| [`11ai-operator-aws-cheatsheet`](./skills/11ai-operator-aws-cheatsheet/SKILL.md) | Answering quick AWS CLI command, flag, output, and safety questions |
| [`11ai-operator-aws-troubleshooting`](./skills/11ai-operator-aws-troubleshooting/SKILL.md) | Diagnosing AWS CLI and service failures from reproducible evidence |

## Safety model

- Resolve the target profile, account, role, region, and resource identifiers before acting.
- Start with read-only commands and preserve exact error codes, messages, and request IDs.
- Treat `delete`, `terminate`, `destroy`, `rm`, `prune`, policy changes, public access, credential creation, and production deploys as high-impact.
- Show the exact mutating command, scope, and expected impact before executing it unless the user has already given clear authorization.
- Never print credentials, tokens, secret values, private keys, signed URLs, or sensitive environment variables.
- Verify the original objective after a change; do not infer success from a zero exit code alone.

