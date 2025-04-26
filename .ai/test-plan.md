# Plan testów

## 1. Wprowadzenie i cele testowania
Celem testowania jest zapewnienie wysokiej jakości, stabilności oraz bezpieczeństwa aplikacji. Testy mają na celu weryfikację poprawności działania zarówno warstwy frontendowej, jak i backendowej, a także integracji między komponentami. Dzięki temu zespół może szybko wykrywać i naprawiać błędy oraz unikać regresji.

## 2. Zakres testów
- Testy jednostkowe dla funkcji, modułów i komponentów aplikacji (Astro, React).
- Testy integracyjne dla API, middleware, interakcji między front-endem a backendem oraz komunikacji z bazą danych (Supabase).
- Testy end-to-end symulujące scenariusze użytkownika, obejmujące cały przepływ aplikacji.
- Testy wizualne i dostępności dla komponentów UI (Tailwind, Shadcn/ui).
- Testy wydajnościowe dla krytycznych ścieżek aplikacji (np. ładowanie stron, czas odpowiedzi API).

## 3. Typy testów do przeprowadzenia
- **Testy jednostkowe:** Sprawdzanie pojedynczych funkcji i komponentów przy użyciu narzędzi takich jak Jest oraz React Testing Library.
- **Testy integracyjne:** Weryfikacja współpracy między modułami (np. API endpoints, middleware, interakcja supabase) w izolowanym środowisku testowym.
- **Testy end-to-end:** Symulacja pełnych scenariuszy użytkownika z użyciem narzędzi takich jak Cypress lub Playwright.
- **Testy wydajnościowe:** Ocena szybkości działania aplikacji oraz reagowania krytycznych funkcji przy użyciu narzędzi takich jak Lighthouse.
- **Testy dostępności:** Audyt dostępności i zgodności z wytycznymi WCAG przy użyciu dedykowanych narzędzi.

## 4. Scenariusze testowe dla kluczowych funkcjonalności
- **Renderowanie strony głównej i nawigacja:** Weryfikacja poprawnego renderowania statycznych stron generowanych przez Astro oraz dynamicznych komponentów React.
- **Interakcje użytkownika:** Testowanie formularzy, przycisków, nawigacji oraz poprawności działania zdarzeń (np. kliknięcia, zmiany danych).
- **API Endpoints:** Testy żądań HTTP, walidacja odpowiedzi oraz poprawności obsługi błędów w katalogu `src/pages/api`.
- **Middleware i zabezpieczenia:** Sprawdzenie mechanizmu autoryzacji i przekierowań w `src/middleware/index.ts`.
- **Integracja z bazą danych:** Testy komunikacji z Supabase, sprawdzanie zapisu, odczytu oraz aktualizacji danych.
- **Komponenty UI:** Testy wizualne i snapshoty dla komponentów budowanych z Tailwind i Shadcn/ui.
- **Scenariusze krytyczne:** Scenariusze obejmujące całościowy przepływ użytkownika, od logowania/rejestracji do korzystania z głównych funkcji aplikacji.

## 5. Środowisko testowe
- **Lokalne:** Maszyna deweloperska z konfiguracją testową, wykorzystująca lokalne bazy danych i serwery.
- **Staging:** Środowisko zbliżone do produkcyjnego, umożliwiające integracyjne testy end-to-end.
- **CI/CD:** Automatyczne uruchamianie testów przy każdej zmianie w repozytorium (Github Actions).

## 6. Narzędzia do testowania
- **Vitest i React Testing Library:** Do testów jednostkowych i komponentowych.
- **Cypress / Playwright:** Do testów end-to-end.
- **Lighthouse:** Do testów wydajnościowych i audytu dostępności.
- **ESLint i Prettier:** Do statycznej analizy kodu.
- **Supabase Emulator (opcjonalnie):** Do symulacji interakcji z bazą danych.

## 7. Harmonogram testów
- **Testy jednostkowe:** Automatyczne uruchamianie przy każdym commicie oraz w ramach pipeline CI.
- **Testy integracyjne:** Regularne uruchamianie w środowisku staging przy większych zmianach.
- **Testy end-to-end:** Wykonywane przy każdej większej iteracji wdrożeniowej oraz przed wydaniem nowej wersji.
- **Testy wydajnościowe i dostępności:** Przeprowadzane okresowo, w miarę rozwoju aplikacji oraz przed wdrożeniem krytycznych aktualizacji.

## 8. Kryteria akceptacji testów
- Wszystkie testy muszą zakończyć się powodzeniem.
- Minimalne pokrycie kodu testami na poziomie 80%.
- Brak krytycznych lub wysokich błędów zgłoszonych w raportach testowych.
- Zatwierdzenie przez zespół QA i deweloperski przed wdrożeniem aktualizacji.

## 9. Role i odpowiedzialności
- **Inżynier QA:** Opracowywanie, utrzymanie i wykonywanie testów, analiza raportów błędów, komunikacja z zespołem.
- **Deweloperzy:** Naprawa zgłoszonych błędów, współpraca przy tworzeniu testów integracyjnych oraz end-to-end.
- **Menedżer projektu:** Monitorowanie harmonogramu testów i zatwierdzanie krytycznych zmian w strategii testowania.

## 10. Procedury raportowania błędów
- **System zgłaszania:** Używanie narzędzi takich jak Jira lub GitHub Issues do rejestrowania błędów.
- **Raport błędu powinien zawierać:** Kroki reprodukcji, oczekiwany rezultat, zaobserwowane zachowanie, logi błędów oraz zrzuty ekranu (jeśli dotyczy).
- **Priorytetyzacja błędów:** Błędy krytyczne, wysokie, średnie i niskie, ustalana wspólnie przez zespół QA i deweloperski.
- **Komunikacja:** Automatyczne raportowanie wyników testów przez CI/CD oraz okresowe przeglądy błędów na spotkaniach zespołu.

---

Plan testów stanowi kompleksowy dokument zapewniający jakość aplikacji poprzez systematyczne podejście do testowania, uwzględniające specyfikę technologii, strukturę kodu i potencjalne ryzyka. Regularne aktualizacje i przeglądy planu zapewnią jego adekwatność i skuteczność w miarę rozwoju projektu. 