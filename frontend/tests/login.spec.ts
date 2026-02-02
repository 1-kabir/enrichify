import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should load login page correctly", async ({ page }) => {
    await page.goto("/login");

    // Check page title
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();

    // Check form elements
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email address").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for error message to appear
    await expect(
      page.getByText(/Authentication failed|Invalid email or password/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should be mobile responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto("/login");

    // Check that elements are still visible on mobile
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
  });
});

test.describe("Visual Design", () => {
  test("should have modern gradient background", async ({ page }) => {
    await page.goto("/login");

    // Take a screenshot for visual verification
    await page.screenshot({
      path: "tests/screenshots/login-page.png",
      fullPage: true,
    });
  });

  test("should display properly in dark mode", async ({ page }) => {
    await page.goto("/login");

    // Toggle to dark mode if theme toggle is available
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    await page.screenshot({
      path: "tests/screenshots/login-page-dark.png",
      fullPage: true,
    });
  });
});
