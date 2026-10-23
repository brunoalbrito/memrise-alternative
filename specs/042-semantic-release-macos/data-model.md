# Data Model: Semantic Release Automation

**Date**: 2026-10-23 | **Feature**: [spec.md](spec.md)

## Core Entities

### 1. Version

Semantic version identifier for a release.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| major | number | Breaking change indicator | 1 |
| minor | number | Feature addition indicator | 2 |
| patch | number | Bug fix indicator | 3 |
| prerelease | string? | Pre-release suffix (optional) | "beta.1" |
| toString() | string | Full version string | "v1.2.3-beta.1" |

**Validation Rules**:
- All components must be non-negative integers
- Prerelease follows SemVer format: `alphanumeric + dot + integer` (e.g., `beta.1`, `rc.2`)
- Stable releases have no prerelease suffix

**State Transitions**:
- v0.x.x → v1.0.0 (first stable)
- v1.x.x → v1.(x+1).0 (feature)
- v1.2.x → v1.2.(x+1) (patch)
- v1.2.3 → v1.2.4-beta.1 (pre-release on branch)
- v1.2.3-beta.1 → v1.2.3-beta.2 (pre-release increment)

---

### 2. Commit History

Sequential list of commits since last Git tag, used to determine version bump.

| Field | Type | Description |
|-------|------|-------------|
| commits | Commit[] | Array of commits since last tag |
| hasBreakingChanges | boolean | Detected via keywords or diff analysis |
| hasFeatures | boolean | Detected via `feat:` prefix |
| hasFixtures | boolean | Detected via `fix:` prefix |
| lastTag | string | Previous release tag (e.g., "v1.2.3") |

**Computation**:
```
if hasBreakingChanges: major++
else if hasFeatures: minor++
else if hasFixtures: patch++
else: no version bump
```

---

### 3. Release

Published release artifact containing version, assets, and metadata.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| tag | string | Git tag name | Format: v{MAJOR}.{MINOR}.{PATCH}(-prerelease) |
| version | Version | Semantic version object | Derived from tag |
| changelog | string | Release notes in Markdown | Auto-generated from commits |
| assets | Asset[] | DMG/PKG installer files | At least one per stable release |
| createdAt | timestamp | Release creation timestamp | Set by GitHub API |
| isDraft | boolean | Whether release is draft | True for failed builds |
| isPrerelease | boolean | Whether this is a pre-release | True if version has prerelease suffix |

**Lifecycle**:
1. Created on every successful build
2. Assets attached once build completes
3. Published to GitHub Releases
4. Marked as pre-release if branch != main

---

### 4. Build Artifact

Packaged macOS installer file.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| filename | string | Installer filename | Format: MemBetter-{version}-{arch}.{ext} |
| format | enum | DMG or PKG | "dmg" \| "pkg" |
| size | number | File size in bytes | > 100MB (expected) |
| sha256 | string | File checksum | Hex-encoded SHA256 |
| universalBinary | boolean | Contains both arm64 + x86-64 | True for all releases |
| buildId | string | CI job ID | GitHub Actions workflow run ID |

**Example**:
- Filename: `MemBetter-v1.2.3-universal.dmg`
- Size: ~180MB (universal binary)
- Contains: Arm64 + x86-64 executables

---

### 5. GitHub Release

GitHub API entity representing a published release.

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| id | string | GitHub Release ID | Assigned by GitHub API |
| url | string | GitHub Releases page URL | Computed from repo + tag |
| tag | string | Git tag | User-provided |
| name | string | Release title | Defaults to tag (e.g., "v1.2.3") |
| body | string | Release description | changelog markdown |
| assets | Asset[] | Attached files | DMG/PKG binaries |
| isPrerelease | boolean | Pre-release flag | Based on version suffix |
| createdAt | timestamp | Creation timestamp | Set by GitHub |
| updatedAt | timestamp | Last update timestamp | Updated on redeploy |

---

## Relationships

```
Commit History
  ↓ (analyzes)
Version
  ↓ (creates)
Release ← (contains) → Build Artifact
  ↓ (publishes to)
GitHub Release
```

---

## State Machine: Release Lifecycle

```
START
  ↓
[Calculate Version] ← from Commit History
  ↓
[Create Git Tag] ← v{MAJOR}.{MINOR}.{PATCH}(-pre)
  ↓
[Build macOS] ← pnpm package
  ├─ Success ↓
  │  [Create Release] ← assets + changelog
  │  ↓
  │  [Publish to GitHub] ← GitHub API
  │  ↓
  │  END (Success)
  │
  └─ Failure ↓
     [Cleanup Tag] ← delete Git tag
     ↓
     [Cleanup Release] ← delete GitHub Release (if created)
     ↓
     END (Failure)
```

---

## Data Validation Rules

| Entity | Rule | Enforced By |
|--------|------|------------|
| Version | Semantic format (SemVer 2.0) | Regex: `^v?\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$` |
| Commit Message | Conventional Commits format | Prefix: `feat:`, `fix:`, `chore:`, etc. |
| Release Tag | Must be valid Version | GitHub API validation |
| Build Artifact | SHA256 must match binary | Computed and stored in release notes |
| Prerelease | Only on non-main branches | GitHub Actions condition check |

---

## Volume & Scale Assumptions

- **Merge frequency**: ~5-10 per week (feature development pace)
- **Release frequency**: Proportional to merges (1 release per merge to main)
- **Version history**: Long-lived; versions never deleted
- **Build artifacts**: Kept indefinitely in GitHub Releases (no storage concerns for macOS-only)
- **Changelog size**: ~500 bytes per release (typical)

---

## Audit Trail

All releases are tracked in:
1. Git history (commits + tags)
2. GitHub Releases (public, auditable)
3. CI logs (GitHub Actions)

No additional database or audit log needed.
