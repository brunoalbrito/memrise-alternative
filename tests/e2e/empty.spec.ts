import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

test("a new library is empty, and sample courses can be installed once", async () => {
  const first = await launch();
  try {
    await expect(first.page.getByText("You have no courses yet")).toBeVisible();
    await expect(first.page.locator("main li")).toHaveCount(0);
    await expect(first.page.getByRole("button", { name: "Create a course" })).toBeVisible();
    await expect(first.page.getByRole("button", { name: "Import", exact: true })).toBeVisible();

    await first.page.getByRole("button", { name: "Install sample courses" }).click();
    await expect(first.page.getByText("You have no courses yet")).toHaveCount(0);
    expect(await first.page.locator("main li").count()).toBeGreaterThan(0);
    await expect(first.page.getByText("English Visual Dictionary").first()).toBeVisible();
  } finally {
    await first.close();
  }

  const second = await launch(first.userData);
  try {
    // Installed courses are ordinary courses: they are still there, with no invented progress.
    await expect(second.page.getByText("English Visual Dictionary").first()).toBeVisible();
    await expect(second.page.getByText("You have no courses yet")).toHaveCount(0);
  } finally {
    await second.close();
    cleanup(first.userData);
  }
});
