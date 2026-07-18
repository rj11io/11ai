---
name: 11ai-aws-cloudformation
description: "Validate CloudFormation templates and inspect stacks, events, resources, drift, and change sets with replacement and rollback awareness. Use when a stack fails, a deployment needs preview, or infrastructure state must be explained."
---

# AWS CloudFormation

Resolve the stack name, account, region, template source, parameters, and intended operation. Prefer inspection and change-set preview over direct execution. A successful stack command does not prove the application is healthy.

## Inspect and validate

```bash
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE --profile PROFILE --region REGION
aws cloudformation describe-stacks --stack-name STACK --profile PROFILE --region REGION
aws cloudformation describe-stack-events --stack-name STACK --profile PROFILE --region REGION
aws cloudformation describe-stack-resources --stack-name STACK --profile PROFILE --region REGION
aws cloudformation list-stack-resources --stack-name STACK --profile PROFILE --region REGION
aws cloudformation validate-template --template-body file://template.yaml --profile PROFILE --region REGION
aws cloudformation get-template --stack-name STACK --template-stage Original --profile PROFILE --region REGION
```

Read the newest events first, then identify the first failing resource and its provider error. Separate template validation, change-set creation, resource provisioning, rollback, and post-deploy application failures.

## Preview changes

For an update, create a named change set with explicit parameters and tags, then inspect it before execution:

```bash
aws cloudformation create-change-set --stack-name STACK --change-set-name NAME --change-set-type UPDATE --template-body file://template.yaml --parameters ParameterKey=KEY,ParameterValue=VALUE --capabilities CAPABILITY_NAMED_IAM --profile PROFILE --region REGION
aws cloudformation describe-change-set --stack-name STACK --change-set-name NAME --profile PROFILE --region REGION
```

Review additions, modifications, removals, replacements, IAM capability requirements, and outputs. Treat replacement of databases, volumes, load balancers, identities, or security controls as high-impact.

## Apply and recover

`deploy`, change-set execution, stack creation, stack update, rollback control, and stack deletion are mutating. Show the exact template, stack, parameters, capabilities, and expected blast radius before executing. Never delete a failed stack just to clear an error; preserve events and physical resource IDs first.

After an approved operation, verify stack status, outputs, resource health, drift or rollback state, and the original application behavior. Record any resources retained outside the stack.
