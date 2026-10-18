---
name: "speckit-git-commit"
description: "Commit the working tree with a conventional commit message and push it to origin. Runs automatically after /speckit-implement via the after_implement hook in .specify/extensions.yml."
argument-hint: "Optional commit message override"
compatibility: "Requires a git repository with an origin remote (use gh to create one)"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

If the input is non-empty, use it as the commit subject instead of generating one.

## Purpose

Commit and push the work produced by `/speckit-implement`. This runs as a mandatory
`after_implement` hook (see `.specify/extensions.yml`). The user explicitly authorized the commit
and the push for this hook.

## Steps

1. Run `git rev-parse --git-dir`. If it fails, stop and tell the user this is not a git repository.
2. Run `git remote get-url origin`. If it fails, still commit, skip the push and tell the user no
   `origin` remote exists (they can create one with `gh repo create <name> --private --source=. --remote=origin`).
3. Run `git status --short`. If there are no changes, report "nothing to commit" and stop.
4. Before staging, scan the changed paths. Do NOT stage secrets or build output: `.env*`, `*.pem`,
   `*.key`, `node_modules/`, `dist/`. If one is untracked and not covered by `.gitignore`, leave it
   out and mention it. Then stage with `git add -A`.
5. Determine the feature: read `feature_directory` from `.specify/feature.json` (for example
   `specs/003-create-course-button`) and use its short name for the message.
6. Compose a Conventional Commit message (constitution: `feat:`, `fix:`, `chore:`, ...):
   - Subject: `feat: <short feature name in words>` for new behavior, `fix:` for bug fixes,
     `chore:` / `docs:` / `refactor:` when that fits the diff better. Max 72 characters.
   - Body: 2 to 4 lines summarizing what changed, derived from `git diff --cached --stat`
     and the tasks completed in `<feature_directory>/tasks.md`.
   - End with the attribution trailer given in the conversation's system reminder
     (`Co-Authored-By: ...`), when one is present.
7. Commit with `git commit` (pass the message through a heredoc). Never use `--no-verify` and never amend.
8. Push with `git push` (use `git push -u origin HEAD` if the branch has no upstream). Never force
   push. If the push fails, report the error and stop; do not retry with different flags.
9. Report the short commit hash, the branch, and the push result.
