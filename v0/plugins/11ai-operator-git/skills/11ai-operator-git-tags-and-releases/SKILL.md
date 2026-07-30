---
name: 11ai-operator-git-tags-and-releases
description: "Create, sign, publish, and correct Git tags, covering annotated versus lightweight tags, semantic version naming, signing and verification, pushing a single tag rather than all of them, listing and describing the nearest tag, and the rules for retagging a tag that has already been published. Use when a release must be tagged, when a tag must be signed or verified, when a tag points at the wrong commit, or when a tag must be deleted locally and remotely."
---
# 11ai Git tags and releases

A published tag is a promise: anyone who fetched it has that name pinned to that commit, and moving it silently gives two people different code under one version. Establish whether a tag has been pushed before changing anything about it — that single fact decides whether a fix is trivial or a coordinated operation.

## Inspect first

```bash
git tag --list --sort=-v:refname | head -20
git tag --list 'v1.*' --format='%(refname:short) %(objecttype) %(creatordate:short) %(subject)'
git describe --tags --always
git show TAG --stat --no-patch
git ls-remote --tags origin | tail -20
```

Compare local tags with `git ls-remote --tags origin`. A tag present locally and absent remotely is unpublished and safe to move; a tag present remotely is published and must not be moved.

`%(objecttype)` distinguishes the two kinds: `tag` is annotated, `commit` is lightweight.

## Create an annotated tag

```bash
git tag -a v1.4.0 -m "Release 1.4.0"
git tag -a v1.4.0 COMMIT -m "Release 1.4.0"
git tag -s v1.4.0 -m "Release 1.4.0"
```

Use annotated tags for releases. An annotated tag is a real object carrying a tagger, a date, and a message, and it can be signed; a lightweight tag is just a pointer with no record of who made it or when. `git describe` also prefers annotated tags.

Before tagging, confirm the commit is the one intended and that it is on the branch you think:

```bash
git log -1 --format='%H %s' COMMIT
git branch --contains COMMIT
git status --porcelain
```

Tag a commit that exists on the remote branch. Tagging a local-only commit publishes a name pointing at code nobody else has.

Follow the repository's existing naming exactly — read `git tag --list` rather than assuming a `v` prefix. Version-order sorting with `--sort=-v:refname` reveals the convention quickly.

For signing, set the key up once and verify it works:

```bash
git config --get user.signingkey
git tag -v v1.4.0
```

`git tag -v` verifies the signature. A tag that shows as verified on the hosting platform but not locally usually means the local allowed-signers list is missing, not that the tag is bad.

## Publish one tag at a time

```bash
git push origin v1.4.0
git push origin --follow-tags
```

Push the specific tag. `git push --tags` publishes **every** local tag, including experiments and half-finished ones, and unpublishing them is the awkward operation this skill exists to avoid. `--follow-tags` pushes only annotated tags reachable from what is being pushed, which is a reasonable default for a release commit.

Pushing a tag is externally visible: it can trigger a release pipeline, publish a package, or notify people. Confirm the tag name and the commit before pushing, and check whether a pipeline is triggered by tag pattern.

## Correct a tag

If the tag has **not** been pushed, move it:

```bash
git tag -d v1.4.0
git tag -a v1.4.0 CORRECT_COMMIT -m "Release 1.4.0"
```

If the tag **has** been pushed, prefer a new version. Moving a published tag means anyone who already fetched it keeps the old commit, caches and mirrors may keep serving it, and a build that pinned the version is no longer reproducible. Issue `v1.4.1` instead and say why.

When a published tag genuinely must be removed — it exposed a secret, or it shipped something legally unusable — treat it as a coordinated operation:

```bash
git push origin --delete v1.4.0
git tag -d v1.4.0
```

Get explicit approval naming the tag, tell everyone who may have fetched it, and check whether an artifact was already published from it. Deleting the tag does not unpublish a package built from it, and it does not remove the commit.

## Verify and report

```bash
git tag --list 'v1.4.*' --format='%(refname:short) %(objecttype) %(*objectname:short)'
git ls-remote --tags origin | grep v1.4.0
git describe --tags
git tag -v v1.4.0
```

Confirm the tag exists locally and remotely, points at the intended commit, and verifies if signed.

Report the tag name, whether it is annotated and signed, the commit it points at with its subject, whether it was already published, exactly what was pushed or deleted, any pipeline the tag triggers, and the verification output. When a published tag was moved or deleted, say who needs to be told and what may already have been built from it.
