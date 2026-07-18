---
name: 11ai-aws-ecr
description: "Inspect Amazon ECR repositories, image tags, digests, scan findings, and Docker authentication with reproducible, safety-aware workflows. Use when publishing, pulling, identifying, or troubleshooting container images in ECR."
---

# AWS ECR

Resolve the registry account, region, repository, image tag or digest, and local Docker context before acting. Prefer immutable digests for deployments and do not assume a tag points to the image a user expects.

## Inspect repositories and images

```bash
aws ecr describe-repositories --repository-names REPOSITORY --profile PROFILE --region REGION
aws ecr list-images --repository-name REPOSITORY --filter tagStatus=ANY --profile PROFILE --region REGION
aws ecr describe-images --repository-name REPOSITORY --image-ids imageTag=TAG --profile PROFILE --region REGION
aws ecr describe-images --repository-name REPOSITORY --image-ids imageDigest=SHA256_DIGEST --profile PROFILE --region REGION
aws ecr describe-image-scan-findings --repository-name REPOSITORY --image-id imageDigest=SHA256_DIGEST --profile PROFILE --region REGION
aws ecr get-lifecycle-policy --repository-name REPOSITORY --profile PROFILE --region REGION
```

Check repository URI, image digest, pushed time, tags, scan status, encryption, mutability, lifecycle policy, and whether a running ECS or Lambda deployment references the image.

## Authenticate Docker

Login changes local Docker credential state and should happen only when requested:

```bash
aws ecr get-login-password --region REGION --profile PROFILE \
  | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com
```

Never echo the password, store it in shell history, or paste it into a prompt. Confirm the registry account and region before login.

## Push, pull, and delete

Tag and push only the user’s intended local image and repository. Use the digest from `describe-images` to verify what was published. `batch-delete-image`, repository deletion, lifecycle policy changes, and tag overwrites are mutating and may break deployments; show the exact target and impact first.

Do not “fix” a deployment by retagging an unknown image. Compare local image digests, ECR digests, task definitions, and rollout timestamps, then verify the consumer after an approved change.
