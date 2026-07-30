---
name: 11ai-operator-aws-vpc
description: "Inspect AWS networking and prove reachability, covering VPCs and subnets, route tables and gateways, security groups and network ACLs, the stateful versus stateless distinction, Reachability Analyzer, flow logs, and endpoints for private service access. Use when traffic cannot reach a resource, when a security group or route must be understood or changed, or when a network path must be proven rather than guessed."
---
# 11ai AWS VPC and reachability

Network problems are diagnosed by elimination, in one direction at a time, and almost every one comes down to a route, a security group, or a network ACL. Prove each hop rather than inferring it — AWS has a tool that evaluates the whole path, so guessing is never necessary.

## Inspect the topology

```bash
aws ec2 describe-vpcs --profile PROFILE --region REGION \
  --query 'Vpcs[].{Id:VpcId,Cidr:CidrBlock,Default:IsDefault}'
aws ec2 describe-subnets --filters Name=vpc-id,Values=VPC_ID --profile PROFILE --region REGION \
  --query 'Subnets[].{Id:SubnetId,Cidr:CidrBlock,Az:AvailabilityZone,PublicIp:MapPublicIpOnLaunch}'
aws ec2 describe-route-tables --filters Name=vpc-id,Values=VPC_ID --profile PROFILE --region REGION \
  --query 'RouteTables[].{Id:RouteTableId,Subnets:Associations[].SubnetId,Routes:Routes[].{Dest:DestinationCidrBlock,Gw:GatewayId,Nat:NatGatewayId}}'
```

The route table is what makes a subnet public or private: a default route to an internet gateway means public, a default route to a NAT gateway means private with outbound access, and no default route means isolated. A resource placed in the wrong subnet is the most common cause of "it cannot reach the internet".

## Read the two filters that block traffic

```bash
aws ec2 describe-security-groups --group-ids SG_ID --profile PROFILE --region REGION \
  --query 'SecurityGroups[].{Id:GroupId,In:IpPermissions,Out:IpPermissionsEgress}'
aws ec2 describe-network-acls --filters Name=vpc-id,Values=VPC_ID --profile PROFILE --region REGION \
  --query 'NetworkAcls[].{Id:NetworkAclId,Subnets:Associations[].SubnetId,Rules:Entries}'
```

The distinction decides where to look:

- **Security groups are stateful.** An allowed inbound request is allowed back out automatically, so a missing egress rule rarely explains a failed reply. They are allow-only — there is no deny rule.
- **Network ACLs are stateless.** Both directions need a rule, and the reply arrives on an ephemeral high port. A network ACL that allows inbound 443 but not outbound ephemeral ports breaks the response, not the request, which looks like a timeout.

Network ACL rules are evaluated in number order and the first match wins, so a low-numbered deny masks every later allow.

A security group can reference another security group as its source, which is better than a CIDR: it keeps working when addresses change and expresses the intent — "the database accepts traffic from the application tier".

## Prove the path

```bash
aws ec2 create-network-insights-path --source SOURCE_ID --destination DEST_ID \
  --protocol tcp --destination-port 5432 --profile PROFILE --region REGION
aws ec2 start-network-insights-analysis --network-insights-path-id PATH_ID \
  --profile PROFILE --region REGION
aws ec2 describe-network-insights-analyses --network-insights-analysis-ids ANALYSIS_ID \
  --query 'NetworkInsightsAnalyses[0].{Reachable:NetworkPathFound,Blocker:Explanations}' \
  --profile PROFILE --region REGION
```

Reachability Analyzer evaluates routes, security groups, and network ACLs together and names the component that blocks the path. It is a read-only evaluation, it costs a small amount per analysis, and it removes the guesswork entirely — use it before changing any rule.

For traffic that is already flowing, flow logs show what actually happened:

```bash
aws ec2 describe-flow-logs --filter Name=resource-id,Values=VPC_ID --profile PROFILE --region REGION
aws logs filter-log-events --log-group-name LOG_GROUP \
  --filter-pattern '[version, account, eni, source, dest, srcport, destport="5432", protocol, packets, bytes, start, end, action="REJECT", status]' \
  --profile PROFILE --region REGION
```

A `REJECT` line names the interface and ports, which distinguishes a security group rejection from traffic that never arrived at all.

## Change narrowly

```bash
aws ec2 authorize-security-group-ingress --group-id SG_ID \
  --protocol tcp --port 5432 --source-group SOURCE_SG_ID --profile PROFILE --region REGION
aws ec2 revoke-security-group-ingress --group-id SG_ID \
  --protocol tcp --port 5432 --cidr 0.0.0.0/0 --profile PROFILE --region REGION
```

Rules that must not be added casually, because each one exposes a resource to the internet: `0.0.0.0/0` on port 22, on 3389, or on a database port. If a rule like that already exists, report it as a finding.

Before removing a rule, establish what depends on it — a security group is shared, and revoking an ingress rule can cut off a service nobody mentioned. Add first, verify, then remove.

Never open a range to make something work. Find the blocker with Reachability Analyzer and open exactly the port and source needed.

For private access to AWS services without a NAT gateway, use an endpoint rather than a route to the internet:

```bash
aws ec2 describe-vpc-endpoints --filters Name=vpc-id,Values=VPC_ID --profile PROFILE --region REGION \
  --query 'VpcEndpoints[].{Id:VpcEndpointId,Service:ServiceName,Type:VpcEndpointType,State:State}'
```

## Report

State the account, region, VPC, and the subnets involved with whether each is public or private; the security groups and network ACLs on the path with the specific rule that blocked or allowed it; the Reachability Analyzer verdict and the component it named; the exact rule added or removed with its protocol, port, and source; and the verification that the path now works. Flag any rule allowing `0.0.0.0/0` to an administrative or database port, and say what you confirmed before removing any rule.
