---
name: verify
description: Run full validation suite (typecheck, lint, unit tests, e2e) before pushing. Catches errors fast.
---

Run the complete test and validation pipeline to ensure all changes are ready:

1. **Type checking** — `pnpm typecheck`
2. **Linting** — `pnpm lint`
3. **Unit/integration tests** — `pnpm test`
4. **Build** — `pnpm build` (required for e2e)
5. **End-to-end tests** — `pnpm test:e2e`

If any step fails, stop and report the error. Use this before pushing or creating a PR.

**Time:** ~5-10 minutes depending on machine and e2e test count.

**Data safety:** E2e tests use temporary data folders. A guard (`tests/e2e/global-guard.ts`) verifies the dev and installed app folders were not modified. If the guard fails, something went wrong — don't push.
