# AWS triage matrix

Use this as a routing aid. Confirm the exact service error and account context before choosing a remediation.

| Symptom or error family | First evidence | Common boundary | Safe next step |
| --- | --- | --- | --- |
| `Unable to locate credentials`, `ExpiredToken`, SSO failure | `aws configure list`, `aws sts get-caller-identity` | Credential source or session | Resolve profile and authentication state; do not create new keys automatically |
| `AccessDenied`, `UnauthorizedOperation` | Caller ARN, action, resource ARN, region, IAM simulation where possible | IAM or resource policy, boundary, SCP | Compare policy evidence; request least-privileged change |
| `ResourceNotFoundException`, `ValidationError` | Exact name/ARN, region, account, resource status | Wrong identifier, region, or lifecycle state | Re-query the resource in the resolved context |
| `ThrottlingException`, `RequestLimitExceeded` | Request rate, retry behavior, service quota, timestamps | API rate or quota | Bound retries and inspect quota; do not blindly loop |
| ECS tasks stop or service is unstable | Service events, stopped task reason, container exit code, image digest, target health | Image, capacity, app, health check, or network | Inspect the first failing task and deployment before force-new-deployment |
| Lambda returns `FunctionError` or times out | Function config, qualifier, request ID, log stream, duration | Code, dependency, permissions, VPC, timeout, concurrency | Correlate one invocation with logs; avoid increasing timeout by guesswork |
| EC2 is unreachable | Instance state checks, routes, security groups, NACLs, listener, access method | Instance, network path, port, or credential | Confirm the intended access path; do not open broad ingress |
| CloudFormation `UPDATE_ROLLBACK_FAILED` | Latest stack events, failed resource, change set, physical ID | Provider resource or rollback state | Preserve events and identify the first failure before continuing rollback |
| S3 `AccessDenied` or missing object | Bucket region, `head-object`, key spelling, caller ARN, bucket policy status | Key, region, IAM, bucket policy, or encryption | Re-check exact key and policy evidence; do not make the bucket public |
| Logs appear empty | Log group/stream, UTC window, ingestion delay, filter pattern, log driver | Wrong scope, time, stream, or no emission | Widen one dimension at a time and verify the producer |

Always preserve the original error text and request ID. The matrix suggests evidence, not permission to change production state.
