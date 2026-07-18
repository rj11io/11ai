---
name: 11ai-aws-ec2
description: "Inspect and operate EC2 instances, status checks, volumes, tags, and security groups with explicit target resolution and safety gates. Use when starting, stopping, rebooting, connecting to, diagnosing, or inventorying EC2 resources."
---

# AWS EC2

Resolve instance IDs, account, region, and environment tags before acting. Names are not unique and should never be treated as sufficient identity for a state-changing command.

## Inspect resources

```bash
aws ec2 describe-instances --instance-ids INSTANCE_ID --profile PROFILE --region REGION
aws ec2 describe-instance-status --instance-ids INSTANCE_ID --include-all-instances --profile PROFILE --region REGION
aws ec2 describe-volumes --filters Name=attachment.instance-id,Values=INSTANCE_ID --profile PROFILE --region REGION
aws ec2 describe-security-groups --group-ids SG_ID --profile PROFILE --region REGION
aws ec2 describe-tags --filters Name=resource-id,Values=INSTANCE_ID --profile PROFILE --region REGION
```

Check instance state, private and public addresses, subnet and VPC, security groups, IAM instance profile, launch time, image, tags, health checks, and attached volumes. Preserve the difference between a stopped instance, a failed system check, an application failure, and a network or authorization problem.

## Diagnose connectivity

1. Confirm the instance is running and both status checks are passing.
2. Confirm the intended subnet, route, security group, network ACL, and listening port from evidence.
3. Check whether the user expects SSH, SSM, a load balancer, or a private service path; do not open a port just to make a test pass.
4. Compare the instance profile and expected permissions without printing credentials.

Use `describe-network-interfaces` or `describe-addresses` only when the network identity matters. Hand off deep network analysis to a future VPC skill rather than guessing.

## State changes

`start-instances`, `stop-instances`, `reboot-instances`, `terminate-instances`, volume modification, and security-group authorization are mutating. Before an approved change:

- confirm the exact IDs and tags;
- state whether the action causes downtime, data loss, replacement, or public exposure;
- check scheduled actions, autoscaling ownership, and load-balancer membership when relevant;
- use a bounded command, never a broad filter-derived list without review.

Afterward, poll the specific instance or resource until the expected state is observable, then re-run the original health check. Never terminate to troubleshoot.
