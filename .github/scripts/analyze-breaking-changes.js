#!/usr/bin/env node
/**
 * Analyze code changes to detect breaking changes
 * Returns JSON with breaking change detection score
 */

const fs = require('fs');
const { execSync } = require('child_process');

function analyzeBreakingChanges() {
  try {
    // Get diff since last tag
    let lastTag;
    try {
      lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""').toString().trim();
    } catch {
      lastTag = '';
    }

    if (!lastTag) {
      console.log(JSON.stringify({ breaking: false, confidence: 0, reason: 'No previous tag found' }));
      return;
    }

    // Get modified files
    const diffFiles = execSync(`git diff ${lastTag}...HEAD --name-only`).toString().trim().split('\n');

    // Check key breaking-change indicators
    let breakingIndicators = 0;
    let totalChecks = 0;

    // Check for IPC/Preload changes (breaking for Electron)
    const preloadChanges = diffFiles.some(f => f.includes('electron/preload') || f.includes('preload'));
    totalChecks++;
    if (preloadChanges) {
      try {
        const diff = execSync(`git diff ${lastTag}...HEAD -- 'electron/preload*' 'preload*' 2>/dev/null || true`).toString();
        if (diff.includes('export') || diff.includes('contextBridge')) {
          breakingIndicators++;
        }
      } catch {}
    }

    // Check for main process changes
    const mainChanges = diffFiles.some(f => f.includes('src/main') || f === 'electron/main.ts');
    totalChecks++;
    if (mainChanges) {
      try {
        const diff = execSync(`git diff ${lastTag}...HEAD -- 'src/main*' 'electron/main*' 2>/dev/null || true`).toString();
        if (diff.includes('removed') || diff.includes('deprecated')) {
          breakingIndicators++;
        }
      } catch {}
    }

    // Check commit messages for breaking change keywords
    const commits = execSync(`git log ${lastTag}...HEAD --pretty=%B`).toString();
    totalChecks++;
    if (commits.includes('BREAKING CHANGE') || commits.includes('BREAKING-CHANGE')) {
      breakingIndicators++;
    }

    // Calculate confidence
    const confidence = totalChecks > 0 ? breakingIndicators / totalChecks : 0;

    console.log(JSON.stringify({
      breaking: confidence > 0.5,
      confidence: Math.round(confidence * 100) / 100,
      indicators: breakingIndicators,
      totalChecks: totalChecks,
      reason: confidence > 0.5 ? 'Breaking changes detected' : 'No breaking changes detected'
    }));
  } catch (error) {
    console.log(JSON.stringify({
      breaking: false,
      confidence: 0,
      error: error.message
    }));
  }
}

analyzeBreakingChanges();
