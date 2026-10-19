import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-guard.ts",
  timeout: 60_000,
  workers: 1,
  reporter: "list",
});
