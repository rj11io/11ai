---
name: 11ai-aws-ecs
description: "Inspect Amazon ECS clusters, services, tasks, task definitions, deployments, and execution behavior with bounded targets and rollout verification. Use when an ECS service is unhealthy, a task will not start, or a deployment needs investigation."
---

# AWS ECS

Identify the cluster, service, task family, launch type, region, and deployment before changing anything. Keep ECS control-plane state separate from application logs and load-balancer health.

## Inspect first

```bash
aws ecs list-clusters --profile PROFILE --region REGION
aws ecs describe-clusters --clusters CLUSTER --include ATTACHMENTS,CONFIGURATIONS,STATISTICS,TAGS --profile PROFILE --region REGION
aws ecs list-services --cluster CLUSTER --profile PROFILE --region REGION
aws ecs describe-services --cluster CLUSTER --services SERVICE --profile PROFILE --region REGION
aws ecs list-tasks --cluster CLUSTER --service-name SERVICE --desired-status RUNNING --profile PROFILE --region REGION
aws ecs describe-tasks --cluster CLUSTER --tasks TASK_ARN --include TAGS --profile PROFILE --region REGION
aws ecs describe-task-definition --task-definition FAMILY_OR_ARN --profile PROFILE --region REGION
```

Check desired, running, and pending counts; deployment IDs and rollout state; task stop reasons; container exit codes; image digests; environment and secret references without printing values; health checks; capacity provider; networking; and load-balancer target health when relevant.

## Diagnose a service

1. Confirm the service points at the expected task definition revision.
2. Inspect recent events and stopped tasks before forcing a deployment.
3. Separate image pull or execution-role failures from application exits, health-check failures, capacity shortages, and network reachability.
4. Compare the task’s container port, target group, security groups, subnets, and listener path only with evidence.
5. Follow the configured log driver to the correct CloudWatch log group and stream prefix.

## Mutations

`update-service`, `force-new-deployment`, `stop-task`, task-definition registration, scaling changes, and cluster capacity changes are mutating. Explain downtime, replacement, cost, and rollback implications. Never stop every task or force a rollout to clear an unexplained failure.

After an approved change, verify deployment stability, task health, service events, target health, logs, and the original endpoint or job behavior. If the failure is primarily an image problem, hand off to `11ai-aws-ecr`; if it is primarily logs or metrics, use `11ai-aws-cloudwatch`.
