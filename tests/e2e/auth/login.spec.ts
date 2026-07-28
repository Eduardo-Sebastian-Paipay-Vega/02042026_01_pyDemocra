import { test, expect } from "@playwright/test";

// Credenciales de un usuario de prueba real (seed en el Supabase de sandbox).
// Ver .env.e2e.example. Sin estas variables, el flujo de login exitoso se
// omite pero el resto de la suite (que no requiere red externa) sigue corriendo.
const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("Login (/login)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("el botón de ingresar permanece deshabilitado sin credenciales", async ({ page }) => {
    const submit = page.getByRole("button", { name: "Ingresar", exact: true });
    await expect(submit).toBeDisabled();

    await page.getByLabel("Correo electrónico").fill("usuario@organizacion.org");
    await expect(submit).toBeDisabled();

    await page.getByLabel("Contraseña").fill("una-clave-cualquiera");
    await expect(submit).toBeEnabled();
  });

  test("credenciales inválidas muestran un mensaje de error y no navegan", async ({ page }) => {
    await page.getByLabel("Correo electrónico").fill(`no-existe-${Date.now()}@democra.pro`);
    await page.getByLabel("Contraseña").fill("clave-incorrecta-123");
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();

    await expect(
      page.getByText(/no se pudo iniciar sesión|invalid/i)
    ).toBeVisible({ timeout: 10_000 });

    await expect(page).toHaveURL(/\/login$/);
  });

  test("un login válido redirige fuera de /login", async ({ page }) => {
    test.skip(
      !TEST_EMAIL || !TEST_PASSWORD,
      "Faltan E2E_TEST_EMAIL / E2E_TEST_PASSWORD en .env.e2e — ver .env.e2e.example"
    );

    await page.getByLabel("Correo electrónico").fill(TEST_EMAIL!);
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();

    // LoginGateway hace window.location.assign("/ong/") en éxito (MPA same-origin),
    // o muestra un error si la cuenta no tiene un destino soportado todavía.
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 });
  });
});
