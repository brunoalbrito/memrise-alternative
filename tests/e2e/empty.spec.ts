import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

test("a new library is empty, and the development sample file imports like any other file", async () => {
  const out = mkdtempSync(join(tmpdir(), "membetter-samples-e2e-"));
  const file = join(out, "sample-courses.membetter");
  execFileSync("node", ["scripts/make-sample-library.ts", file], { stdio: "pipe" });

  const first = await launch();
  try {
    await expect(first.page.getByText("You have no courses yet")).toBeVisible();
    await expect(first.page.locator("main li")).toHaveCount(0);
    await expect(first.page.getByRole("button", { name: "Create a course" }).first()).toBeVisible();
    await expect(first.page.getByRole("button", { name: "Import", exact: true })).toBeVisible();
    await expect(first.page.getByText("Install sample courses")).toHaveCount(0);

    await first.app.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [path] })) as unknown as typeof dialog.showOpenDialog;
    }, file);
    await first.page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(first.page.getByRole("heading", { name: "Import library?" })).toBeVisible();
    await first.page.getByRole("button", { name: "Import", exact: true }).last().click();
    await expect(first.page.getByText("Imported 1 course.")).toBeVisible();
    await expect(first.page.getByText("Sample Course: Pictures and Sounds").first()).toBeVisible();
  } finally {
    await first.close();
  }

  const second = await launch(first.userData);
  try {
    await expect(second.page.getByText("Sample Course: Pictures and Sounds").first()).toBeVisible();
  } finally {
    await second.close();
    cleanup(first.userData);
    cleanup(out);
  }
});
