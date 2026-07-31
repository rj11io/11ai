---
name: 11ai-operator-aws-cli-v2-integrations
description: "Connect AWS to the systems around it, covering CI pipeline authentication with short-lived OpenID Connect roles, container image publishing to ECR, infrastructure-as-code state and drift, application runtime configuration from Secrets Manager and Parameter Store, and local development against cloud resources. Use when a pipeline needs AWS credentials, when a deploy must publish an image or update a service, when an application must read configuration at runtime, or when local development needs to reach a cloud resource."
---

# AWS integrations

Version baseline: AWS CLI v2, using the latest stable v2 patch available for the host platform (2.36.x at this review). Reject AWS CLI v1-only behavior and inspect aws --version plus the live v2 command help before composing commands.

Every AWS integration is a question about identity: which principal acts, how it proves itself, and for how long. Answer that first. Long-lived access keys stored in another system are the failure mode these integrations exist to avoid.

## Name the seam

- **CI pipeline authentication** — a pipeline assumes a role through OpenID Connect federation and receives short-lived credentials, with no stored secret.
- **Container publishing** — a build authenticates Docker to ECR, pushes a tagged image, then updates the service that runs it.
- **Infrastructure as code** — CloudFormation, Terraform, or CDK owns resources; its state and the role it runs as are the integration.
- **Runtime configuration** — an application reads configuration and secrets from Secrets Manager or Parameter Store at startup or on demand.
- **Local development** — a developer machine reaches a cloud resource, or a local emulator stands in for one.

## Wire one deliberately

1. Inspect what already exists before adding anything: the pipeline's current authentication step, the registry and repository names, the infrastructure tool and where its state lives, and how the application reads configuration today. Use `11ai-operator-aws-cli-v2-environment` to confirm which account you are looking at.
2. Choose the narrowest identity that works. A pipeline role scoped to one repository and one branch beats an account-wide role, and a task role beats credentials baked into an image.
3. Prefer short-lived credentials everywhere. If a system cannot federate, say so explicitly rather than reaching for stored access keys by default.
4. Make one change, in one place, and name the resources it touches. Read [references/integrations.md](references/integrations.md) for the OpenID Connect trust policy and pipeline steps, the ECR publish and deploy sequence, the infrastructure-as-code state and role setup, and the runtime configuration patterns.
5. Keep configuration in one direction. The application reads its values from one source; a value duplicated into both an environment variable and a secret store will drift.
6. Never widen a policy to make an integration pass. A denial during setup is information about the scope, not an obstacle to remove.

## Verify end to end

Prove the whole path, not the credential step:

- For a pipeline, run it and confirm the assumed-role ARN in the logs is the intended role, then confirm the action it performs actually happened in the account.
- For container publishing, confirm the image digest in the registry matches what the build produced, and that the running service reports the new digest rather than a cached tag.
- For infrastructure as code, run a plan or change set and read it before applying; confirm the resource count and the resources being replaced.
- For runtime configuration, confirm the application starts with values from the store and fails loudly when a required value is missing, rather than falling back to a default nobody chose.

## Report

State the seam wired, the principal and its trust conditions, the resources named, the account and region, the verification evidence, and anything left manual. Redact tokens, secret values, and signed URLs. Call out any permission that ended up broader than intended so it can be narrowed later.
