---
name: 11ai-operator-aws-cloudtrail
description: "Attribute account changes using CloudTrail, covering event history lookup by resource, user, or event name, the management and data event distinction, reading the identity behind an assumed role or federated session, querying a trail in Athena or CloudWatch Logs, event time windows and delivery lag, and separating a human action from an automated one. Use when someone must find who changed or deleted a resource, when an unexpected change must be attributed, or when an access question needs evidence."
---
# 11ai AWS CloudTrail

CloudTrail answers one question well: who did this, when, and from where. It is read-only, so the discipline is precision rather than safety — a lookup with the wrong time window or the wrong event name returns nothing and looks like proof that nothing happened.

Two limits to state before drawing conclusions: event history in the console and `lookup-events` covers roughly the last 90 days and management events only, and delivery lags by several minutes. Absence of an event in that window is not evidence it did not occur.

## Look up a recent change

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=RESOURCE_NAME \
  --start-time "$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --profile PROFILE --region REGION
```

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteDBInstance \
  --start-time "$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)" \
  --query 'Events[].{Time:EventTime,User:Username,Event:EventName}' \
  --profile PROFILE --region REGION
```

Only one lookup attribute is allowed per call, so filter on the most specific one and narrow the rest afterwards. Timestamps are UTC — a window built from local time can miss the event entirely.

Events are region-scoped, except global-service events which land in one region. If a lookup finds nothing, check the region before concluding anything.

## Read the identity properly

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=EVENT_NAME \
  --start-time START --end-time END --profile PROFILE --region REGION \
  --query 'Events[].CloudTrailEvent' --output text | jq -r '
    {time: .eventTime, event: .eventName, source: .sourceIPAddress,
     type: .userIdentity.type, arn: .userIdentity.arn,
     principal: .userIdentity.principalId,
     onBehalfOf: .userIdentity.sessionContext.sessionIssuer.arn,
     mfa: .userIdentity.sessionContext.attributes.mfaAuthenticated,
     agent: .userAgent}'
```

`userIdentity` is where attribution actually lives, and the useful field depends on the type:

- **`IAMUser`** — a long-lived user; `arn` names them directly.
- **`AssumedRole`** — the role is in `sessionIssuer.arn` and the *person or service* is in `principalId` after the colon, which is the session name. The role alone does not identify anyone.
- **`AWSService`** — an AWS service acted on its own, so no human is behind it.
- **`Root`** — the account root, which is worth flagging on sight.

`userAgent` distinguishes a console click from a CLI call from an infrastructure tool, which usually settles whether a change was deliberate or part of an automated apply. `mfaAuthenticated` and `sourceIPAddress` matter for an access question.

Redact source addresses and session names when reporting outside the team that owns the account; they identify people.

## Query beyond 90 days

Event history is limited, so a longer question needs the trail's own storage.

```bash
aws cloudtrail describe-trails --profile PROFILE --region REGION \
  --query 'trailList[].{Name:Name,Bucket:S3BucketName,Multi:IsMultiRegionTrail,Logs:CloudWatchLogsLogGroupArn}'
aws cloudtrail get-trail-status --name TRAIL_NAME --profile PROFILE --region REGION
```

With the trail delivering to CloudWatch Logs:

```bash
aws logs filter-log-events --log-group-name LOG_GROUP \
  --filter-pattern '{ $.eventName = "DeleteBucket" }' \
  --start-time START_EPOCH_MS --profile PROFILE --region REGION
```

For a trail in S3, query it with Athena — that is the route for questions spanning months, and it costs per data scanned, so partition the query by date rather than scanning the whole bucket.

Data events — object-level S3 reads and writes, Lambda invocations — are **not** recorded unless the trail was configured for them, and they are high volume. If a question needs object-level access history and the trail did not capture it, say so rather than reporting an empty result as an answer.

## Report

State the account, region, and time window in UTC; the event names searched and the lookup attribute used; each matching event with its time, event name, identity type, the role and session name for an assumed role, source address, and user agent; and whether the action looks human or automated. Say explicitly when a search returned nothing and what that does and does not rule out — the 90-day limit, the region scope, whether data events were being captured, and the delivery lag. Flag any root-account activity.
