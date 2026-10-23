# Semantic Release Process Guide

## Overview

MemBetter uses **automatic semantic versioning** to manage releases. Every time a feature is merged to `main`, the CI/CD pipeline automatically:

1. Analyzes commit messages to determine the version bump
2. Builds a universal macOS installer (arm64 + x86-64)
3. Creates a GitHub Release with the new version and changelog
4. Cleans up if the build fails (no orphaned releases)

**No manual version management needed.** The version number is calculated entirely from your commit messages.

---

## What is Semantic Versioning?

Semantic Versioning (SemVer) follows the format: **MAJOR.MINOR.PATCH**

### Version Components

- **MAJOR** (v2.0.0): Breaking changes — users need to update their workflow or code
- **MINOR** (v1.1.0): New features — backward compatible, existing code still works
- **PATCH** (v1.0.1): Bug fixes — no new features, just fixes
- **Pre-release** (v1.0.0-beta.1): Testing versions on feature branches before stable release

### Why Semantic Versioning?

- **Clear communication**: Version number tells you what changed
- **Predictable**: Users know if they can safely update
- **Automated**: Tools can understand version relationships
- **Standard**: Used across the industry (npm, Python, etc.)

---

## Version Bump Rules

The automation detects the version bump automatically by analyzing **commit message prefixes**:

| Commit Type | Version Bump | Example | Result |
|------------|--------------|---------|--------|
| `feat:` | MINOR | `feat: add dark mode` | v1.0.0 → v1.1.0 |
| `fix:` | PATCH | `fix: crash on empty data` | v1.0.0 → v1.0.1 |
| `BREAKING CHANGE:` | MAJOR | Breaking IPC change | v1.0.0 → v2.0.0 |
| `chore:` | NONE | `chore: update deps` | No release |
| `docs:` | NONE | `docs: update README` | No release |
| `refactor:` | NONE | `refactor: simplify code` | No release |

### Priority Rules

If a single PR contains multiple types:
- **Breaking change** takes priority → MAJOR bump
- **Features** take priority over fixes → MINOR bump
- **Bug fixes** alone → PATCH bump

**Example**: If you add a feature AND fix a bug in one PR → MINOR bump (feature takes priority)

---

## How to Write Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Basic Format

```
type(scope): description

optional body

optional footer
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Build, deps, tooling (no version bump)
- `docs:` - Documentation only (no version bump)
- `refactor:` - Code restructure, no behavior change (no version bump)
- `test:` - Test changes (no version bump)
- `perf:` - Performance improvement

### Scope (Optional)

Add a scope in parentheses to indicate what area changed:

```bash
feat(ui): add dark mode
fix(preload): handle missing ipc method
feat(electron): improve startup time
```

### Examples

**Feature commit** (→ MINOR version bump):
```bash
git commit -m "feat: add dark mode support"
git commit -m "feat(ui): redesign settings panel"
```

**Bug fix commit** (→ PATCH version bump):
```bash
git commit -m "fix: prevent widget crash on empty data"
git commit -m "fix(preload): handle missing ipc method"
```

**Non-versioning commits** (→ no release):
```bash
git commit -m "chore: update dependencies"
git commit -m "docs: add screenshot to README"
git commit -m "refactor: simplify event handling"
```

---

## Breaking Changes (MAJOR Version Bump)

When you make changes that break backward compatibility, use `BREAKING CHANGE:` footer:

```bash
git commit -m "feat: redesign IPC interface

BREAKING CHANGE: IPC method names changed from camelCase to snake_case
- old: app.ipc.getUserData()
- new: app.ipc.get_user_data()"
```

Or use the `!` syntax:

```bash
git commit -m "feat!: redesign IPC interface"
```

### What Counts as Breaking?

- Removed or renamed exports
- Changed function/method signatures
- Altered data structure format
- Removed configuration options
- Changed API response format

### What Doesn't Count as Breaking?

- Adding new optional parameters (backward compatible)
- Adding new public methods
- Bug fixes that don't change the API
- Performance improvements

---

## Workflow: Step-by-Step Release Process

### Step 1: Create Feature Branch

```bash
git checkout -b feature/my-feature
```

Use a descriptive name: `feature/add-dark-mode`, `bugfix/fix-crash`, etc.

### Step 2: Make Changes

```bash
# Edit your files
vim src/ui/dark-mode.ts

# Add changes
git add .

# Commit with proper message
git commit -m "feat: add dark mode support"
```

### Step 3: Create Pull Request

```bash
git push origin feature/my-feature
gh pr create --title "Add dark mode support"
```

Or use GitHub UI to create PR.

### Step 4: Code Review & Merge

1. Get code review from team
2. Address feedback
3. Merge to `main` via GitHub UI (creates merge commit)

### Step 5: Automated Release (No Manual Steps!)

GitHub Actions automatically:
1. ✅ Detects your commit message
2. ✅ Calculates next version (v1.1.0)
3. ✅ Builds macOS installer
4. ✅ Creates GitHub Release
5. ✅ Uploads DMG/PKG files
6. ✅ Generates changelog from commits

### Step 6: Download Release

Visit: **[GitHub Releases](https://github.com/brunoalbrito/memrise-alternative/releases)**

- Latest release appears at top
- Download DMG file for installation
- See changelog with all changes

---

## Real-World Examples

### Example 1: Feature Release (v1.1.0)

**Commits merged to main**:
```
feat: add dark mode toggle
feat(preferences): remember user preferences
fix: prevent crash on startup
```

**Automation detects**:
- `feat:` commits → MINOR version bump

**Result**:
```
Previous version: v1.0.0
New version: v1.1.0

Changelog:
## v1.1.0 (2026-10-23)

### Features
- add dark mode toggle
- remember user preferences

### Bug Fixes
- prevent crash on startup
```

### Example 2: Bug Fix Release (v1.0.1)

**Commits merged to main**:
```
fix: prevent widget crash on empty data
fix: correct typo in preferences
```

**Automation detects**:
- Only `fix:` commits → PATCH version bump

**Result**:
```
Previous version: v1.0.0
New version: v1.0.1

Changelog:
## v1.0.1 (2026-10-23)

### Bug Fixes
- prevent widget crash on empty data
- correct typo in preferences
```

### Example 3: Breaking Change Release (v2.0.0)

**Commits merged to main**:
```
feat: redesign preload IPC interface

BREAKING CHANGE: IPC methods renamed to snake_case
- app.ipc.getUserData() → app.ipc.get_user_data()
- app.ipc.saveData() → app.ipc.save_data()
```

**Automation detects**:
- `BREAKING CHANGE:` footer → MAJOR version bump

**Result**:
```
Previous version: v1.5.2
New version: v2.0.0

Changelog:
## v2.0.0 (2026-10-23)

### ⚠️ BREAKING CHANGES
- **BREAKING CHANGE**: IPC methods renamed to snake_case
  - app.ipc.getUserData() → app.ipc.get_user_data()
  - app.ipc.saveData() → app.ipc.save_data()

### Features
- redesign preload IPC interface
```

### Example 4: No Release (Non-Versioning Commits)

**Commits merged to main**:
```
chore: update dependencies to latest versions
docs: add installation guide to README
refactor: simplify event handling in main.ts
```

**Automation detects**:
- No `feat:` or `fix:` commits
- Only `chore:`, `docs:`, `refactor:`
- No version bump needed

**Result**:
```
No release created
No version bump
No GitHub Release
(Efficient! No noise for documentation changes)
```

---

## Common Mistakes & How to Fix Them

### ❌ Mistake: Vague Commit Message

```bash
git commit -m "updates"        # Too vague!
git commit -m "fix stuff"      # Unclear
git commit -m "v1.1.0"         # Don't put version in commit message
```

**✅ Fix**: Be specific about what changed

```bash
git commit -m "fix: prevent crash when opening preferences"
git commit -m "feat: add keyboard shortcut support"
```

### ❌ Mistake: Wrong Prefix

```bash
git commit -m "Feature: add dark mode"     # Capital F (wrong)
git commit -m "features: add dark mode"    # Plural (wrong)
git commit -m "add dark mode"              # No prefix (wrong)
```

**✅ Fix**: Use lowercase prefix exactly

```bash
git commit -m "feat: add dark mode"        # Correct
```

### ❌ Mistake: Multiple Concerns in One Commit

```bash
git commit -m "feat: add dark mode and fix crash bug"  # Don't mix!
```

**✅ Fix**: Split into separate commits

```bash
git commit -m "feat: add dark mode"
git commit -m "fix: prevent crash on startup"
```

### ❌ Mistake: Breaking Change Without Footer

```bash
git commit -m "feat: redesign IPC interface"  # Breaking change not marked!
```

**✅ Fix**: Add `BREAKING CHANGE:` footer

```bash
git commit -m "feat: redesign IPC interface

BREAKING CHANGE: IPC method names changed from camelCase to snake_case"
```

---

## Troubleshooting

### Problem: Release Created with Wrong Version

**Cause**: Commit message prefix not recognized
**Fix**: Check commit message follows `type: description` format exactly

```bash
# Check what GitHub Actions saw
git log --oneline -5
# Each line should start with feat:, fix:, chore:, etc.
```

### Problem: Build Failed, But Tag Created

**Cause**: Build error after tag creation
**Fix**: Don't worry! Cleanup job automatically:
- ✅ Deletes the orphaned tag
- ✅ Deletes the incomplete GitHub Release
- ✅ Logs the error for debugging

Visit GitHub Actions workflow run to see error details.

### Problem: No Release Created (Expected One)

**Cause**: Commit message has no versioning prefix
**Fix**: Ensure at least one commit has `feat:` or `fix:` prefix

```bash
git log --oneline -10  # Check commit messages
# Should see at least one with feat: or fix: prefix
```

### Problem: Installer Not Attached to Release

**Cause**: Build failed silently
**Fix**: Check GitHub Actions workflow logs:
1. Visit: [Actions](https://github.com/brunoalbrito/memrise-alternative/actions)
2. Click latest run
3. Click "build-macos" job
4. Review logs for error messages

---

## Team Guidelines

### ✅ DO

- Use proper commit message format: `type: description`
- Include scope for clarity: `feat(ui):`, `fix(preload):`
- Use `BREAKING CHANGE:` footer for breaking changes
- Keep descriptions clear and descriptive
- Review generated changelog before download

### ✅ DO (Best Practices)

- One logical change per commit
- Commit early and often
- Use imperative mood: "add feature" not "added feature"
- Reference issues in commit body: `Closes #123`

### ❌ DON'T

- ~~Don't use ALL CAPS~~ ~~FEAT: add feature~~
- ~~Don't mix concerns~~ ~~feat: add feature and fix bug~~
- ~~Don't make breaking changes without footer~~
- ~~Don't put version numbers in messages~~
- ~~Don't use generic messages~~ ~~fix: bug~~

---

## How Version Calculation Works

### Behind the Scenes

When you push to main, GitHub Actions:

1. **Fetches all commits** since the last tag (previous release)
2. **Analyzes each commit message** for `feat:`, `fix:`, `BREAKING CHANGE:`
3. **Calculates priorities**:
   - Breaking change found? → MAJOR
   - Otherwise, feat: found? → MINOR
   - Otherwise, fix: found? → PATCH
   - Otherwise? → No release
4. **Looks at last tag** (e.g., v1.0.0)
5. **Calculates new version**:
   - MAJOR bump: v2.0.0
   - MINOR bump: v1.1.0
   - PATCH bump: v1.0.1
6. **Creates Git tag** with new version
7. **Builds macOS installer**
8. **Creates GitHub Release** with changelog
9. **Attaches DMG/PKG files**

### Example Calculation

```
Last tag: v1.0.0
Commits since tag:
  - feat: add dark mode
  - fix: crash on startup
  - chore: update deps

Analysis:
  - No breaking changes? ✓
  - Has feat: commits? ✓ (MINOR)
  - Version type: MINOR

Calculation:
  v1.0.0 + MINOR = v1.1.0

Result: Create v1.1.0 release
```

---

## Performance Notes

- **Build time**: 5-10 minutes (includes TypeScript compile + installer build)
- **Frequency**: Runs on every main branch push
- **Cost**: GitHub Actions free tier minutes
- **Pre-releases**: Created automatically for feature branches (no manual trigger)
- **Stable releases**: Only for main branch (production-ready)

---

## Tools Used

- **semantic-release** - Version calculation & release automation
- **@semantic-release/github** - GitHub Release integration
- **conventional-changelog** - Changelog generation from commits
- **GitHub Actions** - CI/CD automation

---

## Documentation Links

- [Semantic Versioning 2.0.0](https://semver.org/) - Version spec
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit format
- [semantic-release Docs](https://semantic-release.gitbook.io/) - Tool documentation
- [GitHub Releases](https://github.com/brunoalbrito/memrise-alternative/releases) - Download releases

---

## Questions?

- Check `.github/workflows/release.yml` for workflow details
- See `specs/042-semantic-release-macos/` for implementation specifications
- Review previous releases at [GitHub Releases](https://github.com/brunoalbrito/memrise-alternative/releases)

**Summary**: Follow Conventional Commits format → GitHub Actions handles the rest automatically! 🚀
