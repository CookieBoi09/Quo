import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("library, editor, photo, favorites, persistence, and widget export", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".quote-card")).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".quote-card canvas").first()).toHaveJSProperty(
    "width",
    600,
  );
  await page.screenshot({ path: "/tmp/quo-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "New quote", exact: true }).click();
  await page
    .getByLabel("Quote text", { exact: true })
    .pressSequentially("A small step is still a step.");
  await expect(page.getByLabel("Quote text", { exact: true })).toHaveValue(
    "A small step is still a step.",
  );
  await page.getByLabel("Author or source").fill("Test author");
  await page.getByLabel("Keep it in").selectOption("daily");
  await page.locator(".font-trigger").click();
  await page.getByLabel("Search fonts").fill("Caveat");
  await page.getByRole("button", { name: "Caveat", exact: true }).click();
  await page
    .locator(".editor-scroll input[type=file]")
    .setInputFiles("public/photos/mountains.jpg");
  await expect(
    page.getByRole("button", { name: "Replace your photo" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Align left", exact: true }).click();
  await page.screenshot({ path: "/tmp/quo-editor.png", fullPage: true });
  await page.getByRole("button", { name: "Save quote", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".quote-card")).toHaveCount(7);
  await page.reload();
  await expect(page.locator(".quote-card")).toHaveCount(7);
  await page.getByLabel("Search quotes").fill("Test author");
  await expect(page.locator(".quote-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Add to favorites", exact: true })
    .click();
  await page.getByRole("button", { name: "Favorites 4", exact: true }).click();
  await expect(page.locator(".quote-card")).toHaveCount(4);
  await page.locator(".card-widget-button").first().click();
  await expect(
    page.getByRole("dialog", { name: "Widget studio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await page.getByLabel("Custom width").fill("800");
  await page.getByLabel("Custom height").fill("450");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download image", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("quo-800x450.png");
  await download.saveAs("/tmp/quo-export.png");
  const png = await readFile("/tmp/quo-export.png");
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(800);
  expect(png.readUInt32BE(20)).toBe(450);
  await page.screenshot({ path: "/tmp/quo-studio.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("folders, notebooks, search empty states, and deletion", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "New folder", exact: true })
    .first()
    .click();
  await page.getByLabel("Give it a name").fill("My ideas");
  await page
    .getByRole("button", { name: "Create folder", exact: true })
    .click();
  await page.getByRole("button", { name: "Add notebook to My ideas" }).click();
  await page.getByLabel("Give it a name").fill("Morning notes");
  await page
    .getByRole("button", { name: "Create notebook", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Folders and notebooks" })
    .getByRole("button", { name: "Morning notes 0" })
    .click();
  await expect(page.getByText("A little room for inspiration.")).toBeVisible();
  await page.getByRole("button", { name: "New quote", exact: true }).click();
  await expect(page.getByLabel("Keep it in")).not.toHaveValue("");
  await page.getByLabel("Quote text", { exact: true }).fill("A new morning.");
  await page.getByRole("button", { name: "Save quote", exact: true }).click();
  await expect(page.locator(".quote-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Options for quote by you" }).click();
  await page.getByRole("button", { name: "Delete quote", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete quote", exact: true })
    .click();
  await expect(page.locator(".quote-card")).toHaveCount(0);
  await page.getByRole("button", { name: "All quotes 6", exact: true }).click();
  await page.getByLabel("Search quotes").fill("zzzznotfound");
  await expect(page.getByText("No words found.")).toBeVisible();
  await page
    .getByRole("button", { name: "Clear search", exact: true })
    .last()
    .click();
  await expect(page.locator(".quote-card")).toHaveCount(6);
});

test("mobile layout, navigation, and editor do not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".quote-card")).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".quote-card canvas").first()).toHaveJSProperty(
    "width",
    600,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/quo-mobile.png", fullPage: true });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page.getByRole("button", { name: "Favorites 3", exact: true }).click();
  await expect(page.locator(".quote-card")).toHaveCount(3);
  await page.getByRole("button", { name: "New quote", exact: true }).click();
  await page
    .getByLabel("Quote text", { exact: true })
    .fill("A mobile thought.");
  await page.getByRole("button", { name: "Save quote", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
