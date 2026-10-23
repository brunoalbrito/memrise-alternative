# Research & Technical Decisions: Semantic Release Automation for macOS

**Date**: 2026-10-23 | **Feature**: [spec.md](spec.md)

## 1. Breaking Change Detection Strategy

### Decision: Custom Diff Analysis with Conventional Commits Heuristic

**Rationale**: 
- Auto-detection of breaking changes in code is complex and requires language-specific analysis
- For an Electron app, most breaking changes are UI/API changes, not code signature changes
- A hybrid approach: detect breaking changes from commit messages + file change patterns

**Implementation**:
1. Analyze commit messages for keywords: "BREAKING CHANGE", "breaking:", "!:"
2. Detect file changes in key areas:
   - `electron/preload.ts` (IPC interface changes)
   - `src/main.ts` (app initialization)
   - Version or schema files
3. Combined score determines major version bump

**Alternatives Considered**:
- Pure AST-based analysis: Too language-specific, hard to maintain
- GitHub API diff inspection: Already available, simple to parse
- User-specified labels: Would require manual coordination, defeats automation goal

**Outcome**: Use semantic-release with custom breaking change detection plugin

---

## 2. Semantic Release Tool Selection

### Decision: semantic-release + @semantic-release/github

**Rationale**:
- Industry standard for semantic versioning automation
- Native GitHub integration (release creation, issue linking)
- Extensive plugin ecosystem
- Actively maintained and widely adopted

**Tool Comparison**:

| Tool | GitHub Integration | Plugins | Maintenance | Learning Curve |
|------|-------------------|---------|-------------|-----------------|
| semantic-release | Native (via plugin) | Extensive | Active | Moderate |
| release-it | Partial | Limited | Active | Low |
| Custom script | Manual | N/A | Self | High |

**Outcome**: 
- Primary: `semantic-release` with `@semantic-release/github` and `@semantic-release/changelog`
- Fallback: `release-it` if semantic-release proves too heavy

---

## 3. Conventional Changelog Setup

### Decision: conventional-changelog with custom config for Electron

**Rationale**:
- Integrates with semantic-release
- Generates readable changelogs from commit history
- Customizable templates for Electron-specific format

**Configuration**:
- Preset: `conventional-changelog-conventionalcommits`
- Custom template to highlight:
  - UI changes
  - API/preload changes
  - Breaking changes
  - Bug fixes
  - Performance improvements

**Output Format**: Markdown (native to GitHub Releases)

**Alternatives Considered**:
- Manual changelog: Would block automation
- HTML format: Markdown is more portable and editable

**Outcome**: Use conventional-changelog with customized Electron preset

---

## 4. Universal Binary Build Process

### Decision: Leverage Existing electron-builder Configuration

**Rationale**:
- `pnpm package` command already uses electron-builder
- electron-builder supports universal binaries via `--universal` flag
- Project already targets arm64; x86-64 support via universal is minimal effort

**Implementation**:
1. Check current `electron-vite.config.ts` and `electron-builder.config.ts`
2. Verify universal binary configuration is present
3. If not, add `--universal` flag to `pnpm package` command

**Build Output**:
- DMG file with universal binary (recommended for macOS users)
- PKG file (optional, for scripted installations)

**Alternatives Considered**:
- Separate arm64 and x86-64 installers: More complex, larger downloads
- x86-64 only: Leaves newer Apple Silicon users without optimized version

**Outcome**: Use existing `pnpm package` with universal binary support

---

## 5. Pre-release Workflow on Feature Branches

### Decision: Branch-based Pre-release Versioning

**Rationale**:
- Pre-releases (v1.2.0-beta.1) allow testing before stable release
- GitHub Actions supports branch-based conditional logic
- Feature branches can publish pre-releases; main publishes stable

**Implementation**:
```yaml
if: github.ref_type == 'branch' && github.ref != 'refs/heads/main'
  then: publish as pre-release (v1.2.0-beta.1)
else if: github.ref == 'refs/heads/main'
  then: publish as stable (v1.2.0)
```

**Pre-release Numbering**:
- Auto-incremented beta suffix: v1.2.0-beta.1, v1.2.0-beta.2, etc.
- Reset on stable release

**Alternatives Considered**:
- Manual PR label: Requires discipline, easy to forget
- Git tag prefix: Harder to detect in workflow
- Environment variable: Requires manual configuration

**Outcome**: Use branch detection for automatic pre-release versioning

---

## 6. Failure Handling & Recovery

### Decision: Atomic Tag + Release Creation with Cleanup

**Rationale**:
- If build fails, tag orphaned without release is problematic
- Atomic cleanup ensures consistent state

**Implementation**:
1. Calculate version first (no side effects)
2. Create tag only if calculation successful
3. Build
4. Create GitHub Release only if build successful
5. On any failure, delete tag and release (idempotent cleanup)

**Alternatives Considered**:
- Draft releases: GitHub doesn't support draft+asset workflow well
- Manual cleanup: Error-prone, requires human intervention

**Outcome**: Implement cleanup script as part of workflow failure handler

---

## 7. GitHub Actions Workflow Structure

### Decision: Single Reusable Workflow with Conditional Jobs

**Rationale**:
- Single source of truth for release logic
- Reusable for both main branch and feature branches
- Easy to test and maintain

**Workflow Jobs** (in order):
1. **Detect Version**: Calculate next semantic version
2. **Validate Build**: Ensure no breaking build issues
3. **Build macOS**: Run `pnpm build && pnpm package`
4. **Create Release**: Tag + GitHub Release + cleanup on failure
5. **Post-Release**: Optional: notify, deploy to CDN, etc.

**Outcome**: Create `.github/workflows/release.yml` with job structure above

---

## 8. Dependencies & Versions

**Added npm packages** (DevDependencies):
- `semantic-release@^21.0.0`
- `@semantic-release/github@^9.0.0`
- `@semantic-release/changelog@^6.0.0`
- `conventional-changelog-conventionalcommits@^6.0.0`

**No breaking changes** to existing dependencies; all additions are for CI/CD only.

---

## Summary Table

| Question | Decision | Rationale | Confidence |
|----------|----------|-----------|-----------|
| Breaking change detection | Hybrid (diff + keywords) | Balance automation & accuracy | High |
| Release tool | semantic-release | Industry standard, GitHub-native | High |
| Changelog | conventional-changelog | Integrates with semantic-release | High |
| Build process | Existing pnpm package | Already configured | High |
| Pre-releases | Branch-based | Simple, automatic | High |
| Failure recovery | Atomic cleanup | Consistency, safety | High |
| Workflow structure | Single reusable workflow | Maintainability | High |

**All critical unknowns resolved.** Ready for Phase 1 design.
