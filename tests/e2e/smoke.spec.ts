import { test, expect } from "@playwright/test";

test.describe("Landing page (público, sin auth)", () => {
  test("carga la landing y expone el CTA de login", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/democra\.pro/);

    await expect(
      page.getByRole("heading", { level: 1 })
    ).toContainText("Democratiza la");

    await expect(
      page.getByRole("link", { name: "Iniciar sesión" })
    ).toBeVisible();
  });

  test("navega de la landing al formulario de login", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Iniciar sesión" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Democra" })).toBeVisible();
  });
});
