# Billiard Edutainment Framework (wersja wykonalna bez realistycznej fizyki)

## 1) Założenie projektu

Ten projekt jest celowo ograniczony do **trybu edukacyjnego**:
- brak realistycznej fizyki,
- brak symulacji zderzeń i spinu w czasie rzeczywistym,
- tylko **statyczne, animowane diagramy** sytuacji bilardowych,
- nacisk na naukę przez **quizy, scenariusze i decyzje taktyczne**.

To podejście pozwala zbudować realny produkt szybciej, taniej i stabilniej.

---

## 2) Co dostaje użytkownik (MVP)

### 2.1 Widok stołu (top-down)
- stół 2D z góry,
- bile jako punkty/okręgi na stałych pozycjach,
- strzałki i linie pokazujące:
  - linię celowania,
  - przewidywany kierunek bili białej,
  - warianty A/B/C zagrania.

### 2.2 Animowane diagramy (bez fizyki)
Każda lekcja to sekwencja klatek:
1. **Setup** (pozycja startowa),
2. **Decision** (co zagrać i dlaczego),
3. **Outcome** (oczekiwany efekt),
4. **Alternative** (bezpieczniejsza/agresywniejsza opcja).

Animacja to przejścia między klatkami (fade, move, highlight), a nie symulacja ruchu wynikająca z równań fizycznych.

### 2.3 Quizy i gamifikacja
- quiz jednokrotnego wyboru: „Jaki jest najlepszy strzał?”,
- quiz „co jest błędem?” (analiza sytuacji),
- quiz sekwencyjny (ułóż pattern w dobrej kolejności),
- punkty, XP, streaki dzienne,
- odznaki za serie poprawnych odpowiedzi,
- poziomy tematyczne (np. Safety I, Pattern II, Kicks Basics).

---

## 3) Zakres merytoryczny (bez fizyki, ale wysoki poziom wiedzy)

### 3.1 Moduły edukacyjne
1. Fundamenty decyzji przy stole,
2. Pozycjonowanie i pattern play,
3. Safety play i zarządzanie ryzykiem,
4. Kicky i banki jako system decyzyjny,
5. Break strategy (na poziomie koncepcyjnym),
6. Psychologia i zarządzanie presją.

### 3.2 Jednostka treści: `LessonScene`
Każdy diagram powinien być zapisany jako scena:
- `sceneId`, `title`, `discipline`, `difficulty`,
- `table`: rozmiar i styl,
- `balls`: lista bil z pozycjami,
- `overlays`: linie, strefy, markery,
- `frames`: kroki animacji,
- `coachText`: komentarz szkoleniowy,
- `quiz`: pytanie + odpowiedzi + wyjaśnienie.

---

## 4) Architektura produktu (prosta i wykonalna)

### 4.1 Frontend
- React + TypeScript,
- rendering: SVG (najprostszy i czytelny dla diagramów edukacyjnych),
- prosty silnik animacji: CSS transitions / Framer Motion,
- tryby ekranu:
  - Lesson Player,
  - Quiz Mode,
  - Progress Dashboard.

### 4.2 Backend
- Node.js (NestJS lub Fastify),
- PostgreSQL (użytkownicy, lekcje, quizy, wyniki),
- Redis (rankingi sezonowe, cache),
- API:
  - `GET /lessons`, `GET /lessons/:id`,
  - `POST /quiz-attempts`,
  - `GET /progress`,
  - `GET /leaderboard`.

### 4.3 Dlaczego bez fizyki
- niższy koszt wdrożenia i utrzymania,
- mniejsze ryzyko błędów merytorycznych symulacji,
- szybsza produkcja treści edukacyjnych,
- łatwiejsze skalowanie biblioteki lekcji.

---

## 5) Model danych (minimum)

- `users`
- `lesson_scenes`
- `lesson_frames`
- `quiz_questions`
- `quiz_answers`
- `quiz_attempts`
- `user_progress`
- `achievements`
- `seasons`
- `leaderboards`

### 5.1 Co logować w próbie quizu
- `user_id`, `question_id`,
- `selected_answer`,
- `is_correct`,
- `response_time_ms`,
- `lesson_scene_id`,
- `created_at`.

---

## 6) Specyfikacja sceny edukacyjnej (JSON)

```json
{
  "sceneId": "safety_line_of_sight_001",
  "title": "Line-of-sight denial",
  "discipline": "9-ball",
  "difficulty": 3,
  "table": { "type": "pool9", "theme": "dark-green" },
  "balls": [
    { "id": "cue", "label": "CB", "x": 0.22, "y": 0.68 },
    { "id": "one", "label": "1", "x": 0.60, "y": 0.42 },
    { "id": "block", "label": "7", "x": 0.48, "y": 0.30 }
  ],
  "overlays": [
    { "type": "line", "from": [0.22, 0.68], "to": [0.60, 0.42], "style": "aim" },
    { "type": "zone", "shape": "circle", "center": [0.46, 0.28], "radius": 0.06, "style": "target" }
  ],
  "frames": [
    { "id": "setup", "caption": "Pozycja startowa" },
    { "id": "decision", "caption": "Bezpieczniejszy shot: schowaj CB za 7" },
    { "id": "outcome", "caption": "Brak bezpośredniej linii do 1" }
  ],
  "coachText": "W tej sytuacji priorytetem jest ograniczenie widoczności bili 1.",
  "quiz": {
    "question": "Jaki jest główny cel tego zagrania?",
    "answers": [
      { "id": "a", "text": "Maksymalna siła wbicia", "correct": false },
      { "id": "b", "text": "Ukrycie bili białej za 7", "correct": true },
      { "id": "c", "text": "Natychmiastowy atak na combo", "correct": false }
    ],
    "explanation": "To klasyczne zagranie safety: ograniczenie linii widzenia przeciwnika."
  }
}
```

---

## 7) Pętla gamifikacji (edutainment)

1. Użytkownik odpala krótką lekcję (2-4 min),
2. Ogląda 3-6 scen animowanych,
3. Rozwiązuje quiz po każdej scenie,
4. Dostaje feedback + mini-analizę,
5. Zdobywa XP i odblokowuje kolejny moduł.

### 7.1 Mechaniki nagród
- XP za poprawne odpowiedzi,
- bonus za szybkość odpowiedzi,
- streak dzienny,
- odznaki tematyczne (np. „Safety Novice”, „Pattern Analyst”),
- tygodniowe wyzwania.

### 7.2 Mechaniki retencji
- „powtórka po 24h” (spaced repetition),
- adaptacyjny dobór pytań (częściej to, co sprawia trudność),
- rekomendacja kolejnej lekcji na podstawie błędów.

---

## 8) Plan realizacji (12 tygodni)

### Etap 1 (tyg. 1-3): Fundament
- model danych scen i quizów,
- odtwarzacz jednej sceny SVG,
- API do pobierania lekcji.

### Etap 2 (tyg. 4-6): Edutainment loop
- animowane przejścia klatek,
- quiz engine,
- scoring i XP.

### Etap 3 (tyg. 7-9): Progress i ranking
- dashboard postępu,
- odznaki i streak,
- leaderboard sezonowy.

### Etap 4 (tyg. 10-12): Content scaling
- panel autora treści,
- import/eksport JSON scen,
- 150+ scen edukacyjnych.

---

## 9) Definition of Done (MVP)

MVP jest gotowe, jeśli:
- działa minimum 50 lekcji ze scenami,
- każda lekcja ma quiz i feedback,
- użytkownik ma widoczny postęp (XP/poziom/streak),
- dostępny jest ranking tygodniowy,
- średni czas lekcji nie przekracza 5 minut.

---

## 10) Następny krok po MVP

Dopiero po stabilnym MVP można rozważyć:
- „pseudo-fizykę” (nadal edukacyjną),
- generator wariantów scen,
- tryb trenerski dla grup.

Priorytetem pozostaje **produkt edukacyjny**, nie symulator fizyczny.
