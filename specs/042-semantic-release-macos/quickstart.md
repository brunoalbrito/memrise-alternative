# Quickstart Validation Guide: Semantic Release Automation

**Date**: 2026-10-23 | **Feature**: [spec.md](spec.md) | **Workflow**: [contracts/release-workflow.md](contracts/release-workflow.md)

This guide provides runnable validation scenarios to confirm the semantic release automation works end-to-end.

---

## Prerequisites

- [ ] Repository has GitHub Actions enabled
- [ ] `.github/workflows/release.yml` is deployed
- [ ] `semantic-release` and dependencies installed in package.json
- [ ] Main branch is protected (no direct pushes)
- [ ] At least one git tag exists (e.g., v0.1.0)

---

## Scenario 1: Merge Feature → Verify Minor Version Bump

**Objective**: Confirm that merging a feature PR bumps the minor version.

**Setup**:
1. Last release: v1.0.0 (verify with `git tag`)
2. Create feature branch: `git checkout -b feature/test-feature`

**Steps**:
1. Make code changes
2. Commit with feature message:
   ```bash
   git commit -m "feat: add new dashboard widget"
   ```
3. Create PR on GitHub
4. Merge PR to main
5. GitHub Actions triggers automatically

**Expected Outcome**:
- [ ] GitHub Actions workflow runs successfully
- [ ] New Git tag created: `v1.1.0` (verify with `git tag`)
- [ ] GitHub Release published at `/releases/tag/v1.1.0`
- [ ] DMG/PKG files attached to release
- [ ] Changelog includes commit message

**Validation Command**:
```bash
git fetch --tags
git tag | grep v1.1.0
```

---

## Scenario 2: Merge Bugfix → Verify Patch Version Bump

**Objective**: Confirm that merging a bugfix PR bumps only the patch version.

**Setup**:
1. Last release: v1.1.0 (from Scenario 1)
2. Create bugfix branch: `git checkout -b bugfix/fix-widget-crash`

**Steps**:
1. Make code changes (bugfix)
2. Commit with fix message:
   ```bash
   git commit -m "fix: prevent widget crash on empty data"
   ```
3. Create PR on GitHub
4. Merge PR to main
5. GitHub Actions triggers

**Expected Outcome**:
- [ ] New Git tag created: `v1.1.1`
- [ ] GitHub Release published at `/releases/tag/v1.1.1`
- [ ] DMG/PKG files attached
- [ ] Changelog entry: "fix: prevent widget crash"

**Validation Command**:
```bash
git fetch --tags
git tag -l "v1.1.*"  # Should show v1.1.0, v1.1.1
```

---

## Scenario 3: Merge Breaking Change → Verify Major Version Bump

**Objective**: Confirm that breaking changes trigger a major version bump.

**Setup**:
1. Last release: v1.1.1 (from Scenario 2)
2. Create branch: `git checkout -b feature/breaking-ipc-change`

**Steps**:
1. Make a code change that alters the IPC interface (e.g., change in `electron/preload.ts`)
2. Commit with breaking change marker:
   ```bash
   git commit -m "feat: redesign IPC interface

   BREAKING CHANGE: IPC method names changed from camelCase to snake_case"
   ```
3. Create PR and merge
4. GitHub Actions triggers

**Expected Outcome**:
- [ ] New Git tag created: `v2.0.0` (major bump)
- [ ] GitHub Release published at `/releases/tag/v2.0.0`
- [ ] Changelog clearly marks "BREAKING CHANGE"
- [ ] Release notes prominently display breaking change

**Validation Command**:
```bash
git fetch --tags
git describe --tags  # Should show v2.0.0
```

---

## Scenario 4: Feature Branch Merge → Verify Pre-release Tag

**Objective**: Confirm that merging to a non-main branch creates a pre-release version.

**Setup**:
1. Main branch is at v2.0.0
2. Create development branch: `git checkout -b develop`
3. Create feature on develop: `git checkout -b feature/new-component`

**Steps**:
1. Make code changes
2. Commit with feature message:
   ```bash
   git commit -m "feat: implement new component for experiment"
   ```
3. Push to origin (no PR; direct push to develop branch)
4. GitHub Actions triggers on the develop branch push

**Expected Outcome**:
- [ ] New tag created with pre-release suffix: `v2.1.0-beta.1` (or equivalent)
- [ ] GitHub Release marked as "Pre-release" checkbox checked
- [ ] Release visible on Releases page but not in "Latest Release"
- [ ] DMG/PKG files attached for testing

**Validation Command**:
```bash
git fetch --tags
git tag | grep beta  # Should show v2.1.0-beta.1
```

---

## Scenario 5: Build Failure → Verify Cleanup

**Objective**: Confirm that build failures clean up orphaned tags and releases.

**Setup**:
1. Introduce a build error in the source code
2. Create branch: `git checkout -b feature/intentional-error`
3. Commit and create PR

**Steps**:
1. Add code that fails TypeScript check:
   ```typescript
   // intentional error: missing type annotation
   const x = 5;
   const y: string = x;  // Type error
   ```
2. Merge PR to main
3. GitHub Actions triggers but fails during build

**Expected Outcome**:
- [ ] Workflow fails at "Build macOS" step
- [ ] No GitHub Release created
- [ ] No Git tag created in repository (or tag is deleted if partially created)
- [ ] GitHub Actions logs show build error
- [ ] No orphaned assets

**Validation Command**:
```bash
# Check GitHub Actions logs for error
# Verify no new tag was created:
git fetch --tags
git tag | wc -l  # Count should not increase
```

---

## Scenario 6: No Versioning Commits → Verify No Release

**Objective**: Confirm that merges with no feat:/fix: commits don't trigger releases.

**Setup**:
1. Last release: v2.0.0
2. Create branch: `git checkout -b chore/update-docs`

**Steps**:
1. Update only documentation (no code changes affecting functionality)
2. Commit with chore message:
   ```bash
   git commit -m "chore: update README with new screenshots"
   ```
3. Merge PR to main

**Expected Outcome**:
- [ ] GitHub Actions runs
- [ ] No new Git tag created
- [ ] No GitHub Release created
- [ ] Workflow completes successfully (no error)
- [ ] Latest release remains v2.0.0

**Validation Command**:
```bash
git fetch --tags
git describe --tags  # Should still be v2.0.0
```

---

## Manual Verification Checklist

After running all scenarios, verify:

- [ ] All stable releases (v1.0.0+) have DMG and/or PKG assets
- [ ] All pre-releases have "Pre-release" checkbox checked on GitHub
- [ ] Changelogs are readable and include commit messages
- [ ] All Git tags are annotated or lightweight (consistent format)
- [ ] Release notes mention breaking changes clearly
- [ ] No orphaned tags in git history
- [ ] GitHub Actions logs are accessible for debugging

---

## Troubleshooting

**Issue**: Workflow fails with "Token permission error"
- **Fix**: Check GitHub Actions token permissions in repo settings; ensure `write:releases` scope

**Issue**: Assets not uploaded
- **Fix**: Check `pnpm package` output; verify DMG/PKG files exist in `release/` directory

**Issue**: Pre-release suffix not working
- **Fix**: Verify branch protection is enabled on main; feature branch detection relies on branch name

**Issue**: Changelog is empty
- **Fix**: Verify commits follow Conventional Commits format (feat:, fix:, chore:)

---

## Next Steps

Once all scenarios pass:
1. Run `/speckit-tasks` to break down implementation into tasks
2. Run `/speckit-implement` to execute implementation
3. Monitor first few releases to ensure stability
4. Adjust configurations based on feedback

---

## Success Criteria (from spec.md)

- [x] Each merge to main produces a release within 5 minutes
- [x] 100% of releases follow semantic versioning
- [x] 100% of builds produce installer files
- [x] No manual version management required
- [x] Changelog auto-generated
- [x] Build failures trigger cleanup

All scenarios above directly validate these criteria.
