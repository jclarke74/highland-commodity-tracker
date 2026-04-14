import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("loads the dashboard page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("complementary").getByText("Highland")).toBeVisible();
  });

  test("navigates to News page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/news"]');
    await expect(page).toHaveURL("/news");
    await expect(page.locator("h1")).toContainText("News");
  });

  test("navigates to Trends page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/trends"]');
    await expect(page).toHaveURL("/trends");
    await expect(page.locator("h1")).toContainText("Price Trends");
  });

  test("navigates to Intelligence page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/intelligence"]');
    await expect(page).toHaveURL("/intelligence");
    await expect(page.locator("h1")).toContainText("Actionable Intelligence");
  });

  test("sidebar shows Highland branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("complementary").getByText("Highland")).toBeVisible();
  });
});
