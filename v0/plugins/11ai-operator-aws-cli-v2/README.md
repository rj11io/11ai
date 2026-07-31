# 11ai AWS CLI v2 operator

Twenty-two standalone, AWS CLI v2-first skills for common cloud operations and first-party Agent Toolkit compatibility. Use the latest stable v2 patch (`2.36.x` at this review); AWS CLI v1 behavior is outside this plugin.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-aws-cli-v2-setup`](./skills/11ai-operator-aws-cli-v2-setup/SKILL.md) | Installing the AWS CLI and configuring profiles, SSO, regions, and role assumption from zero |
| [`11ai-operator-aws-cli-v2-native-skills`](./skills/11ai-operator-aws-cli-v2-native-skills/SKILL.md) | Selecting first-party AWS Agent Toolkit skills after checking AWS CLI v2 and CLI-fallback compatibility |
| [`11ai-operator-aws-cli-v2-environment`](./skills/11ai-operator-aws-cli-v2-environment/SKILL.md) | Inspecting profiles, credentials, identity, region, SSO, and target context |
| [`11ai-operator-aws-cli-v2-integrations`](./skills/11ai-operator-aws-cli-v2-integrations/SKILL.md) | Connecting AWS to CI pipelines, container registries, infrastructure-as-code, and application runtime configuration |
| [`11ai-operator-aws-cli-v2-s3`](./skills/11ai-operator-aws-cli-v2-s3/SKILL.md) | Listing buckets, inspecting objects, copying data, syncing paths, and checking bucket safety |
| [`11ai-operator-aws-cli-v2-ec2`](./skills/11ai-operator-aws-cli-v2-ec2/SKILL.md) | Inspecting instances, status, volumes, tags, and security groups; carefully changing instance state |
| [`11ai-operator-aws-cli-v2-lambda`](./skills/11ai-operator-aws-cli-v2-lambda/SKILL.md) | Inspecting, invoking, updating, publishing, and diagnosing Lambda functions |
| [`11ai-operator-aws-cli-v2-ecs`](./skills/11ai-operator-aws-cli-v2-ecs/SKILL.md) | Inspecting clusters, services, tasks, deployments, and ECS execution behavior |
| [`11ai-operator-aws-cli-v2-ecr`](./skills/11ai-operator-aws-cli-v2-ecr/SKILL.md) | Inspecting repositories and images, authenticating Docker, and managing image tags |
| [`11ai-operator-aws-cli-v2-cloudwatch`](./skills/11ai-operator-aws-cli-v2-cloudwatch/SKILL.md) | Querying logs, metrics, alarms, dashboards, and operational time windows |
| [`11ai-operator-aws-cli-v2-iam`](./skills/11ai-operator-aws-cli-v2-iam/SKILL.md) | Inspecting users, roles, policies, permission boundaries, and simulated access |
| [`11ai-operator-aws-cli-v2-cloudformation`](./skills/11ai-operator-aws-cli-v2-cloudformation/SKILL.md) | Validating templates and inspecting stacks, events, resources, and change sets |
| [`11ai-operator-aws-cli-v2-ssm`](./skills/11ai-operator-aws-cli-v2-ssm/SKILL.md) | Reaching instances through Session Manager, running commands across a target set, and forwarding ports |
| [`11ai-operator-aws-cli-v2-rds`](./skills/11ai-operator-aws-cli-v2-rds/SKILL.md) | Inspecting databases, snapshotting before changes, restoring, resizing, and reading maintenance state |
| [`11ai-operator-aws-cli-v2-vpc`](./skills/11ai-operator-aws-cli-v2-vpc/SKILL.md) | Inspecting subnets, routes, security groups, and network ACLs, and proving a path with Reachability Analyzer |
| [`11ai-operator-aws-cli-v2-route53`](./skills/11ai-operator-aws-cli-v2-route53/SKILL.md) | Reading and changing DNS records, planning a cutover with time-to-live, and diagnosing lookups |
| [`11ai-operator-aws-cli-v2-secrets`](./skills/11ai-operator-aws-cli-v2-secrets/SKILL.md) | Reading, creating, and rotating secrets and parameters without printing their values |
| [`11ai-operator-aws-cli-v2-cloudtrail`](./skills/11ai-operator-aws-cli-v2-cloudtrail/SKILL.md) | Attributing an account change to a person or service from audit events |
| [`11ai-operator-aws-cli-v2-costs`](./skills/11ai-operator-aws-cli-v2-costs/SKILL.md) | Reporting spend by service or tag, finding what drove an increase, and setting budgets |
| [`11ai-operator-aws-cli-v2-deployments`](./skills/11ai-operator-aws-cli-v2-deployments/SKILL.md) | Deploying an immutable artifact, verifying the user-visible objective, and rolling back |
| [`11ai-operator-aws-cli-v2-cheatsheet`](./skills/11ai-operator-aws-cli-v2-cheatsheet/SKILL.md) | Answering quick AWS CLI command, flag, output, and safety questions |
| [`11ai-operator-aws-cli-v2-troubleshooting`](./skills/11ai-operator-aws-cli-v2-troubleshooting/SKILL.md) | Diagnosing AWS CLI and service failures from reproducible evidence |

## Safety model

- Resolve the target profile, account, role, region, and resource identifiers before acting.
- Start with read-only commands and preserve exact error codes, messages, and request IDs.
- Treat `delete`, `terminate`, `destroy`, `rm`, `prune`, policy changes, public access, credential creation, and production deploys as high-impact.
- Show the exact mutating command, scope, and expected impact before executing it unless the user has already given clear authorization.
- Never print credentials, tokens, secret values, private keys, signed URLs, or sensitive environment variables.
- Verify the original objective after a change; do not infer success from a zero exit code alone.
