---
name: 11ai-aws-lambda
description: "Inspect, invoke, update, publish, and troubleshoot AWS Lambda functions with explicit aliases, versions, payloads, and logs. Use when a function fails, needs a controlled test, or requires a carefully scoped deployment change."
---

# AWS Lambda

Resolve the function name or ARN, alias or version, account, region, invocation type, and payload before acting. An invocation can mutate downstream systems even when Lambda itself is not changed.

## Inspect first

```bash
aws lambda list-functions --profile PROFILE --region REGION
aws lambda get-function --function-name FUNCTION_OR_ARN --profile PROFILE --region REGION
aws lambda get-function-configuration --function-name FUNCTION_OR_ARN --qualifier ALIAS_OR_VERSION --profile PROFILE --region REGION
aws lambda list-aliases --function-name FUNCTION_OR_ARN --profile PROFILE --region REGION
aws lambda list-event-source-mappings --function-name FUNCTION_OR_ARN --profile PROFILE --region REGION
aws lambda get-policy --function-name FUNCTION_OR_ARN --profile PROFILE --region REGION
```

Inspect runtime, handler, architecture, memory, timeout, environment variable names (not values), layers, VPC configuration, role ARN, reserved concurrency, last update status, and code SHA. Use CloudWatch logs for execution evidence.

## Invoke safely

`aws lambda invoke` is a real application action. Before running it, state the target qualifier, payload classification, expected downstream effects, and whether the request is synchronous:

```bash
aws lambda invoke \
  --function-name FUNCTION_OR_ARN \
  --qualifier ALIAS_OR_VERSION \
  --invocation-type RequestResponse \
  --payload fileb://payload.json \
  --cli-binary-format raw-in-base64-out \
  response.json \
  --profile PROFILE \
  --region REGION
```

Never invent a production payload, expose response data containing secrets, or use `Event` asynchronously when the user expects an immediate result. Review the function response, `FunctionError`, status code, and corresponding log stream.

## Deployment changes

`update-function-code`, `update-function-configuration`, `publish-version`, alias updates, event-source changes, concurrency changes, and permission changes are mutating. Use the project’s artifact and deployment conventions; do not upload arbitrary local code or edit environment variables by guesswork.

After an approved update, verify `LastUpdateStatus`, code SHA or version, alias routing, logs, error rate, and the original behavior. If the problem is a timeout, throttling, dependency, permission, or VPC issue, diagnose the boundary before changing memory, timeout, or IAM permissions.
