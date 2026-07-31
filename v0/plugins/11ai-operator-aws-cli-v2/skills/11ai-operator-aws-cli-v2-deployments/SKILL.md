---
name: 11ai-operator-aws-cli-v2-deployments
description: "Deploy a change to a running AWS service and roll it back, covering the immutable-artifact rule, deploying by digest or version, waiting for stability rather than assuming it, health checks and draining, verifying the user-visible objective, rollback by redeploying the previous identifier, and separating a code deploy from a configuration or schema change. Use when a change must reach a running service, when a deploy must be verified, or when a bad deploy must be reverted."
---
# 11ai AWS deployments

Version baseline: AWS CLI v2, using the latest stable v2 patch available for the host platform (2.36.x at this review). Reject AWS CLI v1-only behavior and inspect aws --version plus the live v2 command help before composing commands.

A deploy is only as good as its rollback. Before starting, establish what is running now, what identifier would restore it, and how you will know the new version actually works — not that the command returned zero. Deploys are externally visible changes and need explicit approval for the environment named.

## Record what is running

```bash
aws sts get-caller-identity --profile PROFILE
aws ecs describe-services --cluster CLUSTER --services SERVICE --profile PROFILE --region REGION \
  --query 'services[0].{Desired:desiredCount,Running:runningCount,TaskDef:taskDefinition,Deployments:deployments[].{Status:status,Rollout:rolloutState,Count:runningCount}}'
aws lambda get-function --function-name FUNCTION --profile PROFILE --region REGION \
  --query '{Version:Configuration.Version,Sha:Configuration.CodeSha256,Alias:Configuration.FunctionArn}'
```

Write down the current task definition revision, function version, or image digest. That string is the rollback plan, and capturing it afterwards is too late.

Confirm the environment out loud. The same command against staging and production differ only in a profile or cluster name, and that is the most consequential typo available here.

## Deploy an immutable artifact

Deploy something that cannot change under you: an image digest, a specific task definition revision, or a published function version. A moving tag such as `latest` makes the deployed state unknowable and rollback undescribable.

```bash
aws ecs register-task-definition --cli-input-json file://taskdef.json \
  --profile PROFILE --region REGION --query 'taskDefinition.revision'
aws ecs update-service --cluster CLUSTER --service SERVICE \
  --task-definition FAMILY:REVISION --profile PROFILE --region REGION
aws ecs wait services-stable --cluster CLUSTER --services SERVICE --profile PROFILE --region REGION
```

```bash
aws lambda update-function-code --function-name FUNCTION \
  --image-uri REGISTRY/REPO@sha256:DIGEST --publish --profile PROFILE --region REGION
aws lambda update-alias --function-name FUNCTION --name live \
  --function-version VERSION --profile PROFILE --region REGION
```

Point an alias at a published version rather than deploying to the unversioned function. That makes rollback a single alias update, which is the fastest recovery available.

The `wait` is not optional. `update-service` returns as soon as the deployment is accepted, long before any new task is healthy, so a script without a wait reports success for a deploy that is still failing.

For a gradual rollout, shift a weighted percentage and watch errors before continuing. A canary is worth it exactly when a failure would be expensive and hard to notice quickly.

## Verify the objective, not the command

```bash
aws ecs describe-services --cluster CLUSTER --services SERVICE --profile PROFILE --region REGION \
  --query 'services[0].{Rollout:deployments[0].rolloutState,Running:runningCount,Desired:desiredCount,Events:events[0:3].message}'
aws elbv2 describe-target-health --target-group-arn TARGET_GROUP --profile PROFILE --region REGION \
  --query 'TargetHealthDescriptions[].{Target:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason}'
```

Check, in this order:

1. The rollout reached a completed state and the running count equals the desired count.
2. Every target is `healthy`, not `draining` or `unhealthy`.
3. The running version is the one intended — compare the digest or revision, not the tag.
4. A real request through the public path returns the expected result.
5. The error rate and latency after the deploy match before it.

A service that reports stable while its tasks cycle is a failing health check, and the service events name it. A deploy that never progresses past a low running count is usually a task that starts and exits — read its stopped reason rather than redeploying.

## Roll back

```bash
aws ecs update-service --cluster CLUSTER --service SERVICE \
  --task-definition FAMILY:PREVIOUS_REVISION --profile PROFILE --region REGION
aws ecs wait services-stable --cluster CLUSTER --services SERVICE --profile PROFILE --region REGION
aws lambda update-alias --function-name FUNCTION --name live \
  --function-version PREVIOUS_VERSION --profile PROFILE --region REGION
```

Rollback is a deploy of the previous identifier, and it needs the same verification. Do it early: diagnosing a broken deploy while it serves traffic is slower and more expensive than restoring the old version first and investigating after.

Two things a code rollback does **not** undo, and both must be planned before deploying:

- **A schema change.** Deploy in expand-then-contract steps — add the new column, ship code that writes both, backfill, then remove the old one in a later release — so the previous version still runs against the migrated database.
- **A configuration or secret change.** Those live outside the artifact and roll back separately.

If the deploy included either, say so plainly: the rollback is partial and the remaining steps are manual.

## Report

State the account, region, and environment; the previous identifier captured as the rollback point; the artifact deployed by digest, revision, or version; the wait result and rollout state; the target health, running-versus-desired counts, and the verified user-visible check; the error and latency comparison; and whether the change included a schema or configuration change that a code rollback would not reverse. Give the exact rollback command.
