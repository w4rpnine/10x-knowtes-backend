import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/login-page";

test.describe("Logowanie do aplikacji", () => {
  test("powinno wyświetlić błąd dla niepoprawnych danych", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login("niepoprawny@email.com", "niepoprawneHasło");

    await loginPage.expectErrorMessage("Niepoprawny email lub hasło");
  });

  test("powinno zalogować użytkownika z poprawnymi danymi", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login("testowy@przykład.pl", "poprawneHasło123");

    await loginPage.expectSuccessfulLogin();

    // Dodatkowe sprawdzenie np. czy pojawił się avatar użytkownika
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
});
