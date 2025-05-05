# API Endpoint Implementation Plan: POST /topics/{topicId}/notes

## 1. Przegląd punktu końcowego
Endpoint służy do tworzenia nowych notatek w ramach wybranego tematu. Pozwala użytkownikowi na dodanie tytułu oraz treści notatki, z opcją oznaczenia jej jako podsumowanie. Notatka jest przypisywana do konkretnego tematu określonego przez parametr `topicId` w URL.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: `/topics/{topicId}/notes`
- Parametry URL:
  - Wymagane: `topicId` (UUID tematu)
- Request Body:
  ```json
  {
    "title": "string",
    "content": "string",
    "is_summary": boolean // Opcjonalny, domyślnie false
  }
  ```

## 3. Wykorzystywane typy
- **Command Model**: `CreateNoteCommand` (już zdefiniowany w `src/types.ts`)
  ```typescript
  export interface CreateNoteCommand {
    title: string;
    content: string;
    is_summary?: boolean; // Optional, defaults to false
  }
  ```
- **DTO Response**: `NoteDTO` (już zdefiniowany w `src/types.ts`)

## 4. Szczegóły odpowiedzi
- Status: 201 Created
- Response Body:
  ```json
  {
    "id": "uuid",
    "topic_id": "uuid",
    "title": "string",
    "content": "string",
    "is_summary": boolean,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- Kody błędów:
  - 400 Bad Request - Nieprawidłowe dane wejściowe
  - 401 Unauthorized - Brak autoryzacji
  - 403 Forbidden - Brak uprawnień do tematu
  - 404 Not Found - Temat nie istnieje
  - 500 Internal Server Error - Błąd serwera

## 5. Przepływ danych
1. Walidacja danych wejściowych za pomocą Zod
2. Autoryzacja użytkownika
3. Sprawdzenie istnienia tematu
4. Sprawdzenie uprawnień użytkownika do tematu
5. Utworzenie nowej notatki w bazie danych
6. Zwrócenie utworzonej notatki

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint wymaga uwierzytelnionego użytkownika
- **Autoryzacja**: Sprawdzenie czy zalogowany użytkownik ma dostęp do tematu o podanym `topicId`
- **Walidacja danych**:
  - Sprawdzenie czy `title` nie jest pusty i mieści się w 150 znakach (zgodnie z ograniczeniami bazy danych)
  - Sprawdzenie czy `content` mieści się w 3000 znakach (zgodnie z ograniczeniami bazy danych)
  - Sprawdzenie czy `is_summary` jest wartością logiczną, jeśli jest podany

## 7. Obsługa błędów
- **400 Bad Request**:
  - Tytuł notatki jest pusty
  - Tytuł notatki przekracza 150 znaków
  - Treść notatki przekracza 3000 znaków
  - is_summary nie jest wartością logiczną
- **401 Unauthorized**:
  - Brak tokenu uwierzytelniającego
  - Nieprawidłowy token uwierzytelniający
- **403 Forbidden**:
  - Użytkownik nie ma uprawnień do danego tematu
- **404 Not Found**:
  - Temat o podanym `topicId` nie istnieje
- **500 Internal Server Error**:
  - Błąd podczas komunikacji z bazą danych
  - Niespodziewane wyjątki podczas przetwarzania żądania

## 8. Rozważania dotyczące wydajności
- Wykorzystanie indeksów na kolumnach `topic_id` i `user_id` w tabeli `notes`
- Minimalizacja liczby zapytań do bazy danych
- Ograniczenie rozmiaru zawartości notatki do 3000 znaków

## 9. Etapy wdrożenia

1. **Utworzenie schematu walidacji**:
   ```typescript
   // src/lib/schemas/note.schema.ts
   import { z } from 'zod';

   export const createNoteSchema = z.object({
     title: z.string().min(1).max(150),
     content: z.string().max(3000),
     is_summary: z.boolean().optional().default(false)
   });

   export type CreateNoteInput = z.infer<typeof createNoteSchema>;
   ```

2. **Utworzenie lub rozszerzenie serwisu Notes**:
   ```typescript
   // src/lib/services/notes.service.ts
   import type { SupabaseClient } from '../db/supabase.client';
   import type { CreateNoteCommand, NoteDTO } from '../../types';

   export async function createNote(
     supabase: SupabaseClient,
     userId: string,
     topicId: string,
     data: CreateNoteCommand
   ): Promise<NoteDTO | null> {
     // Sprawdź czy temat istnieje i należy do użytkownika
     const { data: topic, error: topicError } = await supabase
       .from('topics')
       .select('id')
       .eq('id', topicId)
       .eq('user_id', userId)
       .single();
       
     if (topicError || !topic) {
       return null;
     }
     
     // Utwórz nową notatkę
     const { data: note, error } = await supabase
       .from('notes')
       .insert({
         topic_id: topicId,
         user_id: userId,
         title: data.title,
         content: data.content,
         is_summary: data.is_summary ?? false
       })
       .select('*')
       .single();
       
     if (error) {
       throw error;
     }
     
     return note;
   }
   ```

3. **Implementacja endpoint'u**:
   ```typescript
   // src/pages/api/topics/[topicId]/notes.ts
   import type { APIRoute } from 'astro';
   import { createNoteSchema } from '../../../../lib/schemas/note.schema';
   import { createNote } from '../../../../lib/services/notes.service';

   export const prerender = false;

   export const POST: APIRoute = async ({ request, params, locals }) => {
     const supabase = locals.supabase;
     const session = await locals.getSession();
     
     // Sprawdź uwierzytelnienie
     if (!session) {
       return new Response(
         JSON.stringify({ error: 'Unauthorized' }),
         { status: 401, headers: { 'Content-Type': 'application/json' } }
       );
     }
     
     const userId = session.user.id;
     const topicId = params.topicId;
     
     if (!topicId) {
       return new Response(
         JSON.stringify({ error: 'Topic ID is required' }),
         { status: 400, headers: { 'Content-Type': 'application/json' } }
       );
     }
     
     try {
       // Parsuj i waliduj dane wejściowe
       const requestData = await request.json();
       const validatedData = createNoteSchema.safeParse(requestData);
       
       if (!validatedData.success) {
         return new Response(
           JSON.stringify({ 
             error: 'Validation failed', 
             details: validatedData.error.format() 
           }),
           { status: 400, headers: { 'Content-Type': 'application/json' } }
         );
       }
       
       // Utworzenie notatki
       const note = await createNote(
         supabase,
         userId,
         topicId,
         validatedData.data
       );
       
       if (!note) {
         return new Response(
           JSON.stringify({ error: 'Topic not found or access denied' }),
           { status: 404, headers: { 'Content-Type': 'application/json' } }
         );
       }
       
       // Zwróć utworzoną notatkę
       return new Response(
         JSON.stringify(note),
         { status: 201, headers: { 'Content-Type': 'application/json' } }
       );
     } catch (error) {
       return new Response(
         JSON.stringify({ error: 'Internal server error' }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
       );
     }
   };
   ```

4. **Testy**:
   - Test pomyślnego utworzenia notatki
   - Test walidacji danych wejściowych
   - Test autoryzacji
   - Test przypadku nieistniejącego tematu
   - Test przypadku braku uprawnień do tematu

5. **Dodanie dokumentacji API**:
   - Aktualizacja dokumentacji API o nowy endpoint
   - Opisanie wymagań i potencjalnych błędów 