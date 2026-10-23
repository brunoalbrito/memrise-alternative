# Feature Specification: Semantic Release Automation for macOS

**Feature Branch**: `042-semantic-release-macos`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "I need to update the ci to generate a release instalable for macos each time a new feature merge is done. Use semantic version to realise that"

## User Scenarios & Testing

### User Story 1 - Automatic Release on Feature Merge (Priority: P1)

When a feature branch is merged to main, the CI/CD pipeline automatically detects the change, determines the next semantic version number, builds the macOS installer, and publishes it as a release.

**Why this priority**: This is the core value of the feature—automating what would otherwise be a manual release process, reducing friction and human error.

**Independent Test**: Can be fully tested by merging a feature PR to main, waiting for CI to complete, and verifying that a new macOS installer (DMG/PKG) is available in GitHub Releases with a semantically-versioned release tag.

**Acceptance Scenarios**:

1. **Given** a feature branch with meaningful commits, **When** PR is merged to main, **Then** CI workflow triggers and builds a release installer
2. **Given** previous release was v1.0.0, **When** new feature (non-breaking) is merged, **Then** release is tagged as v1.1.0
3. **Given** previous release was v1.5.2, **When** bugfix commit is merged, **Then** release is tagged as v1.5.3
4. **Given** previous release was v2.0.0, **When** breaking change is merged (detected via file/API diff analysis), **Then** release is tagged as v3.0.0
5. **Given** CI workflow completes successfully, **When** user checks GitHub Releases, **Then** newest release has downloadable macOS installer and release notes

---

### User Story 2 - Semantic Version Detection (Priority: P2)

The CI/CD pipeline analyzes commit messages (following Conventional Commits format) to automatically determine whether the next release should be a major, minor, or patch version bump.

**Why this priority**: Automatic version detection removes the need for manual version management and ensures versioning is consistent and predictable.

**Independent Test**: Can be tested by analyzing commit history and verifying version calculation logic produces correct semantic versions based on commit message types (feat → minor, fix → patch, BREAKING CHANGE → major).

**Acceptance Scenarios**:

1. **Given** commit history with only `fix:` commits since last tag, **When** version is calculated, **Then** patch version is incremented
2. **Given** commit history with `feat:` commits since last tag, **When** version is calculated, **Then** minor version is incremented
3. **Given** commit history with `BREAKING CHANGE:` footer, **When** version is calculated, **Then** major version is incremented
4. **Given** no commits since last release, **When** CI triggers, **Then** no new release is created

---

### User Story 3 - macOS Installer Distribution (Priority: P2)

Built macOS installers (DMG and/or PKG formats) are automatically packaged and uploaded to GitHub Releases, making them easily downloadable by end users.

**Why this priority**: Distribution is critical for users to actually access and download the application; without this, the build automation provides no end-user value.

**Independent Test**: Can be tested by visiting GitHub Releases page and verifying that the latest release contains macOS installer files ready for download.

**Acceptance Scenarios**:

1. **Given** successful macOS build completion, **When** release is created, **Then** DMG and/or PKG files are attached to GitHub Release
2. **Given** GitHub Release is published, **When** user downloads macOS installer, **Then** file is valid and application can be installed
3. **Given** multiple releases exist, **When** user visits GitHub Releases, **Then** releases are listed in chronological order with latest first

---

## Clarifications

### Session 2026-10-23

- Q1: Breaking change detection → A: Auto-detect by analyzing code diffs for structural changes
- Q2: Changelog generation → A: Auto-generated from commit history
- Q3: Pre-release support → B: Support pre-releases on feature branches, stable releases on main
- Q4: Build failure recovery → A: Auto-cleanup Git tag and GitHub Release if build fails
- Q5: macOS architecture targets → A: Universal binary supporting both arm64 and x86-64

---

### Edge Cases

- What happens if multiple PRs are merged in quick succession? → Each trigger produces its own release; sequential processing prevents race conditions
- How does the system handle a scenario where a commit is pushed directly to main (bypassing PR)? → CI triggers same as PR merge; release is created if version changed
- What if the semantic versioning calculation is ambiguous (e.g., both feature and fix commits)? → Minor version takes precedence over patch (feature is more significant)
- Pre-release versions (alpha, beta) are supported on feature branches; stable releases only on main merge
- If the macOS build fails but the version tag is already created? → Tag and GitHub Release are automatically deleted to maintain consistency

## Requirements

### Functional Requirements

- **FR-001**: GitHub Actions workflow MUST trigger automatically on pushes to `main` branch
- **FR-002**: CI MUST analyze code diffs since last Git tag to detect breaking changes and determine version bump (major/minor/patch)
- **FR-003**: CI MUST build macOS universal binary installer (arm64 + x86-64) in DMG and/or PKG format using existing `pnpm package` command
- **FR-004**: CI MUST create a Git tag with semantic version number (e.g., `v1.2.3`)
- **FR-005**: CI MUST create GitHub Release with the tag as the release name
- **FR-006**: CI MUST attach built macOS installer files to the GitHub Release
- **FR-007**: CI MUST auto-generate release notes/changelog from commit history summarizing changes included in the release
- **FR-008**: System MUST handle edge case where no versionable commits exist (no version bump created)
- **FR-009**: If macOS build fails after tag creation, CI MUST automatically delete the Git tag and GitHub Release to maintain consistency
- **FR-010**: CI MUST support pre-release versions (e.g., v1.2.0-beta.1) on feature branches; stable releases (v1.2.0) on main only

### Key Entities

- **Git Tag**: Semantic version identifier (e.g., `v1.2.3`) marking a release point
- **GitHub Release**: GitHub API entity containing tag, release notes, and attached binaries
- **macOS Installer**: Packaged application in DMG or PKG format, built by `pnpm package`
- **Commit History**: Sequential list of commits since last tag, used to determine version bump

## Success Criteria

### Measurable Outcomes

- **SC-001**: Each merge to main produces a macOS release within 5 minutes (or less, depending on build time)
- **SC-002**: 100% of releases are semantically versioned according to Conventional Commits specification
- **SC-003**: 100% of macOS installers are successfully built and attached to GitHub Releases
- **SC-004**: Developers do not need to manually create version tags or manage GitHub Releases
- **SC-005**: Release notes are automatically generated and accompany each release
- **SC-006**: CI workflow completes successfully at least 99% of the time (build failures excluded)

## Assumptions

- Existing `pnpm package` command successfully builds macOS universal binary installers (arm64 + x86-64) in DMG and/or PKG formats
- Project uses Conventional Commits format for commit messages (feat:, fix:, etc.)
- macOS builds are architected to support universal binary (both arm64 and x86-64 in a single installer)
- GitHub Actions is the CI/CD platform (already in use per CLAUDE.md)
- Releases are published to public GitHub Releases (no private artifact repository required)
- Version tags follow semantic versioning standard (MAJOR.MINOR.PATCH, with optional pre-release suffix)
- Breaking changes are auto-detected by analyzing code diffs, not by commit message markers
- Changelog is auto-generated from commit history without manual curation
