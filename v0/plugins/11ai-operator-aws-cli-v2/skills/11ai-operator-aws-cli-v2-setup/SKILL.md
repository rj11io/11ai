---
name: 11ai-operator-aws-cli-v2-setup
description: "Install the AWS CLI and configure profiles, IAM Identity Center single sign-on, static access keys, role assumption, default regions, output formats, and credential precedence, then verify the identity the CLI actually resolves. Use when the AWS CLI is missing or out of date, when a profile must be created or repaired, when single sign-on needs configuring, or when the user asks how to get credentials working on a new machine."
---

# AWS setup

Version baseline: AWS CLI v2, using the latest stable v2 patch available for the host platform (2.36.x at this review). Reject AWS CLI v1-only behavior and inspect aws --version plus the live v2 command help before composing commands.

This is the one AWS skill that changes the machine, so name the target before touching it: which account, which role, which region, and which way credentials are meant to arrive. Everything after that is inspection, and `11ai-operator-aws-cli-v2-environment` owns it.

## Gather the target first

Ask for, or read from the project, all of:

- the account number or alias, and whether more than one account is in play;
- the authentication method the organization uses — IAM Identity Center single sign-on, static access keys for an IAM user, or a role assumed from another profile;
- the profile name the project's scripts and documentation already expect;
- the default region and output format;
- whether a session must be short-lived, which multi-factor prompts appear, and whether a permission boundary applies.

Single sign-on is the default answer for an organization. Static access keys are long-lived credentials that sit on disk until someone rotates them, so treat a request for them as a decision to confirm, not a shortcut to take.

## Install the CLI

```bash
aws --version
```

Install version 2 through the operating system's documented installer. Do not install the CLI with `pip`, and do not upgrade an existing installation as a side effect of adding a profile — an upgrade changes command output and can break the project's scripts.

## Configure a profile

For single sign-on, the interactive flow writes the profile and never stores a long-lived secret:

```bash
aws configure sso --profile PROFILE
aws sso login --profile PROFILE
```

For an assumed role, add a profile that names its source profile rather than copying credentials into a second place. Read [references/setup.md](references/setup.md) for the config file shapes, the credential precedence order, the multi-factor and role-assumption entries, and what belongs in `config` versus `credentials`.

Never take an access key or a session token through the terminal: it lands in shell history and in this transcript. If static keys are genuinely required, have the user run `aws configure --profile PROFILE` themselves and paste nothing back.

## Verify

```bash
aws sts get-caller-identity --profile PROFILE
aws configure list --profile PROFILE
```

Confirm the resolved account, the role or user in the returned ARN, and the region — and confirm they match the target that was agreed, not merely that the command succeeded. `aws configure list` shows where each value came from, which is how a stray `AWS_PROFILE` or `AWS_REGION` environment variable gets caught.

Then run one harmless read against the service the work actually needs. An identity that resolves is not the same as an identity that is authorized.

## Guardrails

- Never print or echo an access key, a secret key, a session token, or the contents of `~/.aws/credentials`.
- Never commit `~/.aws/config` or `~/.aws/credentials`, and never write credentials into a repository, a Dockerfile, or a `.env` file that is not already ignored.
- Do not create IAM users, access keys, or policies to make setup work; that is an account change belonging to `11ai-operator-aws-cli-v2-iam` and needs its own approval.
- Do not set `AWS_ACCESS_KEY_ID` and friends in a shell profile when a named profile will do. Environment variables outrank profiles and cause the wrong-account failures that are hardest to see.
- Leave an existing working profile alone. Add a new named profile instead of editing the default one.
- Report the profile name, account, role, region, and verification output, with secrets redacted. If the identity resolves but a service call is denied, hand off to `11ai-operator-aws-cli-v2-iam`.
