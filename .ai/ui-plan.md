# Architektura UI dla 10x-knowtes

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika 10x-knowtes opiera się na dwupanelowym układzie, który zapewnia intuicyjną nawigację i zarządzanie notatkami. Główne elementy struktury to:

- **Lewy panel**: Drzewo nawigacji zawierające hierarchiczną strukturę tematów i notatek
- **Prawy panel**: Obszar roboczy wyświetlający treść wybranej notatki, edytor lub wygenerowane podsumowanie
- **Breadcrumb**: Nieklikalny element nawigacyjny na górze prawego panelu pokazujący aktualną ścieżkę
- **Przyciski nawigacyjne**: Umożliwiające poruszanie się między notatkami w wybranym temacie
- **Menu kontekstowe**: Dostępne po kliknięciu prawym przyciskiem myszy na temacie lub notatce

Aplikacja wykorzystuje tryb ciemny jako jedyny obsługiwany motyw i opiera się na komponentach Shadcn/ui do zapewnienia spójnego wyglądu.

## 2. Lista widoków

### Widok logowania (Login View)
- **Ścieżka**: `/login`
- **Główny cel**: Uwierzytelnienie użytkownika w systemie
- **Kluczowe informacje**: 
  - Formularz logowania z polami email i hasło
- **Kluczowe komponenty**:
  - Formularz logowania
  - Przyciski logowania i rejestracji
  - Komunikaty błędów
- **UX, dostępność i bezpieczeństwo**:
  - Walidacja pól formularza w czasie rzeczywistym
  - Wyraźne komunikaty o błędach
  - Obsługa klawiatury (tab, enter)
  - Bezpieczne przechowywanie tokena JWT
  - Automatyczne wylogowanie po czasie bezczynności

### Widok główny (Main View)
- **Ścieżka**: `/`
- **Główny cel**: Zapewnienie podstawowego interfejsu do nawigacji
- **Kluczowe informacje**:
  - Drzewo tematów i notatek
  - Pusty prawy panel z informacją powitalną
- **Kluczowe komponenty**:
  - Lewy panel z drzewem nawigacji
  - Przycisk "Nowy temat" w panelu drzewa
  - Ikona dostępu do panelu konta użytkownika
- **UX, dostępność i bezpieczeństwo**:
  - Responsywny układ z możliwością dostosowania szerokości paneli
  - Skróty klawiaturowe dla częstych operacji
  - Wizualne rozróżnienie tematów (ikona folderu) i notatek
  - Wyświetlanie danych tylko dla zalogowanego użytkownika

### Widok tematu (Topic View)
- **Ścieżka**: `/topics/{id}`
- **Główny cel**: Wyświetlanie i zarządzanie notatkami w wybranym temacie
- **Kluczowe informacje**:
  - Tytuł tematu w breadcrumb
  - Lista notatek w temacie
- **Kluczowe komponenty**:
  - Breadcrumb pokazujący ścieżkę tematu
  - Menu kontekstowe z opcjami zarządzania tematem
  - Przycisk do generowania podsumowania
- **UX, dostępność i bezpieczeństwo**:
  - Sortowanie notatek według daty utworzenia (najstarsze na górze)
  - Wizualne rozróżnienie zwykłych notatek i podsumowań
  - Walidacja uprawnień przed operacjami CRUD

### Widok notatki (Note View)
- **Ścieżka**: `/topics/{topicId}/notes/{noteId}`
- **Główny cel**: Wyświetlanie, edycja i zarządzanie pojedynczą notatką
- **Kluczowe informacje**:
  - Tytuł notatki
  - Treść notatki
  - Data utworzenia/modyfikacji
- **Kluczowe komponenty**:
  - Breadcrumb (Temat -> Notatka)
  - Pole tekstowe do edycji notatki w formacie markdown
  - Przycisk "Zapisz"
  - Przyciski "Poprzednia"/"Następna" notatka
- **UX, dostępność i bezpieczeństwo**:
  - Ostrzeżenie przed opuszczeniem strony z niezapisanymi zmianami
  - Walidacja i sanityzacja wprowadzanego tekstu
  - Zabezpieczenie przed XSS

### Widok podsumowania (Summary View)
- **Ścieżka**: `/topics/{topicId}/summary/{summaryId}`
- **Główny cel**: Wyświetlanie i walidacja wygenerowanego podsumowania
- **Kluczowe informacje**:
  - Tytuł podsumowania
  - Treść podsumowania
  - Temat którego dotyczy
- **Kluczowe komponenty**:
  - Breadcrumb (Temat -> Podsumowanie)
  - Pole tekstowe tylko do odczytu z wyszarzonym tłem
  - Przyciski "Zapisz" i "Odrzuć"
- **UX, dostępność i bezpieczeństwo**:
  - Wyraźne wizualne oznaczenie, że jest to podsumowanie (wyszarzone tło)
  - Możliwość kopiowania tekstu
  - Blokada edycji
  - Walidacja operacji akceptacji/odrzucenia

### Widok konta użytkownika (User Account View)
- **Ścieżka**: `/account`
- **Główny cel**: Wyświetlanie informacji o koncie
- **Kluczowe informacje**:
  - UUID użytkownika
- **Kluczowe komponenty**:
  - Wyświetlacz UUID użytkownika
  - Przycisk do zmiany hasła
  - Przycisk do usunięcia konta
- **UX, dostępność i bezpieczeństwo**:
  - Proste i przejrzyste przedstawienie informacji
  - Wyraźne potwierdzenia dla krytycznych operacji
  - Dwuetapowe potwierdzanie krytycznych operacji

### Widok potwierdzenia usunięcia (Delete Confirmation View)
- **Ścieżka**: Modalne okno (bez osobnej ścieżki)
- **Główny cel**: Zapewnienie potwierdzenia przed usunięciem tematu lub notatki
- **Kluczowe informacje**:
  - Komunikat o konsekwencjach usunięcia
  - Nazwa elementu do usunięcia
- **Kluczowe komponenty**:
  - Okno modalne
  - Przyciski "Anuluj" i "Potwierdź"
- **UX, dostępność i bezpieczeństwo**:
  - Wyraźne rozróżnienie między przyciskami anulowania i potwierdzenia
  - Możliwość zamknięcia klawiszem Escape
  - Fokus na przycisku "Anuluj" jako bezpieczniejszej opcji

## 3. Mapa podróży użytkownika

### Logowanie i rozpoczęcie pracy
1. Użytkownik otwiera aplikację i widzi ekran logowania
2. Po udanym logowaniu przechodzi do widoku głównego
3. Widok główny prezentuje drzewo tematów po lewej stronie i pusty prawy panel

### Zarządzanie tematami
1. **Tworzenie nowego tematu**:
   - Użytkownik klika przycisk "Nowy temat" w panelu drzewa
   - Wprowadza nazwę tematu i zatwierdza
   - Nowy temat pojawia się w drzewie

2. **Edycja nazwy tematu**:
   - Użytkownik klika prawym przyciskiem myszy na temacie i wybiera "Edytuj nazwę"
   - Wprowadza nową nazwę i zatwierdza
   - Nazwa tematu zostaje zaktualizowana w drzewie

3. **Usuwanie tematu**:
   - Użytkownik klika prawym przyciskiem myszy na temacie i wybiera "Usuń"
   - Pojawia się modalne okno potwierdzenia z ostrzeżeniem
   - Po potwierdzeniu temat zostaje usunięty z drzewa

### Zarządzanie notatkami
1. **Tworzenie nowej notatki**:
   - Użytkownik klika prawym przyciskiem myszy na temacie i wybiera "Dodaj notatkę"
   - Wprowadza tytuł notatki i zatwierdza
   - Nowa notatka pojawia się pod tematem w drzewie
   - Użytkownik przechodzi do widoku notatki
   - Wprowadza treść i klika przycisk "Zapisz"

2. **Przeglądanie i edycja notatki**:
   - Użytkownik klika na notatkę w drzewie
   - Przechodzi do widoku notatki, gdzie widzi jej treść
   - Może edytować treść i zapisać zmiany przyciskiem "Zapisz"
   - Może nawigować do poprzedniej/następnej notatki za pomocą przycisków

3. **Usuwanie notatki**:
   - Użytkownik klika prawym przyciskiem myszy na notatce i wybiera "Usuń"
   - Pojawia się modalne okno potwierdzenia
   - Po potwierdzeniu notatka zostaje usunięta

### Generowanie i zarządzanie podsumowaniami
1. **Generowanie podsumowania**:
   - Użytkownik klika prawym przyciskiem myszy na temacie i wybiera "Wygeneruj podsumowanie"
   - System generuje podsumowanie
   - Wygenerowane podsumowanie pojawia się w widoku podsumowania

2. **Akceptacja podsumowania**:
   - Użytkownik przegląda wygenerowane podsumowanie
   - Klika przycisk "Zapisz"
   - Podsumowanie zostaje zapisane jako notatka w temacie (tylko do odczytu)
   - Użytkownik wraca do widoku tematu

3. **Odrzucenie podsumowania**:
   - Użytkownik przegląda wygenerowane podsumowanie
   - Klika przycisk "Odrzuć"
   - Podsumowanie zostaje odrzucone
   - Użytkownik wraca do widoku tematu

### Zarządzanie kontem
1. **Podgląd informacji o koncie**:
   - Użytkownik klika ikonę konta w prawym górnym rogu
   - Przechodzi do widoku konta użytkownika
   - Widzi UUID swojego konta

2. **Zmiana hasła**:
   - W widoku konta użytkownik klika przycisk "Zmień hasło"
   - Wprowadza aktualne hasło i nowe hasło
   - Zatwierdza zmianę

3. **Usunięcie konta**:
   - W widoku konta użytkownik klika przycisk "Usuń konto"
   - Pojawia się modalne okno potwierdzenia z ostrzeżeniem
   - Użytkownik musi wprowadzić hasło, aby potwierdzić
   - Po potwierdzeniu konto zostaje usunięte i użytkownik wraca do ekranu logowania

## 4. Układ i struktura nawigacji

### Główna struktura nawigacji
- **Drzewo tematów i notatek** (lewy panel):
  - Tematy reprezentowane ikoną folderu z licznikiem notatek
  - Możliwość rozwijania/zwijania tematów
  - Notatki pod tematami (sortowane chronologicznie - najstarsze na górze)
  - Podsumowania wyróżnione specjalnym formatowaniem

- **Breadcrumb** (górna część prawego panelu):
  - Format: "Tytuł tematu -> Tytuł notatki"
  - Nieklikalny, służy tylko do informacji o aktualnej pozycji

- **Przyciski Poprzednia/Następna** (w widoku notatki):
  - Umożliwiają nawigację między notatkami w temacie
  - Podążają za chronologicznym porządkiem notatek

### Interakcje nawigacyjne
- Kliknięcie na temat rozwija/zwija listę notatek
- Kliknięcie na notatkę otwiera jej treść w prawym panelu
- Menu kontekstowe (prawy przycisk myszy) udostępnia dodatkowe akcje:
  - Dla tematów: Dodaj notatkę, Edytuj nazwę, Wygeneruj podsumowanie, Usuń temat
  - Dla notatek: Edytuj notatkę, Usuń notatkę

### Nawigacja w widokach specjalnych
- Z widoku podsumowania po kliknięciu "Zapisz" lub "Odrzuć" użytkownik wraca do widoku tematu
- Z widoku konta użytkownik może wrócić do widoku głównego klikając na drzewo nawigacji
- Modalne okna potwierdzenia można zamknąć klikając "Anuluj" lub klawiszem Escape

## 5. Kluczowe komponenty

### TreeView
- **Cel**: Wyświetlanie hierarchicznego drzewa tematów i notatek
- **Funkcje**:
  - Rozwijanie/zwijanie węzłów
  - Wyświetlanie ikon i liczników
  - Obsługa menu kontekstowego
  - Wizualne rozróżnienie tematów, notatek i podsumowań

### Breadcrumb
- **Cel**: Informowanie o aktualnej pozycji w hierarchii
- **Funkcje**:
  - Wyświetlanie ścieżki "Temat -> Notatka"
  - Nieklikalny, tylko informacyjny

### MarkdownEditor
- **Cel**: Edycja treści notatek w formacie markdown
- **Funkcje**:
  - Edycja tekstu
  - Podstawowe formatowanie markdown
  - Możliwość przełączenia w tryb tylko do odczytu (dla podsumowań)

### ContextMenu
- **Cel**: Udostępnianie akcji kontekstowych dla tematów i notatek
- **Funkcje**:
  - Różne opcje dla tematów i notatek
  - Wywołanie odpowiednich akcji

### Modal
- **Cel**: Wyświetlanie okien dialogowych (potwierdzenia, błędy)
- **Funkcje**:
  - Blokowanie interakcji z resztą interfejsu
  - Wyświetlanie przycisków akcji
  - Możliwość zamknięcia przez kliknięcie tła lub klawisz Escape

### NavigationButtons
- **Cel**: Nawigacja między notatkami w temacie
- **Funkcje**:
  - Przyciski Poprzednia/Następna
  - Wyłączanie nieaktywnych przycisków (np. gdy jest tylko jedna notatka)

### SummaryView
- **Cel**: Wyświetlanie wygenerowanego podsumowania
- **Funkcje**:
  - Wyświetlanie tekstu tylko do odczytu z wyszarzonym tłem
  - Przyciski akceptacji i odrzucenia
  - Wizualne oznaczenie, że jest to podsumowanie

### AccountPanel
- **Cel**: Zarządzanie kontem użytkownika
- **Funkcje**:
  - Wyświetlanie UUID użytkownika
  - Opcje zmiany hasła i usunięcia konta 