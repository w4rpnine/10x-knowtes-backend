# API Endpoint Implementation Plan: PUT /notes/{id}

## 1. Przegląd punktu końcowego
Endpoint służy do aktualizacji istniejącej notatki według podanego ID. Umożliwia zmianę tytułu, treści lub obu tych właściwości jednocześnie. Wymagane jest uwierzytelnienie użytkownika oraz sprawdzenie, czy notatka należy do użytkownika.

## 2. Szczegóły żądania
- Metoda HTTP: PUT
- Struktura URL: `/notes/{id}`
- Parametry ścieżki:
  - `id` (UUID): Identyfikator notatki do aktualizacji
- Request Body:
  ```json
  {
    "title": "string", // Opcjonalne
    "content": "string" // Opcjonalne
  }
  ```
- Wymagane nagłówki:
  - `Content-Type: application/json`
  - `Authorization` (jeśli wymagane uwierzytelnienie)

## 3. Wykorzystywane typy
- **Modele wejściowe**:
  - `UpdateNoteCommand` z `src/types.ts` - zawiera opcjonalne pola `title` i `content`
- **Modele wyjściowe**:
  - `NoteDTO` z `src/types.ts` - reprezentuje zaktualizowaną notatkę

## 4. Szczegóły odpowiedzi
- Sukces (200 OK):
  ```json
  {
    "id": "uuid",
    "topic_id": "uuid",
    "title": "string",
    "content": "string",
    "is_summary": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- Błędy:
  - 400 Bad Request: Nieprawidłowe ID notatki lub dane wejściowe
  - 401 Unauthorized: Brak autoryzacji
  - 403 Forbidden: Użytkownik nie ma dostępu do notatki
  - 404 Not Found: Notatka nie istnieje
  - 500 Internal Server Error: Błąd serwera

## 5. Przepływ danych
1. Walidacja ID notatki za pomocą Zod
2. Walidacja danych wejściowych za pomocą Zod
3. Sprawdzenie istnienia notatki i czy należy do zalogowanego użytkownika
4. Aktualizacja notatki w bazie danych
5. Zwrócenie zaktualizowanej notatki

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Sprawdzenie sesji użytkownika przez middleware Astro
- **Autoryzacja**: Weryfikacja, czy notatka należy do zalogowanego użytkownika
- **Walidacja danych**: Użycie Zod do walidacji parametrów ścieżki i danych wejściowych
- **Sanityzacja danych**: Zapobieganie SQL Injection przez używanie parametryzowanych zapytań Supabase
- **CORS**: Obsługa preflight requests i dodanie odpowiednich nagłówków

## 7. Obsługa błędów
- Nieprawidłowy format ID: 400 Bad Request z komunikatem "Invalid note ID"
- Nieprawidłowe dane wejściowe: 400 Bad Request z komunikatem o błędzie walidacji
- Brak uprawnień: 403 Forbidden z komunikatem "Access denied"
- Notatka nie istnieje: 404 Not Found z komunikatem "Note not found"
- Błąd serwera: 500 Internal Server Error z komunikatem "Internal server error"
- Logowanie błędów w konsoli dla celów debugowania

## 8. Rozważania dotyczące wydajności
- Użycie transakcji do aktualizacji notatki, aby zapewnić atomiczność operacji
- Optymalizacja zapytania poprzez aktualizację tylko zmienionych pól
- Automatyczna aktualizacja pola `updated_at` za pomocą wyzwalacza bazy danych

## 9. Etapy wdrożenia

### 1. Rozszerzenie NotesService
Dodanie metody `updateNote` w klasie `NotesService` w pliku `src/lib/services/notes.service.ts`:

```typescript
async updateNote(
  noteId: string,
  userId: string,
  data: UpdateNoteCommand
): Promise<NoteDTO | null> {
  // Wczesna walidacja danych wejściowych
  if (!noteId || !userId) {
    throw new Error("Note ID and User ID are required");
  }
  
  // Sprawdzenie czy notatka istnieje i należy do użytkownika
  const existingNote = await this.getNoteById(noteId, userId);
  if (!existingNote) {
    return null;
  }
  
  // Przygotowanie danych do aktualizacji
  const updateData: Partial<NoteDTO> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  
  // Aktualizacja tylko jeśli są jakiekolwiek zmiany
  if (Object.keys(updateData).length === 0) {
    return existingNote;
  }
  
  // Aktualizacja notatki
  const { data: updatedNote, error } = await this.supabase
    .from("notes")
    .update(updateData)
    .eq("id", noteId)
    .eq("user_id", userId)
    .select("*")
    .single();
    
  if (error) {
    throw error;
  }
  
  return updatedNote as NoteDTO;
}
```

### 2. Implementacja endpointu PUT w pliku `src/pages/api/notes/[id].ts`

Dodanie metody PUT do istniejącego pliku `[id].ts`:

```typescript
/**
 * PUT /notes/{id} - Update a specific note
 *
 * @description Updates an existing note with new title and/or content.
 *
 * @param {Object} params.id - UUID of the note to update
 * @param {Object} request.body - Note data to update
 * @throws {400} - When note ID or input data is invalid
 * @throws {404} - When note is not found
 * @returns {Promise<Response>} Updated note data or error response
 */
export const PUT: APIRoute = async ({ params, locals, request }) => {
  // Common headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS request for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Validate note ID
    const paramsResult = paramsSchema.safeParse(params);
    if (!paramsResult.success) {
      return new Response(JSON.stringify({ error: "Invalid note ID" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate request body
    const updateNoteSchema = z.object({
      title: z.string().min(1).max(150).optional(),
      content: z.string().max(3000).optional(),
    });
    
    // Parse and validate input data
    const requestData = await request.json();
    const bodyResult = updateNoteSchema.safeParse(requestData);
    
    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data", 
          details: bodyResult.error.format() 
        }), {
          status: 400,
          headers: corsHeaders,
        }
      );
    }
    
    // Ensure at least one field is provided for update
    if (!bodyResult.data.title && !bodyResult.data.content) {
      return new Response(
        JSON.stringify({ 
          error: "At least one field (title or content) must be provided" 
        }), {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Update note using the service
    const notesService = new NotesService(locals.supabase);
    const updatedNote = await notesService.updateNote(
      paramsResult.data.id, 
      DEFAULT_USER_ID, // In production, use user ID from session
      bodyResult.data
    );

    if (!updatedNote) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(updatedNote), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
```

### 3. Aktualizacja importów i rozszerzenie istniejących schematów

Na początku pliku `src/pages/api/notes/[id].ts` należy dodać lub zaktualizować importy:

```typescript
import type { APIRoute } from "astro";
import { NotesService } from "../../../lib/services/notes.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { z } from "zod";
import type { UpdateNoteCommand } from "../../../types";
```

### 4. Testy jednostkowe

Utworzenie testów dla nowej metody `updateNote` w serwisie oraz dla endpointu PUT:

1. Test walidacji danych wejściowych
2. Test aktualizacji tylko tytułu
3. Test aktualizacji tylko treści
4. Test aktualizacji obu pól
5. Test obsługi nieistniejącej notatki
6. Test obsługi notatki należącej do innego użytkownika

### 5. Dokumentacja API

Aktualizacja dokumentacji API o nowy endpoint PUT /notes/{id}. 