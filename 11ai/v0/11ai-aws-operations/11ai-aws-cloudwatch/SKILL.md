---
name: 11ai-aws-cloudwatch
description: "Query AWS CloudWatch logs, metrics, alarms, dashboards, and time windows for operational evidence. Use when investigating failures, checking service health, finding recent errors, or validating an approved alerting change."
---

# AWS CloudWatch

Make the time window, timezone, namespace, dimensions, log group, and target account explicit. CloudWatch timestamps are commonly interpreted in UTC; state the window in both human and ISO-8601 form when it matters.

## Logs

```bash
aws logs describe-log-groups --profile PROFILE --region REGION
aws logs tail LOG_GROUP --since 1h --format short --profile PROFILE --region REGION
aws logs filter-log-events --log-group-name LOG_GROUP --start-time START_MS --end-time END_MS --filter-pattern 'ERROR' --profile PROFILE --region REGION
aws logs describe-log-streams --log-group-name LOG_GROUP --order-by LastEventTime --descending --profile PROFILE --region REGION
```

Use the narrowest group, stream, time window, and filter that answers the question. Preserve exact error text, request IDs, correlation IDs, and timestamps while redacting tokens, cookies, payload secrets, and personal data.

## Metrics and alarms

```bash
aws cloudwatch list-metrics --namespace NAMESPACE --dimensions Name=NAME,Value=VALUE --profile PROFILE --region REGION
aws cloudwatch get-metric-statistics --namespace NAMESPACE --metric-name METRIC --dimensions Name=NAME,Value=VALUE --start-time START_ISO --end-time END_ISO --period 300 --statistics Sum Average Maximum --profile PROFILE --region REGION
aws cloudwatch describe-alarms --alarm-names ALARM --profile PROFILE --region REGION
aws cloudwatch get-dashboard --dashboard-name DASHBOARD --profile PROFILE --region REGION
```

Confirm unit, period, statistic, dimensions, missing-data treatment, and evaluation periods before interpreting a graph or alarm. A missing datapoint is not automatically zero.

## Changes and verification

`put-metric-alarm`, alarm actions, dashboard updates, log retention changes, subscription filters, and log-group deletion change operational behavior or data retention. Show the exact scope and rollback before an approved change. Afterward, re-read the alarm, dashboard, or retention setting and test the intended signal without generating unnecessary production traffic.
