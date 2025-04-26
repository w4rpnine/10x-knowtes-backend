/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "../page-objects/login-page";

interface AuthFixtures {
  loginPage: LoginPage;
  authenticatedPage: {
    token: string;
  };
}

// Define type for Playwright use function
type UseFunction<T> = (value: T) => Promise<void>;

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }: { page: Page }, use: UseFunction<LoginPage>) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // Fixture, która zapewnia zalogowanego użytkownika
  authenticatedPage: async ({ page }: { page: Page }, use: UseFunction<{ token: string }>) => {
    // Implementuj logikę logowania
    // Można użyć API bezpośrednio lub UI w zależności od potrzeb

    // Przykład logowania przez localStorage:
    await page.goto("/");
    const mockAuthToken = "mock-auth-token-for-testing";

    await page.evaluate((token: string) => {
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
