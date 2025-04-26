import { test as base } from "@playwright/test";
import { LoginPage } from "../page-objects/login-page";

interface AuthFixtures {
  loginPage: LoginPage;
  authenticatedPage: {
    token: string;
  };
}

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // Fixture, która zapewnia zalogowanego użytkownika
  authenticatedPage: async ({ page }, use) => {
    // Implementuj logikę logowania
    // Można użyć API bezpośrednio lub UI w zależności od potrzeb

    // Przykład logowania przez localStorage:
    await page.goto("/");
    const mockAuthToken = "mock-auth-token-for-testing";

    await page.evaluate((token) => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          currentSession: {
            access_token: token,
            expires_at: Date.now() + 3600000, // wygaśnie za godzinę
          },
        })
      );
    }, mockAuthToken);

    // Odśwież stronę, aby zastosować token
    await page.reload();

    // Przekaż dane sesji do testu
    await use({ token: mockAuthToken });

    // Opcjonalnie, wyczyść po teście
    await page.evaluate(() => {
      localStorage.removeItem("supabase.auth.token");
    });
  },
});
