---
name: 11ai-operator-aws-route53
description: "Inspect and change Route 53 DNS, covering hosted zones and delegation, record types and alias records, change batches and propagation, time-to-live choices, health checks and failover routing, private zones, and diagnosing a lookup that returns the wrong answer or nothing. Use when a DNS record must be read or changed, when a domain does not resolve, or when a cutover needs a safe time-to-live plan."
---
# 11ai AWS Route 53

DNS changes are globally visible and cached by resolvers you do not control, so a wrong record propagates faster than the fix. Read the current answer, plan the time-to-live before the change rather than during it, and treat any record serving live traffic as a change needing approval.

## Inspect first

```bash
aws route53 list-hosted-zones --profile PROFILE \
  --query 'HostedZones[].{Id:Id,Name:Name,Private:Config.PrivateZone,Records:ResourceRecordSetCount}'
aws route53 list-resource-record-sets --hosted-zone-id ZONE_ID --profile PROFILE \
  --query 'ResourceRecordSets[].{Name:Name,Type:Type,TTL:TTL,Values:ResourceRecords[].Value,Alias:AliasTarget.DNSName}'
aws route53 get-hosted-zone --id ZONE_ID --profile PROFILE \
  --query '{Name:HostedZone.Name,Nameservers:DelegationSet.NameServers}'
```

Then check what the world actually sees, which is not always what the zone says:

```bash
dig +short NAME A
dig +noall +answer NAME
dig NS DOMAIN +short
dig +trace NAME | tail -20
```

Compare the zone's delegation set against the domain's registered nameservers. If they differ, the zone is not authoritative for that domain and nothing in it takes effect — that single check explains most "my record does nothing" reports, and no amount of editing records will fix it.

## Know the record types that matter

- **Alias** records point at an AWS resource — a load balancer, a distribution, an S3 website — and are free to query, resolve to the current addresses automatically, and can sit at the zone apex where a `CNAME` is illegal.
- **CNAME** cannot exist at the apex and cannot coexist with other records for the same name.
- **A** and **AAAA** hold addresses directly and need updating when those change.
- **TXT** values are quoted strings; a verification record pasted without its quotes fails validation.
- **MX** values carry a priority before the host.

Prefer an alias for an AWS target. It removes a class of stale-address incidents entirely.

## Change deliberately

```bash
cat > change.json <<'JSON'
{
  "Comment": "point api at the new load balancer",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "TARGET_ZONE",
          "DNSName": "TARGET_DNS_NAME",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
JSON
aws route53 change-resource-record-sets --hosted-zone-id ZONE_ID \
  --change-batch file://change.json --profile PROFILE
aws route53 get-change --id CHANGE_ID --profile PROFILE --query 'ChangeInfo.Status'
```

`UPSERT` replaces the record if it exists and creates it otherwise, which is safer than `DELETE` followed by `CREATE` — that pair leaves the name unresolvable in between. A `DELETE` must match the existing record exactly, including its time-to-live, or it fails.

Read the current record and show it before the change. Get approval for the exact name, type, and new value when the record serves live traffic.

`get-change` reporting `INSYNC` means Route 53 has propagated to its own nameservers. It does **not** mean resolvers worldwide have new answers — they hold the old one until the previous time-to-live expires.

## Plan a cutover with time-to-live

The sequence, and each step matters:

1. **Lower the time-to-live first** — to 60 seconds — and wait for the *old* value to expire. This is the step that makes the cutover fast and the one most often skipped.
2. **Change the record** once caches are short.
3. **Verify** from several resolvers.
4. **Raise the time-to-live** back to a normal value once the change is confirmed good.

```bash
dig +short NAME @8.8.8.8
dig +short NAME @1.1.1.1
dig +short NAME @"$(aws route53 get-hosted-zone --id ZONE_ID --query 'DelegationSet.NameServers[0]' --output text --profile PROFILE)"
```

Query the zone's own nameserver and at least two public resolvers. Agreement across all three is the real confirmation; the authoritative answer alone tells you nothing about caches.

Changing a record with a long time-to-live still in effect means some clients keep the old answer for that long, and there is no way to flush them. That is the reason for step one.

## Health checks and failover

```bash
aws route53 list-health-checks --profile PROFILE \
  --query 'HealthChecks[].{Id:Id,Type:HealthCheckConfig.Type,Target:HealthCheckConfig.FullyQualifiedDomainName}'
aws route53 get-health-check-status --health-check-id CHECK_ID --profile PROFILE \
  --query 'HealthCheckObservations[].StatusReport.Status'
```

A failover routing policy needs a health check on the primary, and `EvaluateTargetHealth` on an alias only helps when the target reports health meaningfully. Test a failover deliberately in a non-production zone before relying on it; an untested failover usually has one missing piece.

## Report

State the hosted zone, whether it is public or private, and whether its delegation matches the domain's registered nameservers; the record name, type, previous value, and new value; the time-to-live plan and where in it the change sits; the change status; and the resolved answers from the authoritative nameserver and at least two public resolvers. Say plainly how long stale answers may persist and how to roll back.
