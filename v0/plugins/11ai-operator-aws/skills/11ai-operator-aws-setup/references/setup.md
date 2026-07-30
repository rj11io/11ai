# AWS CLI setup reference

## Install version 2

macOS, using the official installer package:

```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

Linux, x86_64:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

On Apple silicon or ARM Linux, use the matching architecture archive. On Windows, use the MSI installer.

```bash
aws --version
```

Two things to avoid. Do not install with `pip install awscli`, which pins version 1 and mixes the CLI into a Python environment that other work can break. Do not install version 2 alongside a version 1 that is earlier on `PATH`; check with `which -a aws`.

## Where configuration lives

Two files, and the split matters:

- `~/.aws/config` holds profiles, regions, output formats, single sign-on settings, and role assumption. Safe to review.
- `~/.aws/credentials` holds long-lived access keys. Never print it, never commit it, never paste from it.

Profiles other than the default carry a `profile` prefix in `config` but not in `credentials`.

## Single sign-on profile

The interactive flow asks for the start URL and region, opens a browser, then lets you pick the account and role:

```bash
aws configure sso --profile PROFILE
```

It writes something close to this:

```ini
[profile PROFILE]
sso_session = ORG
sso_account_id = 111122223333
sso_role_name = PowerUserAccess
region = eu-west-1
output = json

[sso-session ORG]
sso_start_url = https://ORG.awsapps.com/start
sso_region = eu-west-1
sso_registration_scopes = sso:account:access
```

Sessions expire. Renew with:

```bash
aws sso login --profile PROFILE
```

An expired session usually reports a token or refresh error rather than an access denial. Log in again before investigating permissions.

## Static access keys

Only when the organization has no single sign-on. The user runs this themselves and pastes nothing back:

```bash
aws configure --profile PROFILE
```

```ini
[profile PROFILE]
region = eu-west-1
output = json
```

Keys go in `~/.aws/credentials` under the bare profile name. Rotate them on a schedule and delete the profile when the work is done.

## Assumed roles

Point a profile at the profile that holds the real credentials. Do not copy credentials into a second entry.

```ini
[profile prod-admin]
role_arn = arn:aws:iam::444455556666:role/AdminRole
source_profile = PROFILE
region = eu-west-1
```

With multi-factor authentication required, add the device and let the CLI prompt for the code:

```ini
[profile prod-admin]
role_arn = arn:aws:iam::444455556666:role/AdminRole
source_profile = PROFILE
mfa_serial = arn:aws:iam::111122223333:mfa/DEVICE
duration_seconds = 3600
```

For a profile that assumes a role through single sign-on credentials, use `source_profile` pointing at the single sign-on profile.

## Credential precedence

The CLI resolves credentials in this order, and the first match wins:

1. Command line options such as `--profile` and `--region`.
2. Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_PROFILE`, `AWS_REGION`.
3. The `~/.aws/credentials` file.
4. The `~/.aws/config` file, including single sign-on and role assumption.
5. Container credentials, then instance metadata on EC2.

This order explains most wrong-account incidents: a shell exported `AWS_PROFILE` weeks ago and it now outranks the profile named in a script. Check it before anything else:

```bash
aws configure list --profile PROFILE
env | grep -c '^AWS_'
```

The `Type` column in `aws configure list` names the source of each value. Use `grep -c` so a stray secret is counted rather than printed.

## Region and output

```bash
aws configure set region eu-west-1 --profile PROFILE
aws configure set output json --profile PROFILE
```

Region is not global. A resource created in one region is invisible from another, and several services are region-scoped in ways that produce a confusing not-found rather than a wrong-region error.

## Verify

```bash
aws sts get-caller-identity --profile PROFILE
```

```json
{
  "UserId": "AROAEXAMPLE:session-name",
  "Account": "111122223333",
  "Arn": "arn:aws:sts::111122223333:assumed-role/PowerUserAccess/session-name"
}
```

Read all three fields against the intended target. Then make one harmless service read that the actual work needs — listing buckets proves S3 access and nothing else.

## Cleanup

```bash
aws sso logout --profile PROFILE
```

Remove a temporary profile by deleting its block from `~/.aws/config`, and delete any static keys in the console as well as on disk. A key removed locally still works until it is deleted or deactivated in IAM.
