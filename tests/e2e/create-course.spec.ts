import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

test("the create-course form explains invalid input and creates a course that survives a restart", async () => {
  const first = await launch();
  const { page } = first;
  try {
    await page.evaluate(() => {
      location.hash = "#/courses/new";
    });
    await expect(page.getByRole("heading", { name: "Create a Course", exact: true })).toBeVisible();

    // Nothing filled in: the first problems are explained.
    await page.getByRole("button", { name: "Create Course" }).click();
    await expect(page.getByText("Enter a name for your course.")).toBeVisible();
    await expect(page.getByText("Select the language you are teaching.")).toBeVisible();

    // Name too short, then fixed.
    await page.getByLabel("Name", { exact: true }).fill("ab");
    await page.getByRole("button", { name: "Create Course" }).click();
    await expect(page.getByText("Name must be at least 3 characters.")).toBeVisible();

    // Too many tags and a too long short description.
    await page.getByLabel("Name", { exact: true }).fill("My new course");
    await page.getByLabel("Teaching", { exact: true }).selectOption({ index: 1 });
    await page.getByLabel("Tags", { exact: true }).fill("a,b,c,d,e,f,g,h,i,j,k");
    await page.getByLabel("Short description", { exact: true }).fill("x".repeat(101));
    await page.getByRole("button", { name: "Create Course" }).click();
    await expect(page.getByText("Use at most 10 tags.")).toBeVisible();
    await expect(page.getByText("Short description must be 100 characters or fewer.")).toBeVisible();

    // Valid input: the course is created and the editor opens.
    await page.getByLabel("Tags", { exact: true }).fill("english, words");
    await page.getByLabel("Short description", { exact: true }).fill("A short one");
    await page.getByRole("button", { name: "Create Course" }).click();
    await expect(page).toHaveURL(/#\/course\/[^/]+\/edit$/);

    // Home lists it.
    await page.evaluate(() => {
      location.hash = "#/";
    });
    await expect(page.getByText("My new course").first()).toBeVisible();
  } finally {
    await first.close();
  }

  // After a restart the course is still there.
  const again = await launch(first.userData);
  try {
    await expect(again.page.getByText("My new course").first()).toBeVisible();
  } finally {
    await again.close();
    cleanup(first.userData);
  }
});
