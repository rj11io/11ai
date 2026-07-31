---
name: 11ai-operator-vercel-workflows-v4-human-approval
description: "Implement human-in-the-loop workflow approvals with immutable action previews, approver identity, authorization, expiry, denial, audit, and durable resume semantics. Use when a workflow proposes consequential action, must pause for review, or approval behavior is incorrect."
---
# 11ai Vercel Workflows v4 human approval

Approval must authorize one exact action, not a category of future behavior Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Inspect first

```bash
rg -n 'approve|approval|review|human|decision|deny|expires' TARGET
npm test --if-present -- TARGET
```

Map exact action, immutable inputs, effect and cost, approver role, channel, expiry, denial, changed-payload behavior, and audit record.

Confirm before changing:

- Specific human-readable action preview.
- Authorized approver identity.
- Expiry and one-time decision.
- Revalidation immediately before execute.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Hash or version the approved payload, persist decision and actor, and reject changed or expired actions before the side-effect step.

Never self-approve, reuse approvals, approve broad future actions, or bypass denial and expiry without explicit human authority Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test approve, deny, unauthorized, expired, duplicate, tampered payload, changed state, and execution failure after approval. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-workflows-v4-troubleshooting` and seams to `11ai-operator-vercel-workflows-v4-integrations`.
