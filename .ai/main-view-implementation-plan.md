# Plan implementacji widoku głównego (Main View)

## 1. Przegląd
Widok główny to centralny punkt aplikacji 10x-knowtes, który zapewnia podstawowy interfejs do nawigacji po hierarchicznej strukturze tematów i notatek. Jego głównym celem jest umożliwienie użytkownikowi efektywnego zarządzania i przeglądania swoich notatek w usystematyzowanej formie drzewa.

## 2. Routing widoku
- Ścieżka: `/`
- Widok jest dostępny tylko dla zalogowanych użytkowników

## 3. Struktura komponentów
```
MainLayout
├── Header
│   ├── Logo
│   ├── Breadcrumb
│   └── UserAccountIcon
├── MainContent
│   ├── LeftPanel
│   │   ├── TopicTree
│   │   │   └── TreeNode (wielokrotne)
│   │   └── NewTopicButton
│   └── RightPanel
│       └── WelcomePanel
└── Footer
```

## 4. Szczegóły komponentów

### MainLayout
- Opis komponentu: Główny układ aplikacji zawierający nagłówek, treść główną podzieloną na lewy i prawy panel oraz stopkę.
- Główne elementy: Header, MainContent (LeftPanel, RightPanel), Footer
- Obsługiwane interakcje: Dostosowanie szerokości paneli poprzez przeciąganie separatora
- Obsługiwana walidacja: Sprawdzanie czy użytkownik jest zalogowany
- Typy: Brak specyficznych typów
- Propsy: children: ReactNode

### Header
- Opis komponentu: Górny pasek aplikacji zawierający logo, ścieżkę nawigacji (breadcrumb) oraz ikonę dostępu do konta użytkownika.
- Główne elementy: Logo, Breadcrumb, UserAccountIcon
- Obsługiwane interakcje: Brak
- Obsługiwana walidacja: Brak
- Typy: Brak specyficznych typów
- Propsy: Brak

### Breadcrumb
- Opis komponentu: Wyświetla aktualną ścieżkę nawigacji w hierarchii tematów.
- Główne elementy: Lista elementów ścieżki (BreadcrumbItem)
- Obsługiwane interakcje: Kliknięcie na element ścieżki
- Obsługiwana walidacja: Brak
- Typy: BreadcrumbItemViewModel[]
- Propsy: 
  - items: BreadcrumbItemViewModel[]
  - onItemClick: (id: string) => void

### UserAccountIcon
- Opis komponentu: Ikona dostępu do panelu konta użytkownika.
- Główne elementy: Ikona z menu rozwijalnym
- Obsługiwane interakcje: Kliknięcie na ikonę, wybór opcji z menu
- Obsługiwana walidacja: Brak
- Typy: Brak specyficznych typów
- Propsy: Brak

### LeftPanel
- Opis komponentu: Lewy panel zawierający drzewo tematów i przycisk do tworzenia nowego tematu.
- Główne elementy: TopicTree, NewTopicButton
- Obsługiwane interakcje: Dostosowanie szerokości panelu
- Obsługiwana walidacja: Brak
- Typy: Brak specyficznych typów
- Propsy: Brak

### TopicTree
- Opis komponentu: Wyświetla hierarchiczną strukturę tematów w formie drzewa.
- Główne elementy: TreeNode (wielokrotne), shadcn/ui Tree component
- Obsługiwane interakcje: Rozwijanie/zwijanie węzłów, wybór węzła
- Obsługiwana walidacja: Brak
- Typy: TopicTreeViewModel
- Propsy: 
  - nodes: TreeNodeViewModel[]
  - selectedNodeId: string | null
  - onNodeSelect: (id: string) => void
  - onNodeToggle: (id: string) => void

### TreeNode
- Opis komponentu: Pojedynczy węzeł w drzewie tematów.
- Główne elementy: Ikona typu węzła, tytuł, ikona rozwijania/zwijania
- Obsługiwane interakcje: Kliknięcie na węzeł, kliknięcie na ikonę rozwijania/zwijania
- Obsługiwana walidacja: Brak
- Typy: TreeNodeViewModel
- Propsy: 
  - node: TreeNodeViewModel
  - isSelected: boolean
  - onSelect: (id: string) => void
  - onToggle: (id: string) => void

### NewTopicButton
- Opis komponentu: Przycisk umożliwiający tworzenie nowego tematu.
- Główne elementy: Przycisk z ikoną dodawania
- Obsługiwane interakcje: Kliknięcie
- Obsługiwana walidacja: Brak
- Typy: Brak specyficznych typów
- Propsy: 
  - onClick: () => void

### RightPanel
- Opis komponentu: Prawy panel wyświetlający zawartość wybranego tematu lub ekran powitalny.
- Główne elementy: WelcomePanel (gdy nie wybrano tematu)
- Obsługiwane interakcje: Brak
- Obsługiwana walidacja: Brak
- Typy: Brak specyficznych typów
- Propsy: 
  - selectedNodeId: string | null

### WelcomePanel
- Opis komponentu: Panel powitalny wyświetlany, gdy nie wybrano żadnego tematu.
- Główne elementy: Wiadomość powitalna, instrukcje dla użytkownika
- Obsługiwane interakcje: Brak
- Obsługiwana walidacja: Brak
- Typy: Brak specyficznych typów
- Propsy: Brak

### NewTopicDialog
- Opis komponentu: Modal do tworzenia nowego tematu.
- Główne elementy: Formularz z polem na tytuł tematu, przyciski "Anuluj" i "Zapisz"
- Obsługiwane interakcje: Wprowadzanie tytułu, kliknięcie "Anuluj", kliknięcie "Zapisz"
- Obsługiwana walidacja: Sprawdzanie czy tytuł nie jest pusty
- Typy: CreateTopicCommand
- Propsy: 
  - isOpen: boolean
  - onClose: () => void
  - onSubmit: (data: CreateTopicCommand) => Promise<void>
  - isSubmitting: boolean
  - error: string | null

## 5. Typy

### TreeNodeViewModel
```typescript
interface TreeNodeViewModel {
  id: string;             // Unikalny identyfikator węzła
  title: string;          // Nazwa wyświetlana węzła
  children: TreeNodeViewModel[]; // Węzły potomne
  isExpanded: boolean;    // Czy węzeł jest rozwinięty
  level: number;          // Poziom zagnieżdżenia węzła
  type: 'topic' | 'note'; // Typ węzła (temat lub notatka)
}
```

### TopicTreeViewModel
```typescript
interface TopicTreeViewModel {
  nodes: TreeNodeViewModel[]; // Wszystkie węzły w drzewie
  selectedNodeId: string | null; // ID aktualnie wybranego węzła
}
```

### BreadcrumbItemViewModel
```typescript
interface BreadcrumbItemViewModel {
  id: string;     // Unikalny identyfikator elementu ścieżki
  title: string;  // Nazwa wyświetlana elementu ścieżki
  level: number;  // Poziom w hierarchii
}
```

## 6. Zarządzanie stanem

### useTopicTree
Hook zarządzający stanem drzewa tematów.

```typescript
const useTopicTree = () => {
  // Stan
  const [topics, setTopics] = useState<TopicDTO[]>([]);
  const [nodes, setNodes] = useState<TreeNodeViewModel[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Metody
  const loadTopics = async () => {
    // Logika ładowania tematów z API
  };

  const selectNode = (nodeId: string) => {
    // Logika wyboru węzła
  };

  const toggleNodeExpansion = (nodeId: string) => {
    // Logika rozwijania/zwijania węzła
  };

  const getBreadcrumbPath = (nodeId: string): BreadcrumbItemViewModel[] => {
    // Logika generowania ścieżki breadcrumb dla wybranego węzła
  };

  return {
    topics,
    nodes,
    selectedNodeId,
    expandedNodeIds,
    isLoading,
    error,
    loadTopics,
    selectNode,
    toggleNodeExpansion,
    getBreadcrumbPath
  };
};
```

### useCreateTopic
Hook zarządzający stanem tworzenia nowego tematu.

```typescript
const useCreateTopic = (onTopicCreated: () => void) => {
  // Stan
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateTopicCommand>({ title: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Metody
  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormData({ title: '' });
    setError(null);
  };

  const updateFormData = (data: Partial<CreateTopicCommand>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const submitForm = async () => {
    // Logika tworzenia nowego tematu
  };

  return {
    isDialogOpen,
    formData,
    isSubmitting,
    error,
    openDialog,
    closeDialog,
    updateFormData,
    submitForm
  };
};
```

## 7. Integracja API

### Pobieranie tematów
```typescript
const loadTopics = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const supabase = await getSupabaseClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('Użytkownik nie jest zalogowany');
    }
    
    const response = await getTopics(supabase, userId, { limit: 100, offset: 0 });
    setTopics(response.data);
    
    // Transformuj odpowiedź API na model widoku drzewa
    const treeNodes = transformTopicsToTreeNodes(response.data);
    setNodes(treeNodes);
  } catch (err) {
    setError('Nie udało się załadować tematów: ' + (err as Error).message);
  } finally {
    setIsLoading(false);
  }
};
```

### Tworzenie nowego tematu
```typescript
const submitForm = async () => {
  // Walidacja
  if (!formData.title.trim()) {
    setError('Tytuł tematu nie może być pusty');
    return;
  }
  
  setIsSubmitting(true);
  setError(null);
  
  try {
    const supabase = await getSupabaseClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('Użytkownik nie jest zalogowany');
    }
    
    await createTopic(supabase, userId, formData);
    closeDialog();
    onTopicCreated(); // Odświeżenie listy tematów
  } catch (err) {
    setError('Nie udało się utworzyć tematu: ' + (err as Error).message);
  } finally {
    setIsSubmitting(false);
  }
};
```

## 8. Interakcje użytkownika

1. **Tworzenie nowego tematu**
   - Użytkownik klika przycisk "Nowy temat" w lewym panelu
   - System wyświetla dialog z formularzem
   - Użytkownik wprowadza tytuł tematu
   - Użytkownik klika "Zapisz"
   - System wysyła żądanie do API w celu utworzenia tematu
   - Po pomyślnym utworzeniu tematu, system dodaje nowy temat do drzewa i zamyka dialog

2. **Nawigacja po drzewie tematów**
   - Użytkownik klika na węzeł w drzewie tematów
   - System zaznacza wybrany węzeł i aktualizuje ścieżkę breadcrumb
   - System wyświetla zawartość wybranego tematu w prawym panelu

3. **Rozwijanie/zwijanie węzłów**
   - Użytkownik klika na ikonę rozwijania/zwijania obok węzła
   - System rozwija lub zwija węzeł, pokazując lub ukrywając jego potomków

4. **Nawigacja przez breadcrumb**
   - Użytkownik klika na element ścieżki w breadcrumb
   - System przechodzi do wybranego poziomu w hierarchii, zaznaczając odpowiedni węzeł w drzewie

## 9. Warunki i walidacja

1. **Walidacja tworzenia tematu**
   - Tytuł tematu nie może być pusty
   - Walidacja jest przeprowadzana przed wysłaniem żądania do API
   - W przypadku niepowodzenia walidacji, system wyświetla odpowiedni komunikat błędu w dialogu

2. **Walidacja autentykacji**
   - Wszystkie żądania API wymagają zalogowanego użytkownika
   - System sprawdza, czy użytkownik jest zalogowany przed wykonaniem żądania
   - W przypadku braku autentykacji, system przekierowuje użytkownika na stronę logowania

## 10. Obsługa błędów

1. **Błędy ładowania tematów**
   - Jeśli nie udało się załadować tematów, system wyświetla komunikat błędu z możliwością ponownej próby
   - Możliwe przyczyny błędu: brak połączenia, brak autentykacji, błąd serwera

2. **Błędy tworzenia tematu**
   - Jeśli nie udało się utworzyć tematu, system wyświetla komunikat błędu w dialogu
   - Dialog pozostaje otwarty, umożliwiając użytkownikowi poprawienie danych lub anulowanie operacji
   - Możliwe przyczyny błędu: brak połączenia, brak autentykacji, błąd serwera, duplikat tytułu

3. **Obsługa problemów z siecią**
   - System wykrywa problemy z połączeniem internetowym
   - W przypadku utraty połączenia, system wyświetla komunikat informacyjny
   - Po przywróceniu połączenia, system automatycznie odświeża dane

## 11. Kroki implementacji

1. **Przygotowanie środowiska i podstawowych komponentów**
   - Utworzenie struktury plików zgodnie z konwencją projektu
   - Implementacja MainLayout i podstawowych kontenerów

2. **Implementacja zarządzania stanem**
   - Implementacja hooka useTopicTree
   - Implementacja hooka useCreateTopic

3. **Implementacja komponentów drzewa tematów**
   - Implementacja TopicTree i TreeNode
   - Integracja z API do pobierania tematów

4. **Implementacja tworzenia nowego tematu**
   - Implementacja NewTopicButton i NewTopicDialog
   - Integracja z API do tworzenia tematu

5. **Implementacja nawigacji**
   - Implementacja Breadcrumb
   - Implementacja logiki wyboru węzła i aktualizacji ścieżki

6. **Implementacja prawego panelu**
   - Implementacja WelcomePanel
   - Implementacja wyświetlania zawartości wybranego tematu

7. **Testowanie**
   - Testy jednostkowe dla kluczowych funkcji
   - Testy integracyjne dla interakcji z API
   - Testy UI dla interakcji użytkownika

8. **Optymalizacja wydajności**
   - Implementacja memoizacji dla drzewa tematów
   - Optymalizacja renderowania dużych drzew (wirtualizacja)

9. **Dostępność i UX**
   - Implementacja skrótów klawiaturowych
   - Dostosowanie interfejsu do standardów dostępności
   - Testowanie responsywności

10. **Finalizacja**
    - Refaktoryzacja i czyszczenie kodu
    - Dokumentacja komponentów i hooków
    - Code review i poprawki 