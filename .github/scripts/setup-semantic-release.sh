#!/bin/bash
# Setup script for semantic release automation
# Run this once to initialize the semantic release workflow

set -e

echo "🚀 Setting up semantic release automation..."
echo ""

# Check if git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not a git repository. Please run this from the repo root."
  exit 1
fi

# Check if initial tag already exists
if git tag -l | grep -q "^v0\.0\.0$"; then
  echo "✅ Initial tag v0.0.0 already exists"
  INITIAL_TAG_EXISTS=true
else
  echo "ℹ️  Initial tag v0.0.0 not found. Creating it..."

  # Create initial tag on current branch's HEAD
  git tag -a v0.0.0 -m "Initial release tag for semantic versioning" HEAD

  echo "✅ Created tag v0.0.0"
  INITIAL_TAG_EXISTS=false
fi

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
  echo "ℹ️  Pushing tag to origin..."

  if [ "$INITIAL_TAG_EXISTS" = false ]; then
    git push origin v0.0.0
    echo "✅ Tag pushed to origin"
  else
    echo "✅ Tag already on origin"
  fi
else
  echo "⚠️  No 'origin' remote found. Tag created locally only."
fi

echo ""
echo "✅ Semantic release setup complete!"
echo ""
echo "Next steps:"
echo "1. Make changes and commit with proper format: 'feat: description' or 'fix: description'"
echo "2. Create PR and merge to main"
echo "3. GitHub Actions will automatically:"
echo "   - Detect commit types"
echo "   - Calculate semantic version"
echo "   - Build macOS installer"
echo "   - Create GitHub Release"
echo "   - Attach downloadable files"
echo ""
echo "Documentation: See .github/RELEASE_PROCESS.md for details"
