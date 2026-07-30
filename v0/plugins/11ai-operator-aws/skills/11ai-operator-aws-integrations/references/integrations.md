# AWS integrations reference

Replace every account number, region, repository, and role name below with the project's real values. Nothing here should be applied without reading it against the account it targets.

## CI pipeline authentication without stored keys

A pipeline proves who it is with a token its provider issues, exchanges that token for a role session, and holds credentials for minutes. No secret is stored anywhere.

The account needs one identity provider for the CI system, created once:

```bash
aws iam list-open-id-connect-providers --profile PROFILE
```

Then a role whose trust policy accepts only the intended repository and branch. The `sub` condition is the security boundary — a wildcard there lets any repository in the organization assume the role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:ORG/REPO:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

To allow several branches or tags, use `StringLike` with an explicit prefix such as `repo:ORG/REPO:*`. Never leave the repository portion open.

The workflow requests the token and assumes the role:

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111122223333:role/CiDeployRole
          aws-region: eu-west-1
      - run: aws sts get-caller-identity
```

The `id-token: write` permission is what most first attempts miss; without it the token is never issued and the step fails with a credentials error that looks like a trust-policy problem. Keep `aws sts get-caller-identity` as the first step so the logs record which role actually acted.

## Publishing a container image to ECR

Authenticate, tag, push, then deploy. Each step names its target.

```bash
aws ecr describe-repositories --repository-names REPO --profile PROFILE --region REGION

aws ecr get-login-password --profile PROFILE --region REGION \
  | docker login --username AWS --password-stdin 111122223333.dkr.ecr.REGION.amazonaws.com
```

The password arrives on standard input so it never reaches the process list or shell history. Do not pass it as `--password`.

```bash
docker build -t REPO:GIT_SHA .
docker tag REPO:GIT_SHA 111122223333.dkr.ecr.REGION.amazonaws.com/REPO:GIT_SHA
docker push 111122223333.dkr.ecr.REGION.amazonaws.com/REPO:GIT_SHA
```

Tag with the commit SHA, not only `latest`. A mutable tag makes a rollback impossible to describe and lets two deploys disagree about what is running.

For a cross-architecture build, set the platform explicitly. A local ARM build pushed to an x86 service starts and then crashes with an exec format error:

```bash
docker buildx build --platform linux/amd64 -t REPO:GIT_SHA --push .
```

Then update the service and wait for it, rather than assuming the push deployed anything:

```bash
aws ecs update-service --cluster CLUSTER --service SERVICE \
  --force-new-deployment --profile PROFILE --region REGION

aws ecs wait services-stable --cluster CLUSTER --services SERVICE \
  --profile PROFILE --region REGION
```

Verify the digest that is actually running:

```bash
aws ecr describe-images --repository-name REPO --image-ids imageTag=GIT_SHA \
  --query 'imageDetails[0].imageDigest' --profile PROFILE --region REGION
```

## Infrastructure as code

Whatever the tool, three things define the integration: where state lives, which role applies changes, and how drift is detected.

CloudFormation keeps state in the account. Read a change set before applying it:

```bash
aws cloudformation deploy --no-execute-changeset --template-file template.yaml \
  --stack-name STACK --profile PROFILE --region REGION

aws cloudformation describe-change-set --change-set-name ARN \
  --profile PROFILE --region REGION
```

Terraform keeps state outside the account by default, so give it a locking backend before the second person runs it:

```hcl
terraform {
  backend "s3" {
    bucket       = "ORG-terraform-state"
    key          = "SERVICE/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

State files contain resource attributes, including some secrets. Encrypt the bucket, block public access, enable versioning, and restrict who can read it. Never commit a state file.

Two rules that hold for every tool:

- One owner per resource. A resource created by the CLI and then imported into code is fine; a resource edited by both is a permanent source of drift.
- Read the plan. The resource count and, above all, the replacements are the part that matters. A replacement of a database or a load balancer is an outage, and it appears in the plan before it appears in an incident.

## Runtime configuration

Applications read configuration at startup from Parameter Store or Secrets Manager, using the task or function role rather than credentials in the image.

```bash
aws ssm get-parameters-by-path --path /SERVICE/prod/ --with-decryption \
  --query 'Parameters[].Name' --profile PROFILE --region REGION
```

```bash
aws secretsmanager get-secret-value --secret-id SERVICE/prod/db \
  --query 'SecretString' --output text --profile PROFILE --region REGION
```

Use `--query` to pull only the field needed. Printing a whole secret payload into a log or a transcript is the most common accidental disclosure in this area.

For ECS, let the task definition inject values so the application never calls the API itself:

```json
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:REGION:111122223333:secret:SERVICE/prod/db"
    }
  ]
}
```

For Lambda, read parameters at cold start and cache them for the container's life. Fetching on every invocation adds latency and runs into request rate limits under load.

Two rules:

- Fail loudly on a missing required value. A silent fallback to a development default is how a production service ends up pointed at the wrong database.
- Keep one source of truth. A value in both an environment variable and a secret store will drift, and the one that wins is whichever the code reads first.

## Local development against cloud resources

Three options, in order of preference:

1. **A developer role with read-only production access and write access to a development account.** Simplest, and the permissions are visible.
2. **Port forwarding through Session Manager** for a private database or service, which needs no bastion host and no inbound rule:

   ```bash
   aws ssm start-session --target INSTANCE_ID \
     --document-name AWS-StartPortForwardingSession \
     --parameters '{"portNumber":["5432"],"localPortNumber":["5432"]}' \
     --profile PROFILE --region REGION
   ```

3. **A local emulator** for S3, DynamoDB, or SQS, pointed at with an endpoint override:

   ```bash
   aws --endpoint-url http://localhost:4566 s3 ls
   ```

   Treat emulator behaviour as an approximation. Permissions, consistency, and error codes differ from the real service, so anything permission-related must be verified against a real account.

Never give a developer machine long-lived production keys as a convenience. That is the credential most likely to end up in a repository or a container image.
