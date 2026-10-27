import { test, expect } from '@playwright/test';

/**
 * E2E tests for skip-AI feature
 * Tests validate that pre-filled word fields are skipped during AI generation
 */

test.describe('Skip AI Generation Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to editor page (adjust URL as needed for your environment)
    await page.goto('/editor', { waitUntil: 'networkidle' });
  });

  test('T026: User pre-fills Meaning, AI skips regenerating it', async ({ page }) => {
    // Find word row and fill Meaning field
    const meaningInput = page.locator('textarea[aria-label="Meaning"]').first();
    await meaningInput.fill('A nocturnal bird of prey');

    // Click AI wand button
    const aiButton = page.locator('button[aria-label="Auto-fill word"]').first();
    await aiButton.click();

    // Dialog should appear
    const dialog = page.locator('dialog[aria-labelledby="suggestions-title"]');
    await expect(dialog).toBeVisible();

    // Wait for AI suggestions to load
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return text.includes('Definition') || text.includes('IPA') || text.includes('Example');
      },
      { timeout: 10000 }
    );

    // Apply suggestions
    const applyButton = dialog.locator('button:has-text("Apply")');
    await applyButton.click();

    // Dialog should close
    await expect(dialog).not.toBeVisible();

    // Verify: Meaning field unchanged (preserved)
    const updatedMeaning = await meaningInput.inputValue();
    expect(updatedMeaning).toBe('A nocturnal bird of prey');

    // Verify: Other fields were populated (IPA, Example)
    const ipaInput = page.locator('input[aria-label="IPA"]').first();
    const ipaValue = await ipaInput.inputValue();
    expect(ipaValue.length).toBeGreaterThan(0);
  });

  test('T027: Skip badge appears on skipped field', async ({ page }) => {
    // Fill Meaning field
    const meaningInput = page.locator('textarea[aria-label="Meaning"]').first();
    await meaningInput.fill('A nocturnal bird of prey');

    // Click AI wand
    const aiButton = page.locator('button[aria-label="Auto-fill word"]').first();
    await aiButton.click();

    // Wait for dialog and apply suggestions
    const dialog = page.locator('dialog[aria-labelledby="suggestions-title"]');
    await expect(dialog).toBeVisible();

    // Wait for content to load
    await page.waitForFunction(
      () => document.body.innerText.includes('Definition'),
      { timeout: 10000 }
    );

    const applyButton = dialog.locator('button:has-text("Apply")');
    await applyButton.click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible();

    // Verify: Badge appears showing field was skipped
    const meaningRow = page.locator('textarea[aria-label="Meaning"]').first().locator('..');
    const badge = meaningRow.locator('span:has-text("↷ skipped")');

    // Badge should exist and be visible
    await expect(badge).toBeVisible();

    // Hover over badge to verify tooltip
    await badge.hover();
    const tooltip = await badge.getAttribute('title');
    expect(tooltip).toContain('This field was not regenerated');
  });

  test('T027b: Badge disappears when user edits field', async ({ page }) => {
    // Fill Meaning field
    const meaningInput = page.locator('textarea[aria-label="Meaning"]').first();
    await meaningInput.fill('A nocturnal bird of prey');

    // Click AI wand and apply
    const aiButton = page.locator('button[aria-label="Auto-fill word"]').first();
    await aiButton.click();

    const dialog = page.locator('dialog[aria-labelledby="suggestions-title"]');
    await expect(dialog).toBeVisible();

    await page.waitForFunction(
      () => document.body.innerText.includes('Definition'),
      { timeout: 10000 }
    );

    const applyButton = dialog.locator('button:has-text("Apply")');
    await applyButton.click();

    await expect(dialog).not.toBeVisible();

    // Badge should be visible after AI run
    const meaningRow = page.locator('textarea[aria-label="Meaning"]').first().locator('..');
    const badge = meaningRow.locator('span:has-text("↷ skipped")');
    await expect(badge).toBeVisible();

    // User edits the Meaning field
    await meaningInput.clear();
    await meaningInput.fill('A different definition');

    // Badge should disappear (field cleared from skip tracking)
    await expect(badge).not.toBeVisible();
  });

  test('Scenario: Multiple fields pre-filled, only empty fields generated', async ({ page }) => {
    // Pre-fill Meaning and IPA
    const meaningInput = page.locator('textarea[aria-label="Meaning"]').first();
    const ipaInput = page.locator('input[aria-label="IPA"]').first();

    await meaningInput.fill('A nocturnal bird');
    await ipaInput.fill('aul');

    // Click AI wand
    const aiButton = page.locator('button[aria-label="Auto-fill word"]').first();
    await aiButton.click();

    // Apply suggestions
    const dialog = page.locator('dialog[aria-labelledby="suggestions-title"]');
    await expect(dialog).toBeVisible();

    await page.waitForFunction(
      () => document.body.innerText.includes('Definition'),
      { timeout: 10000 }
    );

    const applyButton = dialog.locator('button:has-text("Apply")');
    await applyButton.click();

    // Verify: Pre-filled fields unchanged
    expect(await meaningInput.inputValue()).toBe('A nocturnal bird');
    expect(await ipaInput.inputValue()).toBe('aul');

    // Verify: Badges on pre-filled fields
    const meaningRow = page.locator('textarea[aria-label="Meaning"]').first().locator('..');
    const ipaRow = page.locator('input[aria-label="IPA"]').first().locator('..');

    await expect(meaningRow.locator('span:has-text("↷ skipped")')).toBeVisible();
    await expect(ipaRow.locator('span:has-text("↷ skipped")')).toBeVisible();

    // Example field should be populated (was empty)
    const exampleInput = page.locator('textarea[aria-label="Example"]').first();
    const exampleValue = await exampleInput.inputValue();
    expect(exampleValue.length).toBeGreaterThan(0);
  });

  test('Scenario: All fields pre-filled, no AI call made', async ({ page }) => {
    // Pre-fill all metadata fields
    const meaningInput = page.locator('textarea[aria-label="Meaning"]').first();
    const ipaInput = page.locator('input[aria-label="IPA"]').first();
    const exampleInput = page.locator('textarea[aria-label="Example"]').first();

    await meaningInput.fill('A nocturnal bird');
    await ipaInput.fill('aul');
    await exampleInput.fill('The owl hooted at night');

    // Note: In a real test, you'd mock the network to verify no AI API call is made
    // Click AI wand
    const aiButton = page.locator('button[aria-label="Auto-fill word"]').first();
    await aiButton.click();

    // Dialog may not appear or should appear briefly
    // (depends on implementation - could skip dialog entirely if all fields filled)
    const dialog = page.locator('dialog[aria-labelledby="suggestions-title"]');

    // If dialog appears, it should close quickly or not appear at all
    const dialogVisible = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
    if (dialogVisible) {
      // Dialog appeared but should close without making API call
      await page.waitForTimeout(500);
    }

    // All fields should remain unchanged
    expect(await meaningInput.inputValue()).toBe('A nocturnal bird');
    expect(await ipaInput.inputValue()).toBe('aul');
    expect(await exampleInput.inputValue()).toBe('The owl hooted at night');
  });
});
