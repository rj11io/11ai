---
name: 11ai-security-placeholder
description: "A stand-in for the 11ai-security plugin while its real skills are built: threat modeling, secure-coding review, and secrets handling. It runs no checks itself. Use it to learn what this plugin is for, and read the 11ai-audit plugin instead if you want a security check that works today."
---

# 11ai Security Placeholder

## What this skill does right now

Nothing scans, checks, or reports here yet. This skill is a sign-post: it tells
you what the `11ai-security` plugin is for, and points you to the security
skill that already works, [`11ai-audit`](../../../11ai-audit/README.md), so
you are not stuck waiting on this one.

## What "11ai-security" will hold once it is built

Picture a skill that reads a login form and flags: "an attacker could try a
password ten thousand times a second here, with nothing to slow them down."
That is the kind of check this plugin is meant to house — checks that look for
ways a system could be attacked, not just for bugs. Three planned areas:

- **Threat modeling** — walk through a design before it is built, and list the
  ways someone could break in.
- **Secure-coding review** — read a code change and flag risky patterns, such
  as a database command built by pasting user-supplied text straight into it
  (called SQL injection), or a password saved directly in a file instead of a
  dedicated secret-storage tool.
- **Secrets handling** — rules for keeping API keys, tokens, and passwords out
  of source code and log files, so they cannot leak if the code is shared or a
  log is read by the wrong person.

## If you are the one building the next skill here

Two things already exist and should shape what you write:

1. [`11ai-audit`](../../../11ai-audit/README.md) — the plugin already doing
   security work in this repository. Read it first so the new skill does not
   repeat it.
2. [`v0/scripts/validate-skills.mjs`](../../../../scripts/validate-skills.mjs)
   — the script that checks every skill's file layout, wording, and links. It
   is the final word on what counts as valid here; read it before writing
   anything.

Once a real skill lands, delete this file, add the new skill under `skills/`,
and update this plugin's [README](../../README.md) and its two manifest files
(`.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`) the same way
every other 11ai plugin does it.
