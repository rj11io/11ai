---
name: 11ai-operator-aws-secrets
description: "Read, create, and rotate values in AWS Secrets Manager and SSM Parameter Store without printing them, covering listing by name, retrieving a single field, versions and staging labels, rotation, encryption keys, resource policies, and choosing between the two stores. Use when an application needs a secret or parameter, when a value must be created or rotated, or when a secret has to be inspected without disclosing it."
---
# 11ai AWS secrets and parameters

The whole discipline of this skill is retrieving a value without disclosing it. A secret printed into a terminal is in shell history, in scrollback, and in this transcript, which means it must be treated as rotated. Work with names, metadata, and targeted fields; print a value only when the user explicitly asks and understands it is now exposed.

## Inspect without disclosing

```bash
aws secretsmanager list-secrets --profile PROFILE --region REGION \
  --query 'SecretList[].{Name:Name,Rotation:RotationEnabled,Changed:LastChangedDate}'
aws secretsmanager describe-secret --secret-id NAME --profile PROFILE --region REGION
aws ssm describe-parameters --profile PROFILE --region REGION \
  --query 'Parameters[].{Name:Name,Type:Type,Version:Version}'
```

`describe-secret` returns metadata — rotation state, versions, staging labels, the encryption key — and never the value. It answers most questions on its own: whether the secret exists, when it last changed, and whether rotation is configured.

To confirm a value exists and is well-formed without revealing it:

```bash
aws secretsmanager get-secret-value --secret-id NAME --query 'length(SecretString)' \
  --profile PROFILE --region REGION
aws secretsmanager get-secret-value --secret-id NAME --query 'SecretString' --output text \
  --profile PROFILE --region REGION | jq -r 'keys[]'
```

The first prints a length, the second prints the JSON key names. Both prove the shape without exposing the contents.

When one field is genuinely needed by a command, pipe it rather than displaying it:

```bash
aws secretsmanager get-secret-value --secret-id NAME --query 'SecretString' --output text \
  --profile PROFILE --region REGION | jq -r '.password' | some-command --password-stdin
```

## Choose the right store

- **Secrets Manager** for credentials that rotate: database passwords, API keys, tokens. It supports automatic rotation, cross-region replication, and resource policies, and it costs per secret.
- **Parameter Store** for configuration. `String` and `StringList` for plain values, `SecureString` for encrypted ones. The standard tier is free and has no rotation.

A value that must rotate belongs in Secrets Manager. A feature flag or an endpoint URL belongs in Parameter Store. Putting a rotating credential in a plain `String` parameter is the mistake worth catching, because it is then readable by anyone with parameter access and never rotated.

## Create and update

```bash
aws secretsmanager create-secret --name NAME --description "what uses this" \
  --secret-string file://secret.json --kms-key-id KEY_ID --profile PROFILE --region REGION
aws ssm put-parameter --name /SERVICE/prod/FEATURE --value VALUE --type String \
  --profile PROFILE --region REGION
aws ssm put-parameter --name /SERVICE/prod/TOKEN --value file://token.txt --type SecureString \
  --key-id KEY_ID --overwrite --profile PROFILE --region REGION
```

Never pass a secret with `--secret-string 'literal'`. It lands in shell history and in the process list where any user on the machine can read it. Use `file://` and delete the file afterwards, or have the user set the value in the console.

Never accept a secret value through this conversation. Ask the user to place it in a file or set it themselves, and work from the name.

Name parameters hierarchically — `/SERVICE/ENVIRONMENT/KEY` — so a path-based read fetches exactly one environment's configuration and an access policy can be scoped to a prefix.

## Rotate and version

```bash
aws secretsmanager rotate-secret --secret-id NAME --profile PROFILE --region REGION
aws secretsmanager list-secret-version-ids --secret-id NAME --profile PROFILE --region REGION
aws secretsmanager get-secret-value --secret-id NAME --version-stage AWSPREVIOUS \
  --query 'length(SecretString)' --profile PROFILE --region REGION
```

Rotation moves the `AWSCURRENT` label to a new version and `AWSPREVIOUS` to the old one, which is what lets a consumer still holding the old value keep working briefly. That window is short: any consumer caching the secret must refetch, so confirm every consumer before rotating a shared credential.

Rotating a database password without updating the consumers is an outage. Establish who reads the secret first, and prefer a rotation function that changes the credential at the source and the secret together.

`delete-secret` schedules deletion after a recovery window; with `--force-delete-without-recovery` it is immediate and unrecoverable. Require explicit approval naming the secret for either.

## Report

State the account, region, and the secret or parameter **name**, its type and store, whether rotation is enabled, the version or staging label acted on, and what changed — created, updated, rotated, or scheduled for deletion. Report values only as present, absent, or by length and key names. If any value was printed, say so plainly and recommend rotating it.
