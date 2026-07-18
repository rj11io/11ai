# AWS CLI quick reference

Use placeholders literally as placeholders. Replace `PROFILE`, `REGION`, and resource identifiers only after resolving the target with `aws sts get-caller-identity`.

## Global context

```bash
aws --version
aws configure list
aws configure list-profiles
aws sts get-caller-identity --profile PROFILE --region REGION
```

Useful global options:

- `--profile PROFILE`: select credentials and config.
- `--region REGION`: select the regional endpoint.
- `--output json|table|text`: choose a result format; prefer JSON for automation.
- `--query 'JMESPath'`: select fields client-side without changing AWS state.
- `--no-cli-pager`: prevent a pager from blocking output.
- `--cli-binary-format raw-in-base64-out`: preserve JSON payload behavior for commands such as Lambda invoke.

## Read-only service commands

```bash
# S3
aws s3 ls --profile PROFILE
aws s3 ls s3://BUCKET/PREFIX/ --recursive --profile PROFILE --region REGION
aws s3api head-object --bucket BUCKET --key KEY --profile PROFILE --region REGION

# EC2
aws ec2 describe-instances --instance-ids INSTANCE_ID --profile PROFILE --region REGION
aws ec2 describe-instance-status --instance-ids INSTANCE_ID --include-all-instances --profile PROFILE --region REGION

# Lambda
aws lambda get-function --function-name FUNCTION --profile PROFILE --region REGION
aws lambda list-aliases --function-name FUNCTION --profile PROFILE --region REGION

# ECS
aws ecs describe-services --cluster CLUSTER --services SERVICE --profile PROFILE --region REGION
aws ecs list-tasks --cluster CLUSTER --service-name SERVICE --profile PROFILE --region REGION

# ECR
aws ecr describe-images --repository-name REPOSITORY --image-ids imageTag=TAG --profile PROFILE --region REGION

# CloudWatch
aws logs tail LOG_GROUP --since 1h --format short --profile PROFILE --region REGION
aws cloudwatch describe-alarms --alarm-names ALARM --profile PROFILE --region REGION

# IAM (IAM is generally global; do not add a region unless the command accepts it)
aws iam get-role --role-name ROLE --profile PROFILE
aws iam simulate-principal-policy --policy-source-arn PRINCIPAL_ARN --action-names ACTION --resource-arns RESOURCE_ARN --profile PROFILE

# CloudFormation
aws cloudformation describe-stacks --stack-name STACK --profile PROFILE --region REGION
aws cloudformation describe-stack-events --stack-name STACK --profile PROFILE --region REGION
aws cloudformation validate-template --template-body file://template.yaml --profile PROFILE --region REGION
```

## Common mutations

These commands change state or can cause application side effects. Show the exact target and obtain clear approval first:

```bash
aws s3 cp LOCAL_FILE s3://BUCKET/KEY --profile PROFILE --region REGION
aws s3 sync LOCAL_DIR s3://BUCKET/PREFIX/ --dryrun --profile PROFILE --region REGION
aws ec2 stop-instances --instance-ids INSTANCE_ID --profile PROFILE --region REGION
aws lambda invoke --function-name FUNCTION --payload fileb://payload.json response.json --profile PROFILE --region REGION
aws ecs update-service --cluster CLUSTER --service SERVICE --force-new-deployment --profile PROFILE --region REGION
aws ecr batch-delete-image --repository-name REPOSITORY --image-ids imageDigest=DIGEST --profile PROFILE --region REGION
aws cloudformation create-change-set --stack-name STACK --change-set-name NAME --change-set-type UPDATE --template-body file://template.yaml --profile PROFILE --region REGION
```

Prefer `--dryrun`, `describe-*`, or CloudFormation change sets where available. There is no universal AWS dry-run, and a command such as Lambda invoke or ECS force deployment can have downstream effects even when it does not change configuration.

## JMESPath examples

```bash
aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,State.Name,Tags]' --output table --profile PROFILE --region REGION
aws ecs describe-services --cluster CLUSTER --services SERVICE --query 'services[0].[desiredCount,runningCount,pendingCount,deployments[].rolloutState]' --output table --profile PROFILE --region REGION
aws cloudformation describe-stacks --stack-name STACK --query 'Stacks[0].Outputs' --output table --profile PROFILE --region REGION
```

Queries only shape the response locally; they do not filter the server-side authorization scope. Use service filters to reduce the data returned when possible.
