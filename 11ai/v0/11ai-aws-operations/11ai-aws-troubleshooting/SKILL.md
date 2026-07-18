---
name: 11ai-aws-troubleshooting
description: "Diagnose AWS CLI and service failures from reproducible evidence, covering credentials, account and region context, authorization, throttling, resource state, networking, logs, deployments, and eventual consistency. Use when an AWS command errors or a resource behaves unexpectedly."
---

# AWS troubleshooting

Separate observed facts from hypotheses. Start with read-only evidence, reproduce the smallest failing command, identify the failing boundary, and propose the least risky next step. Do not delete, restart, redeploy, broaden IAM, expose a resource, or rotate credentials just to test a theory.

Use [references/triage-matrix.md](references/triage-matrix.md) when the symptom maps to a known AWS failure class.

## Evidence collection

Start with only the checks that fit the symptom:

```bash
aws --version
aws configure list
aws sts get-caller-identity --profile PROFILE --region REGION
aws SERVICE COMMAND --debug
```

Then inspect the exact resource with the relevant operation skill. Capture the command shape, exit code, service error code, request ID, account, role, region, resource ID, timestamp, and recent state transitions. Redact access keys, session tokens, signed URLs, secret values, private IPs when sensitive, and personal data before quoting output.

## Classify the failure

- **CLI or credentials:** missing profile, expired SSO, invalid token, wrong credential source, or unsupported CLI version.
- **Wrong target:** account, role, region, partition, endpoint, or resource identifier mismatch.
- **Authorization:** explicit deny, missing action, wrong resource ARN, condition mismatch, permission boundary, session policy, SCP, or resource policy.
- **Input or state:** malformed parameter, wrong API version, resource not found, resource still creating, or invalid state transition.
- **Capacity or rate:** throttling, quota, unavailable capacity, concurrency, or exhausted address/volume limits.
- **Application or dependency:** container exit, Lambda error, health check, downstream timeout, DNS, load balancer, or network path.
- **Consistency or control plane:** a successful write not yet visible to a dependent service, stale deployment, or rollback in progress.

## Investigation discipline

1. Reproduce with the smallest safe read-only command and explicit profile and region.
2. Compare the failing boundary with a known-good resource or time window when available.
3. Inspect service events, logs, status fields, and request IDs before changing configuration.
4. State confidence as high, medium, or low and name the missing evidence.
5. Recommend one next check or one approved fix; avoid a list of speculative changes.

If a fix is approved, make one bounded change, record the exact target, then re-run the original check and verify the user-visible objective. If the issue is primarily identity, use `11ai-aws-iam`; if it is a service-specific workflow, hand off to that skill.

## Report

Conclude with: failing boundary, observed evidence, root cause or remaining uncertainty, exact command or change proposed, impact, rollback, and verification result.
