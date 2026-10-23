# GitHub Actions Release Workflow Contract

**Date**: 2026-10-23 | **Feature**: [spec.md](../spec.md) | **Data Model**: [data-model.md](../data-model.md)

## Workflow Specification

### Trigger

**On main branch** (stable releases):
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:  # Allow manual trigger
```

**On any non-main branch** (pre-releases):
```yaml
on:
  push:
    branches-ignore: [main]
  workflow_dispatch:
```

---

### Input Parameters

None required. Workflow uses Git context automatically.

**Environment Variables** (required in repository settings):
- `GITHUB_TOKEN` (automatic, provided by GitHub Actions)
- Optional: `RELEASE_NOTES_URL` (for additional release links)

---

### Output Artifacts

**Primary Output**: GitHub Release
- Tag: `v{MAJOR}.{MINOR}.{PATCH}` (stable) or `v{MAJOR}.{MINOR}.{PATCH}-{prerelease}` (pre-release)
- Assets: `MemBetter-{version}-universal.dmg`, `MemBetter-{version}-universal.pkg` (if applicable)
- Body: Auto-generated changelog from commits

**Secondary Outputs**:
- Git tag (created in repository)
- GitHub Release (published to Releases page)

---

## Job Structure

### Job 1: Detect Version

**Purpose**: Calculate next semantic version from commit history

**Inputs**: 
- Git commit history since last tag
- Branch name

**Outputs**:
- `new_version`: Calculated version string (e.g., "v1.2.3")
- `version_type`: One of "major", "minor", "patch"
- `is_prerelease`: Boolean (true if branch != main)

**Logic**:
1. Get last Git tag (if none, start at v0.1.0)
2. Analyze commits since tag:
   - Search for breaking change keywords or diff patterns → major bump
   - Count `feat:` commits → minor bump
   - Count `fix:` commits → patch bump
   - No versioning commits → skip release
3. If non-main branch: append prerelease suffix (e.g., -beta.1)

**Failure Handling**:
- No commits since last tag → Job skips remaining jobs
- Ambiguous version → Use highest precedence (major > minor > patch)

---

### Job 2: Build macOS

**Prerequisite**: Job 1 succeeded

**Purpose**: Build universal binary macOS installer

**Commands**:
```bash
pnpm install          # Ensure deps
pnpm build           # TypeScript compile
pnpm package         # Build macOS DMG/PKG with electron-builder
```

**Outputs**:
- DMG file: `release/mac-universal/*.dmg`
- PKG file (if built): `release/mac-universal/*.pkg`
- Build log (artifact for debugging)

**Environment**:
- OS: macOS (GitHub Actions runner: `macos-latest`)
- Architecture: Native (will produce universal binary)
- Timeout: 30 minutes

**Failure Handling**:
- Build fails → Trigger cleanup job, exit with error
- Asset not found → Fail and cleanup

---

### Job 3: Create Release

**Prerequisite**: Job 2 succeeded

**Purpose**: Create GitHub Release with assets and changelog

**Inputs** (from Job 1 and 2):
- `new_version`
- `is_prerelease`
- Build artifacts (DMG/PKG paths)
- Commit history

**Steps**:
1. Generate changelog from commits (conventional-changelog)
2. Create Git tag: `git tag {new_version}`
3. Push tag: `git push origin {new_version}`
4. Create GitHub Release via API
5. Attach DMG/PKG assets
6. Publish release (not draft)

**Outputs**:
- Release URL
- Asset URLs

**Failure Handling**:
- Tag push fails → Possible duplicate tag; cleanup old tag and retry
- Release creation fails → Delete tag and exit

---

### Job 4: Cleanup (on failure)

**Trigger**: Any job fails

**Purpose**: Remove orphaned tags and releases

**Steps**:
1. If Git tag exists: `git push origin --delete {new_version}`
2. If GitHub Release exists: Delete via API
3. Log cleanup action
4. Exit with error

**Idempotency**: Safe to run multiple times; deletes non-existent tags without error

---

## Workflow Sequence Diagram

```
Main Branch                          Feature Branch
    ↓                                    ↓
[Detect Version] → v1.2.3            [Detect Version] → v1.2.3-beta.1
    ↓                                    ↓
[Build macOS]                        [Build macOS]
    ↓                                    ↓
[Success]                            [Success]
    ↓                                    ↓
[Create Release]                     [Create Pre-release]
  - Tag: v1.2.3                        - Tag: v1.2.3-beta.1
  - Assets: DMG/PKG                    - Assets: DMG/PKG
  - Changelog                          - Changelog
  - Published                          - Marked as pre-release
    ↓                                    ↓
[GitHub Release] (stable)            [GitHub Release] (pre-release)
    ↓                                    ↓
Users can download                   Developers can test
```

---

## Error Cases & Recovery

| Scenario | Behavior | Recovery |
|----------|----------|----------|
| No commits since tag | Skip remaining jobs | No error, no release created |
| Build failure | Fail, trigger cleanup | Logs captured; tag deleted |
| Tag already exists | Fail during push | Delete old tag and retry |
| Release API fails | Fail, trigger cleanup | Manual GitHub Release creation |
| Asset upload fails | Fail | Manual asset upload |

---

## Notifications & Logging

**Success**:
- GitHub Release published (visible on Releases page)
- Optional: Post comment on PR if merge commit

**Failure**:
- GitHub Actions logs available in workflow run
- Optional: Post comment on PR with error details

---

## Security Considerations

1. **Token Permissions**: `GITHUB_TOKEN` has write:releases scope
2. **Tag Protection**: main branch protected; only PRs can merge
3. **Asset Integrity**: SHA256 checksums logged (future: sign assets with GPG)
4. **Secrets**: No secrets stored in workflow; use GitHub repo settings

---

## Testing & Validation

See [quickstart.md](../quickstart.md) for validation scenarios.
