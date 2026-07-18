---
name: 11ai-aws-iam
description: "Inspect AWS IAM users, roles, policies, permission boundaries, trust relationships, and simulated access without weakening security. Use when an action is denied, a role is unclear, or access needs evidence-based analysis."
---

# AWS IAM

Treat IAM as a security-sensitive, mostly read-only domain. Establish the caller identity and account first. Never solve an access problem by attaching `AdministratorAccess`, using `*` resources, disabling a boundary, or making a resource public without a reviewed authorization decision.

## Inspect an identity

```bash
aws sts get-caller-identity --profile PROFILE --region REGION
aws iam get-user --user-name USER --profile PROFILE
aws iam get-role --role-name ROLE --profile PROFILE
aws iam list-attached-user-policies --user-name USER --profile PROFILE
aws iam list-attached-role-policies --role-name ROLE --profile PROFILE
aws iam list-user-policies --user-name USER --profile PROFILE
aws iam list-role-policies --role-name ROLE --profile PROFILE
aws iam list-role-tags --role-name ROLE --profile PROFILE
```

Inspect managed-policy ARNs, inline policy names, permission boundaries, tags, role trust policy, session context, and the resource ARN involved in the failure. Policy documents are sensitive operational data; quote only the relevant statements and redact account-specific values when sharing broadly.

## Inspect policy evidence

```bash
aws iam get-policy --policy-arn POLICY_ARN --profile PROFILE
aws iam get-policy-version --policy-arn POLICY_ARN --version-id VERSION_ID --profile PROFILE
aws iam get-role --role-name ROLE --query Role.AssumeRolePolicyDocument --output json --profile PROFILE
aws iam simulate-principal-policy --policy-source-arn PRINCIPAL_ARN --action-names ACTION --resource-arns RESOURCE_ARN --profile PROFILE
```

For an `AccessDenied` error, compare action, resource, region, condition keys, principal, identity policy, resource policy, permissions boundary, session policy, and organization SCP. IAM visibility is not complete proof that an SCP or external policy permits the action.

## Changes

Creating access keys, changing trust or permission policies, attaching or detaching policies, changing boundaries, creating users, and deleting identities are high-impact. Require explicit scope and review; prefer a narrowly scoped policy change with a rollback and an expiration plan. Never print access keys or secret values.

Conclude with the denied action, exact resource, caller, applicable allow or deny evidence, missing evidence, and the least-privileged next step.
