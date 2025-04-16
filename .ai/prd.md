# Dokument wymagań produktu (PRD) - 10x-knowtes

## 1. Przegląd produktu

10x-knowtes to aplikacja webowa umożliwiająca tworzenie, organizowanie i generowanie podsumowań notatek za pomocą sztucznej inteligencji. Aplikacja rozwiązuje problem rozproszenia informacji w wielu notatkach, oferując automatyczne podsumowania całych tematów (lekcji) z odnośnikami do oryginalnych notatek źródłowych.

Głównym celem aplikacji jest wspomaganie procesu nauki poprzez organizację wiedzy w czytelnej, hierarchicznej strukturze oraz generowanie zwięzłych podsumowań, które ułatwiają przyswajanie materiału i przygotowanie do sprawdzianów czy certyfikacji.

Produkt jest uniwersalny i nie targetuje konkretnej grupy docelowej - może być wykorzystywany przez studentów, profesjonalistów, badaczy czy hobbystów do efektywnego zarządzania notatkami z dowolnej dziedziny.

## 2. Problem użytkownika

Użytkownicy często spotykają się z następującymi problemami podczas nauki i tworzenia notatek:

1. Trudności w przyswajaniu wiedzy z wielu rozproszonych notatek dotyczących jednego tematu
2. Brak efektywnego sposobu na podsumowanie najważniejszych informacji z wielu notatek jednocześnie
3. Czasochłonność ręcznego tworzenia podsumowań do nauki
4. Trudności w organizacji i kategoryzacji notatek w logiczne grupy tematyczne

10x-knowtes rozwiązuje te problemy, oferując:
- Hierarchiczną strukturę organizacji notatek bez ograniczeń poziomów zagnieżdżenia
- Automatyczne generowanie podsumowań z wykorzystaniem AI
- Przejrzysty interfejs do zarządzania notatkami i ich strukturą

## 3. Wymagania funkcjonalne

### 3.1 System uwierzytelniania
- System uwierzytelniania za pomocą mechanizmów Supabase

### 3.2 Zarządzanie notatkami
- Tworzenie notatek w formacie markdown
- Edycja istniejących notatek
- Usuwanie notatek
- Automatyczne zapisywanie notatek podczas edycji

### 3.3 Organizacja hierarchiczna
- Wielopoziomowe grupowanie notatek w tematy (węzły)
- Możliwość tworzenia dowolnej struktury zagnieżdżenia (notatki → lekcje → przedmioty → itd.)
- Nawigacja poprzez panel drzewa po lewej stronie oraz breadcrumb na górze

### 3.4 Generowanie podsumowań
- Generowanie podsumowań notatek zawartych w danym temacie za pomocą AI
- Akceptowanie lub odrzucanie wygenerowanych podsumowań
- Zapis zaakceptowanych podsumowań jako nowych notatek z odpowiednim tytułem i datą
- Standardowa struktura podsumowań (punkty kluczowe, daty, podsumowanie, lista pojęć)

## 4. Granice produktu

W ramach MVP (Minimum Viable Product) nie będą implementowane następujące funkcjonalności:

1. Notatki w innej formie niż tekstowa
2. Formatowanie tekstu (nagłówki, kolory) na podstawie składni Markdown
3. Odnośniki do notatek
4. Import notatek z zewnętrznych źródeł (PDF, DOCX, md, itp.)
5. Współdzielenie notatek między użytkownikami
6. Integracje z innymi narzędziami do sporządzania notatek
7. Tworzenie mindmap na podstawie notatek
8. Generowanie quizów na podstawie notatek
9. Wzbogacanie podsumowania o informacje spoza notatek
10. Sugestie wzbogacenia notatek o ważne treści
11. Wyszukiwanie notatek po słowach kluczowych
12. Zmiana motywu (theme) aplikacji webowej
13. Aplikacja mobilna i desktopowa (tylko wersja webowa)
14. Możliwość edytowania wygenerowanych podsumowań (tylko akceptacja lub odrzucenie)
15. Szablony notatek
16. System pomocy
17. Powiadomienia (poza informacją na UI o wygenerowaniu podsumowania)

## 5. Historyjki użytkowników

### Zarządzanie strukturą notatek

#### US-001: Tworzenie hierarchii tematów
Jako zalogowany użytkownik, chcę tworzyć hierarchiczną strukturę tematów, aby organizować moje notatki.

Kryteria akceptacji:
- Użytkownik może tworzyć nowe węzły (tematy) w strukturze
- Użytkownik może tworzyć podtematy (podwęzły) w istniejących tematach
- System wyświetla hierarchię tematów w formie drzewa po lewej stronie interfejsu
- Nie ma ograniczenia na poziomy zagnieżdżenia tematów
- Użytkownik może nadać nazwę każdemu tematowi

#### US-002: Edycja nazwy tematu
Jako zalogowany użytkownik, chcę edytować nazwy tematów, aby dostosować strukturę do moich potrzeb.

Kryteria akceptacji:
- Użytkownik może wybrać istniejący temat i zmienić jego nazwę
- System zapisuje zmiany po zatwierdzeniu
- Nowa nazwa jest od razu widoczna w strukturze drzewa

#### US-003: Usuwanie tematu
Jako zalogowany użytkownik, chcę usuwać tematy, które nie są mi już potrzebne.

Kryteria akceptacji:
- Użytkownik może wybrać istniejący temat i usunąć go
- System wyświetla ostrzeżenie przed usunięciem tematu zawierającego notatki lub podtematy
- Po potwierdzeniu, temat i wszystkie zawarte w nim notatki i podtematy są usuwane
- System wyświetla potwierdzenie usunięcia tematu

#### US-004: Nawigacja po strukturze tematów
Jako zalogowany użytkownik, chcę nawigować po strukturze tematów, aby łatwo znajdować i zarządzać moimi notatkami.

Kryteria akceptacji:
- Użytkownik może rozwijać i zwijać poszczególne gałęzie drzewa tematów
- System wyświetla aktualną ścieżkę nawigacji (breadcrumb) na górze ekranu
- Kliknięcie w temat powoduje wyświetlenie jego zawartości (podtematów i notatek)

### Zarządzanie notatkami

#### US-005: Tworzenie nowej notatki
Jako zalogowany użytkownik, chcę tworzyć nowe notatki w wybranym temacie, aby zapisywać ważne informacje.

Kryteria akceptacji:
- Użytkownik może utworzyć nową notatkę w wybranym temacie
- Użytkownik może nadać tytuł notatce
- Użytkownik może wprowadzić treść notatki w formacie markdown
- System automatycznie zapisuje notatkę podczas edycji
- Nowa notatka pojawia się w strukturze wybranego tematu

#### US-006: Edycja notatki
Jako zalogowany użytkownik, chcę edytować istniejące notatki, aby aktualizować ich treść.

Kryteria akceptacji:
- Użytkownik może wybrać istniejącą notatkę i edytować jej tytuł oraz treść
- System automatycznie zapisuje zmiany podczas edycji
- Użytkownik może podejrzeć zmiany w czasie rzeczywistym
- System zachowuje formatowanie markdown

#### US-007: Usuwanie notatki
Jako zalogowany użytkownik, chcę usuwać niepotrzebne notatki, aby utrzymać porządek.

Kryteria akceptacji:
- Użytkownik może wybrać istniejącą notatkę i usunąć ją
- System wyświetla prośbę o potwierdzenie przed usunięciem
- Po potwierdzeniu, notatka jest trwale usuwana
- System wyświetla potwierdzenie usunięcia notatki

#### US-008: Przeglądanie notatek
Jako zalogowany użytkownik, chcę przeglądać moje notatki, aby zapoznać się z ich treścią.

Kryteria akceptacji:
- Użytkownik może wybrać notatkę i zobaczyć jej pełną treść
- System wyświetla tytuł i treść notatki w głównym obszarze interfejsu
- Notatka jest wyświetlana w czytelnym formacie

### Generowanie i zarządzanie podsumowaniami

#### US-009: Generowanie podsumowania tematu
Jako zalogowany użytkownik, chcę generować podsumowania notatek z wybranego tematu, aby łatwiej przyswoić wiedzę.

Kryteria akceptacji:
- Użytkownik może wybrać temat i zainicjować generowanie podsumowania
- System informuje użytkownika o postępie generowania
- Generowanie podsumowania nie trwa dłużej niż 30 sekund
- Wygenerowane podsumowanie zawiera punkty kluczowe, daty, podsumowanie i listę pojęć
- System wyświetla wygenerowane podsumowanie użytkownikowi

#### US-010: Akceptacja wygenerowanego podsumowania
Jako zalogowany użytkownik, chcę akceptować wygenerowane podsumowania, aby zachować je do późniejszego wykorzystania.

Kryteria akceptacji:
- Użytkownik może zaakceptować wygenerowane podsumowanie
- System zapisuje zaakceptowane podsumowanie jako nową notatkę z odpowiednim tytułem i datą
- Zapisana notatka z podsumowaniem jest dostępna w wybranym temacie
- System wyświetla potwierdzenie zapisania podsumowania

#### US-011: Odrzucenie wygenerowanego podsumowania
Jako zalogowany użytkownik, chcę odrzucać nieodpowiednie podsumowania, aby móc wygenerować nowe.

Kryteria akceptacji:
- Użytkownik może odrzucić wygenerowane podsumowanie
- System nie zapisuje odrzuconego podsumowania
- Użytkownik może zainicjować ponowne generowanie podsumowania
- System wyświetla potwierdzenie odrzucenia podsumowania

#### US-012: Korzystanie z podsumowania do nauki
Jako zalogowany użytkownik, chcę korzystać z wygenerowanych podsumowań, aby efektywnie uczyć się i przygotowywać do sprawdzianów.

Kryteria akceptacji:
- Użytkownik może przeglądać zapisane podsumowania
- System wyświetla podsumowanie w czytelnym formacie
- Podsumowanie zawiera najważniejsze informacje z oryginalnych notatek

### Zarządzanie kontem

#### US-013: Zmiana hasła
Jako zalogowany użytkownik, chcę zmienić moje hasło, aby zwiększyć bezpieczeństwo mojego konta.

Kryteria akceptacji:
- Użytkownik może zainicjować proces zmiany hasła
- System wymaga podania aktualnego hasła
- System sprawdza, czy nowe hasło spełnia wymagania bezpieczeństwa
- Po pomyślnej zmianie hasła, system wyświetla potwierdzenie
- Użytkownik może zalogować się przy użyciu nowego hasła

#### US-014: Usunięcie konta
Jako zalogowany użytkownik, chcę mieć możliwość usunięcia mojego konta, jeśli nie chcę już korzystać z aplikacji.

Kryteria akceptacji:
- Użytkownik może zainicjować proces usunięcia konta
- System wyświetla ostrzeżenie o konsekwencjach usunięcia konta
- System wymaga potwierdzenia operacji przez podanie hasła
- Po usunięciu konta, wszystkie dane użytkownika są trwale usuwane
- System wyświetla potwierdzenie usunięcia konta

## 6. Metryki sukcesu

### 6.1 Metryki produktowe
- 75% podsumowań wygenerowanych przez AI jest akceptowanych przez użytkownika
- Użytkownicy tworzą 75% podsumowań tematów z wykorzystaniem AI
- Średni czas generowania podsumowania nie przekracza 30 sekund

### 6.2 Metryki użytkowe
- Ilość utworzonych notatek na użytkownika
- Średnia ilość znaków na notatkę (założenie: 3000 znaków)
- Średnia ilość notatek na lekcję (temat)
- Aktywność użytkowników (częstotliwość logowania, tworzenia notatek)
- Częstotliwość generowania podsumowań
- Rozkład głębokości struktury hierarchicznej (poziomy zagnieżdżenia)

### 6.3 Metryki techniczne
- Czas odpowiedzi aplikacji
- Stabilność działania (ilość awarii/błędów)
- Wydajność bazy danych
- Koszty związane z wykorzystaniem AI do generowania podsumowań 