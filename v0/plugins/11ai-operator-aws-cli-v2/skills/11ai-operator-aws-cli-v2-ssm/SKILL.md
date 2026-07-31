---
name: 11ai-operator-aws-cli-v2-ssm
description: "Reach EC2 instances and private services through AWS Systems Manager, covering Session Manager shells, Run Command across a target set, port forwarding to a private database, session logging, and the agent and instance-profile prerequisites. Use when an instance must be reached without a bastion or an inbound rule, when a command must run across several instances, or when a private endpoint must be forwarded to a local port."
---
# 11ai AWS Systems Manager

Version baseline: AWS CLI v2, using the latest stable v2 patch available for the host platform (2.36.x at this review). Reject AWS CLI v1-only behavior and inspect aws --version plus the live v2 command help before composing commands.

Session Manager reaches an instance without an open inbound port, a bastion, or an SSH key, which makes it the safest way in — and also means every session is an audited, potentially privileged shell. Confirm the account, region, and instance before connecting, and treat Run Command across a target set as a change to every instance it matches.

## Inspect first

```bash
aws sts get-caller-identity --profile PROFILE
aws ssm describe-instance-information --profile PROFILE --region REGION \
  --query 'InstanceInformationList[].{Id:InstanceId,Ping:PingStatus,Agent:AgentVersion,Name:ComputerName}'
aws ssm get-connection-status --target INSTANCE_ID --profile PROFILE --region REGION
```

An instance missing from `describe-instance-information` cannot be reached, and the cause is one of three things: the SSM agent is not running, the instance profile lacks the managed policy that allows the agent to register, or the subnet has no route to the Systems Manager endpoints. That is a prerequisite problem, not a session problem — check it before retrying.

## Open a session

```bash
aws ssm start-session --target INSTANCE_ID --profile PROFILE --region REGION
```

```bash
aws ssm start-session --target INSTANCE_ID \
  --document-name AWS-StartInteractiveCommand \
  --parameters '{"command":["sudo tail -n 200 /var/log/app.log"]}' \
  --profile PROFILE --region REGION
```

The plugin must be installed locally for `start-session` to work; without it the command fails with a plugin error rather than a permission error.

A session is an interactive shell on a running instance. Anything typed in it changes that instance, so the usual rule applies: read before you write, and get approval for a command that installs, restarts, deletes, or reconfigures. Prefer reading a log over editing a file, and prefer fixing the deployment definition over patching a live instance — a hand-patched instance drifts from every other one and the change disappears on the next replacement.

## Run Command across a target set

```bash
aws ssm send-command \
  --document-name AWS-RunShellScript \
  --targets 'Key=tag:Environment,Values=staging' \
  --parameters 'commands=["systemctl is-active app"]' \
  --comment "check app status" \
  --profile PROFILE --region REGION
```

```bash
aws ssm list-command-invocations --command-id COMMAND_ID --details \
  --query 'CommandInvocations[].{Instance:InstanceId,Status:Status,Output:CommandPlugins[0].Output}' \
  --profile PROFILE --region REGION
```

A tag-based target hits every matching instance, and the count is not shown before it runs. Resolve the target set first and show it:

```bash
aws ssm describe-instance-information \
  --filters 'Key=tag:Environment,Values=staging' \
  --query 'length(InstanceInformationList)' --profile PROFILE --region REGION
```

Get approval for that number and that command. A read-only command across staging is routine; a `systemctl restart` across production is an outage if the count is wrong.

## Forward a port

```bash
aws ssm start-session --target INSTANCE_ID \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["5432"],"localPortNumber":["15432"]}' \
  --profile PROFILE --region REGION
```

```bash
aws ssm start-session --target INSTANCE_ID \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["db.internal"],"portNumber":["5432"],"localPortNumber":["15432"]}' \
  --profile PROFILE --region REGION
```

The second form reaches a host the instance can see, which is how a private database is reached without exposing it. Use a distinct local port so a local service is not shadowed, and prove the path by speaking the service's protocol through it rather than trusting that the socket bound.

Close the session when finished. A forgotten forward keeps an authenticated tunnel into a private network open.

## Report

State the account, region, and instance or resolved target set with its count, whether the instance was reachable and why not if it was not, the exact command run in the session or through Run Command, the invocation status per instance, any port forwarded with its local and remote ends, and what changed on the instance. Redact credentials appearing in session output, and say plainly when a live instance was modified rather than its deployment definition.
