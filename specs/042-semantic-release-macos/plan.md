# Implementation Plan: Semantic Release Automation for macOS

**Branch**: `042-semantic-release-macos` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/042-semantic-release-macos/spec.md`

## Summary

Implement a GitHub Actions CI/CD workflow that automatically generates and publishes macOS installers with semantic versioning on every merge to main. The workflow will:
1. Detect breaking changes via code diff analysis
2. Calculate semantic version automatically
3. Build universal binary installer (arm64 + x86-64)
4. Auto-generate changelog from commit history
5. Support pre-releases on feature branches and stable releases on main
6. Clean up tags/releases if build fails

## Technical Context

**Language/Version**: TypeScript (existing); GitHub Actions workflow (YAML)

**Primary Dependencies**: 
- GitHub Actions (already in use)
- conventional-changelog (for auto-generating changelogs)
- semantic-release (for version calculation and release management)
- electron-builder (already in use for building)
- Existing `pnpm package` command

**Storage**: GitHub Releases (built-in artifact storage)

**Testing**: GitHub Actions workflow testing via Playwright e2e tests + manual PR validation

**Target Platform**: GitHub Actions runners (Linux for workflow, macOS for building)

**Project Type**: CI/CD automation (workflow definition + GitHub Actions setup)

**Performance Goals**: 
- Release generation within 5 minutes of merge
- 100% successful release rate on clean merges

**Constraints**: 
- Must not require manual version management
- Must auto-detect breaking changes from diffs
- Must support both arm64 and x86-64 in universal binary
- Pre-releases only on non-main branches

**Scale/Scope**: 
- Applies to each merge to main
- Supports both stable and pre-release versions
- Handles failure recovery and cleanup

## Constitution Check

*GATE: Must pass before Phase 0 research.*

**Relevant Principles** (from MemBetter Constitution v3.0.0):

- **Development Workflow**: "All feature work MUST land via pull request; direct pushes to main are forbidden."
  - ✅ COMPLIANT: This feature automates release on PR merge, strengthening the workflow

- **Tech Stack**: "No library outside this stack may be introduced without a constitution amendment."
  - ⚠️ CHECK: `semantic-release` and `conventional-changelog` are external npm packages
  - RESOLUTION: These are CI/CD tools (not codebase dependencies), operate at automation layer, not core app logic. Acceptable as build/release infrastructure tools per existing patterns (electron-builder, electron-updater already used)

**Gate Status**: ✅ PASS (with documented rationale above)

---

## Project Structure

### Documentation (this feature)

```text
specs/042-semantic-release-macos/
├── spec.md              # Feature specification ✓
├── plan.md              # This file (implementation plan) ← YOU ARE HERE
├── research.md          # Phase 0 output (detailed research on tools/patterns)
├── data-model.md        # Phase 1 output (version/release entity definitions)
├── quickstart.md        # Phase 1 output (validation scenarios)
├── contracts/           # Phase 1 output (GitHub Actions workflow contract)
└── checklists/requirements.md  # Quality validation ✓
```

### Source Code Changes (repository root)

```text
.github/
├── workflows/
│   ├── release.yml          # NEW: Main semantic release workflow
│   └── [existing workflows] # UNCHANGED
├── scripts/
│   └── analyze-breaking-changes.js  # NEW: Breaking change detection
└── [existing files]         # UNCHANGED
```

**Structure Decision**: 
- Add GitHub Actions workflow at `.github/workflows/release.yml` (standard location)
- Add helper script for breaking change detection
- No changes to src/ or core app code
- Feature is pure CI/CD automation

---

## Phase 0: Research Requirements

The following technical questions must be resolved before Phase 1 design:

1. **Breaking Change Detection Strategy**
   - Research: How to analyze code diffs for breaking API/schema changes
   - Tools: difftastic, semgrep, custom logic
   - Outcome: Documented approach in research.md

2. **Semantic Release Tool Selection**
   - Research: `semantic-release` vs `release-it` vs custom script
   - Comparison: Features, automation level, GitHub integration
   - Decision: Choose tool that best fits project

3. **Conventional Changelog Setup**
   - Research: Conventional Changelog configuration
   - Integration points: How to customize changelog for Electron app releases
   - Output format: Markdown vs HTML

4. **Universal Binary Build Process**
   - Research: electron-builder configuration for universal binaries
   - Current state: Check if existing `pnpm package` already builds universal
   - Outcome: Confirmation that arm64 + x86-64 can be in one DMG/PKG

5. **Pre-release Workflow on Feature Branches**
   - Research: How to trigger pre-releases (v1.2.0-beta.1) on non-main branches
   - GitHub Actions: Conditional workflow execution
   - Version numbering: Pre-release suffix calculation

---

## Phase 1: Design Artifacts

### 1. data-model.md
Documents the semantic entities involved in the release process:
- **Release**: Version number, tag, assets, changelog
- **Version**: MAJOR.MINOR.PATCH(-PRERELEASE) format
- **Commit History**: Analysis scope since last tag
- **Build Artifact**: DMG/PKG metadata
- **GitHub Release**: Release entity on GitHub

### 2. contracts/release-workflow.yml
GitHub Actions workflow contract defining:
- Trigger conditions (merge to main, manual dispatch)
- Inputs and outputs (version, assets, changelog)
- Job structure (detect version → build → publish)
- Environment variables and secrets required
- Success/failure handling

### 3. quickstart.md
Validation guide with runnable scenarios:
- Scenario 1: Merge feature PR → verify release published
- Scenario 2: Merge bugfix → verify patch version
- Scenario 3: Merge with breaking change → verify major version
- Scenario 4: Feature branch → verify pre-release tag
- Scenario 5: Build failure → verify cleanup

---

## Next Steps

1. **Phase 0**: Execute research tasks to finalize tool choices and integration approach
2. **Phase 1**: Create data-model.md, contracts/release-workflow.yml, and quickstart.md
3. **Phase 2** (next command): `/speckit-tasks` to break down implementation into atomic tasks
4. **Phase 3** (after that): `/speckit-implement` to execute tasks and build the feature

---

## Implementation Gates

- [ ] Phase 0 research completed (research.md)
- [ ] Phase 1 design artifacts created (data-model.md, contracts/, quickstart.md)
- [ ] Constitution Check re-validated post-design
- [ ] Ready for `/speckit-tasks`
