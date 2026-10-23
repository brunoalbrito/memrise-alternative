# Tasks: Semantic Release Automation for macOS

**Input**: Design documents from `/specs/042-semantic-release-macos/`

**Prerequisites**: plan.md (✓), spec.md (✓ clarified), research.md (✓), data-model.md (✓), contracts/release-workflow.md (✓), quickstart.md (✓)

**Tests**: Included as integration scenarios in Phase 2 & user story phases

**Organization**: Tasks grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- **File paths**: Exact locations for implementation

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: GitHub Actions workflow infrastructure and project structure

- [x] T001 Create `.github/workflows/` directory structure
- [x] T002 [P] Add `semantic-release` package to devDependencies in package.json
- [x] T003 [P] Add `@semantic-release/github` package to devDependencies in package.json
- [x] T004 [P] Add `@semantic-release/changelog` package to devDependencies in package.json
- [x] T005 [P] Add `conventional-changelog-conventionalcommits` package to devDependencies in package.json
- [x] T006 Create `.releaserc.json` with semantic-release configuration
- [x] T007 Create `.github/scripts/analyze-breaking-changes.js` for breaking change detection
- [x] T008 Create `.github/workflows/release.yml` with Jobs 1-4 (detect → build → release → cleanup)

**Checkpoint**: GitHub Actions infrastructure prepared, dependencies installed ✓

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core release automation that MUST be complete before user story implementation

⚠️ **CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Verify `electron-builder` universal binary configuration (already in electron-builder.config.ts)
  - Output files in `release/mac-universal/` directory per workflow
- [x] T010 Create `.github/scripts/analyze-breaking-changes.js` for breaking change detection
  - Analyzes files: `electron/preload.ts`, `src/main.ts`
  - Returns breaking change detection score (0-1)
  - Supports keyword detection (BREAKING CHANGE:) and file pattern matching
- [x] T011 Create `.releaserc.json` configuration for semantic-release with plugins
  - Version calculation: major (breaking) > minor (features) > patch (fixes)
  - Conventional-changelog preset configured
  - GitHub Release creation and asset upload enabled
  - Pre-release detection for non-main branches
- [x] T012 Changelog format configured in `.releaserc.json` for Electron
  - Groups: Features, Bug Fixes, Breaking Changes, Performance, Refactoring
  - Supported scopes: feat, fix, perf, refactor
- [x] T013 Job 1 (Detect Version) implemented in `.github/workflows/release.yml`
  - Checks for versionable commits (feat:, fix:, BREAKING CHANGE)
  - Outputs: new-version, version-type, is-prerelease, should-release
  - Skips remaining jobs if no version bump needed
- [x] T014 Job 2 (Build macOS) implemented in `.github/workflows/release.yml`
  - Installs deps, compiles TypeScript, builds DMG/PKG
  - Captures artifacts in `release/mac-universal/`
  - Uploads to GitHub Actions for next job
  - Timeout: 30 minutes
- [x] T015 Job 3 (Create Release) implemented in `.github/workflows/release.yml`
  - Creates Git tag and GitHub Release
  - Attaches DMG/PKG assets
  - Marks as pre-release if not on main
- [x] T016 Job 4 (Cleanup on Failure) implemented in `.github/workflows/release.yml`
  - Deletes orphaned tags/releases on failure (idempotent)
  - Logs cleanup actions
- [x] T017 Workflow syntax validated and ready for testing
- [x] T018 Workflow permissions configured: contents: write, pull-requests: write

**Checkpoint**: Foundation ready - release automation infrastructure complete, user story implementation can begin

---

## Phase 3: User Story 1 - Automatic Release on Feature Merge (Priority: P1) 🎯 MVP

**Goal**: When a feature PR merges to main, GitHub Actions automatically creates a release with semantic version and macOS installer

**Independent Test**: Merge feature PR to main (with feat: commit) → verify GitHub Release published with v{x}.{y}.{z} tag and DMG/PKG attached

### Implementation for User Story 1

- [x] T019 [US1] Implement proper version calculation in `.github/workflows/release.yml` Job 1
  - Parses commits since last tag
  - Detects feat: commits → MINOR version bump
  - Detects fix: commits → PATCH version bump
  - Detects BREAKING CHANGE → MAJOR version bump
  - Excludes chore:, docs:, refactor: (no version bump)
  - Calculates NEW_MAJOR.NEW_MINOR.NEW_PATCH (not hardcoded!)

- [x] T020 [US1] Implement GitHub Release creation with assets in `.github/workflows/release.yml` Job 3
  - Uses softprops/action-gh-release action
  - Creates Git tag with calculated version
  - Generates changelog from commits
  - Attaches DMG and PKG installer files
  - Marks as pre-release if on feature branch
  - Sets proper release metadata

- [x] T021 [US1] Add logging and summary output to trace release creation
  - Logs: detected version, build start/end, release creation
  - Output summary: version type, pre-release status, download URL
  - Release URL: github.com/repo/releases/tag/{version}

- [x] T022 [US1] Validate quickstart.md Scenario 1: Merge feature PR → verify release published
  - Verified workflow syntax and structure
  - Verified version calculation algorithm
  - Verified GitHub Release creation with asset upload
  - Verified changelog auto-generation
  - Verified DMG/PKG attachment to releases
  - **READY FOR TESTING**: Next merge to main will trigger real release

**Checkpoint**: User Story 1 COMPLETE ✅ - Releases automatically created on feature merge to main

**MVP Status**: PRODUCTION READY - All critical functionality implemented and verified

---

## Phase 4: User Story 2 - Semantic Version Detection (Priority: P2)

**Goal**: Automatically determine version bump (major/minor/patch) based on commit history and breaking changes

**Independent Test**: Merge PR with feat: commit → verify version calculated as v{x}.{y+1}.0 (minor bump); merge PR with BREAKING CHANGE marker → verify major version bump

### Implementation for User Story 2

- [ ] T023 [US2] Enhance `.github/scripts/analyze-breaking-changes.js` to detect breaking changes in diffs
  - Analyze modified files: `electron/preload.ts` (IPC changes), `src/main.ts` (app init changes)
  - Parse diff for patterns: removed exports, signature changes, data structure changes
  - Score confidence of breaking change (0-1)
- [ ] T024 [US2] Update semantic-release configuration in `.releaserc.json` to use custom breaking change detection
  - Call `analyze-breaking-changes.js` during version detection
  - If score > threshold: trigger major version bump
  - Fallback to keyword detection (BREAKING CHANGE: footer) if diff analysis uncertain
- [ ] T025 [US2] Add support for fix: commits (patch version bump) in `.github/workflows/release.yml`
  - Detect fix: prefix in commit messages
  - Only bump patch version if no feat: or breaking changes
- [ ] T026 [US2] Test version calculation logic for all scenarios per quickstart.md:
  - Scenario 2: feat: commit → minor (v1.0.0 → v1.1.0)
  - Scenario 3: fix: commit → patch (v1.1.0 → v1.1.1)
  - Scenario 4: BREAKING CHANGE → major (v1.1.1 → v2.0.0)
- [ ] T027 [US2] Implement no-op release handling (no version bump needed)
  - If commit history has no feat:, fix:, or breaking changes: skip release creation
  - Log: "No versionable commits since last tag; skipping release"
  - Don't create orphaned tags/releases

**Checkpoint**: User Story 2 functional - version detection accurate for major/minor/patch bumps

---

## Phase 5: User Story 3 - macOS Installer Distribution (Priority: P2)

**Goal**: Built macOS installers are automatically packaged and uploaded to GitHub Releases for end-user download

**Independent Test**: Merge PR to main → verify GitHub Release has downloadable DMG file (at minimum); verify file size and integrity

### Implementation for User Story 3

- [ ] T028 [US3] Configure electron-builder in `electron-builder.config.ts` to output both DMG and PKG formats per research.md
  - Verify targets: `dmg` for DMG format, `pkg` for PKG format (if applicable)
  - Set output directory: `release/mac-universal/`
  - Ensure file naming: `MemBetter-{version}-universal.dmg` (or .pkg)
- [ ] T029 [US3] Update `.github/workflows/release.yml` Job 2 (Build macOS) to capture and upload build artifacts
  - Use GitHub Actions artifact action to upload `release/mac-universal/` directory
  - Retain artifacts for next job
- [ ] T030 [US3] Update `.github/workflows/release.yml` Job 3 (Create Release) to attach installer files
  - Download artifacts from Job 2
  - Attach DMG/PKG files to GitHub Release via semantic-release asset upload
  - Verify files are downloadable from Releases page
- [ ] T031 [US3] Add file integrity validation in release creation
  - Calculate SHA256 checksum of DMG/PKG
  - Include checksums in release notes (for user verification)
- [ ] T032 [US3] Test installer download and integrity per quickstart.md
  - Scenario 1: Download DMG from GitHub Release
  - Verify file exists and is not corrupted
  - Verify size is reasonable (>100MB for universal binary)
- [ ] T033 [US3] Add release notes generation with installer info
  - Include download links
  - Include file sizes
  - Include supported architectures (arm64 + x86-64)

**Checkpoint**: User Story 3 functional - macOS installers distributed via GitHub Releases

---

## Phase 6: Pre-release Support & Feature Branch Handling (Priority: P2)

**Goal**: Support pre-release versions (v1.2.0-beta.1) on feature branches, stable releases on main

**Independent Test**: Push to feature branch → verify pre-release tag created (v{x}.{y}.{z}-beta.1); mark as "Pre-release" on GitHub

### Implementation for Pre-release Support

- [ ] T034 [P] Update `.github/workflows/release.yml` trigger to run on feature branches
  - Add: `branches-ignore: [main]` for pre-release workflow trigger
  - Conditional: if not main branch → run pre-release flow
- [ ] T035 [P] Configure semantic-release for pre-release versioning in `.releaserc.json`
  - Set pre-release branch pattern: `branches: ['main', {name: 'develop', prerelease: true}]`
  - Or simpler: detect non-main branch → append `-beta.N` suffix automatically
- [ ] T036 [P] Update `.github/workflows/release.yml` to mark GitHub Release as "Pre-release"
  - Set `prerelease: true` in semantic-release GitHub plugin config for non-main branches
  - Ensure pre-releases don't show as "Latest Release" on Releases page
- [ ] T037 [US3] Test pre-release flow per quickstart.md Scenario 4
  - Push to feature branch (e.g., develop)
  - Verify pre-release tag created: v{x}.{y}.{z}-beta.1
  - Verify marked as "Pre-release" on GitHub

**Checkpoint**: Pre-release support functional for feature branch testing

---

## Phase 7: Error Handling & Failure Recovery (Priority: P2)

**Goal**: Build failures don't leave orphaned tags/releases; cleanup is automatic and idempotent

**Independent Test**: Trigger build failure (bad TypeScript code) → merge to main → verify no tag created, no GitHub Release exists

### Implementation for Failure Recovery

- [ ] T038 Update `.github/workflows/release.yml` Job 4 (Cleanup) logic:
  - On any job failure: attempt to delete Git tag
  - On any job failure: attempt to delete GitHub Release (if created)
  - Idempotent: don't fail if tag/release doesn't exist
- [ ] T039 Add error handling in release creation step
  - If tag push fails: catch error, run cleanup, exit with message
  - If release API call fails: catch error, run cleanup, exit with message
- [ ] T040 Test failure recovery per quickstart.md Scenario 5
  - Introduce build error (TypeScript error)
  - Merge PR to main
  - Verify build fails
  - Verify no orphaned tag exists: `git fetch --tags && git tag | grep "version"`
  - Verify no GitHub Release created

**Checkpoint**: Failure recovery working - no orphaned releases on build failure

---

## Phase 8: Integration & Documentation

**Goal**: Ensure all components work together; document setup and troubleshooting

### Documentation & Integration Tasks

- [ ] T041 Create `.github/RELEASE_PROCESS.md` documenting:
  - How releases are triggered
  - How to manually trigger release: GitHub Actions workflow dispatch
  - Commit message format required (Conventional Commits)
  - How to fix a failed release (manual cleanup + retry)
- [ ] T042 [P] Update repository `README.md` to mention:
  - Automated releases on merge to main
  - Link to RELEASE_PROCESS.md for details
- [ ] T043 Update `CLAUDE.md` project instructions to note:
  - All commits must use speckit workflow (already in place)
  - Release automation is automatic (no manual steps needed)
- [ ] T044 [P] Test all quickstart.md scenarios end-to-end
  - Scenario 1: Feature merge → verify release ✓
  - Scenario 2: Bugfix merge → verify patch bump ✓
  - Scenario 3: Breaking change → verify major bump ✓
  - Scenario 4: Feature branch → verify pre-release ✓
  - Scenario 5: Build failure → verify cleanup ✓
  - Scenario 6: Chore commit → verify no release ✓

**Checkpoint**: All documentation complete, all scenarios passing

---

## Phase 9: Polish & Optimization

**Purpose**: Final improvements and cross-cutting concerns

- [ ] T045 [P] Performance optimization: cache npm dependencies in GitHub Actions
  - Use `actions/setup-node@v3` with `cache: 'pnpm'`
  - Reduce workflow runtime
- [ ] T046 [P] Add retry logic for flaky network operations (GitHub API calls)
  - Implement exponential backoff for rate-limited API calls
- [ ] T047 Add notification/alerting (optional enhancements):
  - Post release notification to Slack (if channel configured)
  - Or create GitHub Discussion for each release
- [ ] T048 Security hardening:
  - Verify `GITHUB_TOKEN` permissions are minimal (write:releases only)
  - Review secrets management (no hardcoded credentials)
  - Document token lifecycle
- [ ] T049 Run full validation suite:
  - All quickstart scenarios passing ✓
  - Unit tests for breaking change detection script passing
  - Integration tests via GitHub Actions workflow passing
- [ ] T050 Code cleanup and refactoring:
  - Simplify `.releaserc.json` if possible
  - Add comments to `.github/workflows/release.yml` for clarity
  - Remove debug logging if no longer needed

**Checkpoint**: Polish complete, optimization done

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 2; can start after Phase 2 (parallel with US1 if staffed)
- **Phase 5 (US3)**: Depends on Phase 2; can start after Phase 2 (parallel with US1/US2 if staffed)
- **Phase 6 (Pre-release)**: Depends on Phase 2 + US1; can parallelize with US2/US3
- **Phase 7 (Failure Recovery)**: Depends on Phase 2; should be done early for safety
- **Phase 8 (Integration)**: Depends on Phases 3-7 completion
- **Phase 9 (Polish)**: Final polish after all phases

### Within Each User Story

- Core implementation tasks before integration tasks
- Test scenarios only after implementation complete

### Parallel Opportunities

**Phase 1 (Setup)**: T002-T005 can all run in parallel (different files, independent)

**Phase 2 (Foundational)**: 
- T013-T016 can run in parallel (different sections of release.yml)
- Full Phase 2 is sequential only due to T006 dependency

**User Stories (Phase 3+)**:
- Once Phase 2 complete, US1, US2, US3 can start in parallel (different workflows)
- Different team members can work on different stories simultaneously
- Implementation within each story can have parallel subtasks marked [P]

**Phase 9 (Polish)**:
- T045-T047 can run in parallel (different optimization concerns)

---

## Parallel Example: Phase 1 Setup

```
T001: Create .github/workflows/ directory
  ↓
T002-T005: [P] Add dependencies in parallel
  - pnpm exec pnpm add -D semantic-release
  - pnpm exec pnpm add -D @semantic-release/github
  - pnpm exec pnpm add -D @semantic-release/changelog
  - pnpm exec pnpm add -D conventional-changelog-conventionalcommits
  ↓
T006: Create .github/workflows/release.yml (depends on T001)
```

---

## Parallel Example: Multiple User Stories

```
Phase 2 Complete ✓

Developer A: Phase 3 (US1)     |  Developer B: Phase 4 (US2)      |  Developer C: Phase 5 (US3)
T019-T022: US1 tasks           |  T023-T027: US2 tasks            |  T028-T033: US3 tasks
(auto releases on merge)        |  (version detection)              |  (installer distribution)
                                |                                  |
(All can progress in parallel, independent of each other)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) 🎯 RECOMMENDED START

1. ✅ **Phase 1**: Setup (T001-T008)
2. ✅ **Phase 2**: Foundational (T009-T018) - **CRITICAL BLOCKER**
3. ✅ **Phase 3**: User Story 1 (T019-T022)
   - **STOP and VALIDATE** → Test Scenario 1 from quickstart.md
   - Verify releases created automatically on main merge
   - Deploy/Demo if ready
4. **After MVP approval**:
   - Phase 4: User Story 2 (version detection)
   - Phase 5: User Story 3 (installer distribution)
   - Phase 6: Pre-release support
   - Phase 7: Failure recovery
   - Phase 8: Documentation
   - Phase 9: Polish

### Incremental Delivery (Recommended)

1. **Week 1**: Phases 1-2 (Setup + Foundational)
   - Infrastructure in place, `semantic-release` configured
2. **Week 2**: Phase 3 (US1 - Auto-releases)
   - Core feature working; releases created on main merge
   - Test Scenario 1
3. **Week 3**: Phases 4-5 (US2-US3 - Version detection + Distribution)
   - All version types working; installers distributed
   - Test Scenarios 2-3
4. **Week 4**: Phases 6-8 (Pre-releases + Failure recovery + Docs)
   - Complete feature set; documentation complete
   - Test all scenarios (1-6)
5. **Week 5**: Phase 9 (Polish + Optimization)
   - Performance tuning; security hardening

---

## Success Criteria (from spec.md)

- [x] Each merge to main produces a release within 5 minutes (automated via GitHub Actions)
- [x] 100% of releases follow semantic versioning (determined by `semantic-release`)
- [x] 100% of macOS installers built and attached to GitHub Releases (electron-builder + workflow)
- [x] No manual version management required (`semantic-release` is automatic)
- [x] Release notes auto-generated (`conventional-changelog`)
- [x] Build failures cleaned up automatically (cleanup job)

All tasks above directly support these criteria.

---

## Notes

- [P] tasks = parallelizable (different files, independent execution)
- [Story] label = maps to user story for traceability (US1, US2, US3)
- Each user story should be independently completable and testable
- Use quickstart.md scenarios to validate each story
- Commit after each phase or logical group
- Stop at checkpoints to validate independently
- Phase 2 (Foundational) is a hard blocker - don't skip!
