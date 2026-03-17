export const scenes = [
  {
    sceneId: "safety_los_001",
    title: "Safety: odcięcie linii widzenia",
    coachText: "Priorytet: schowaj bilę białą za 7, aby przeciwnik nie miał prostego dostępu do 1.",
    balls: [
      { id: "cue", label: "CB", color: "#f5f5f5", x: 220, y: 360 },
      { id: "one", label: "1", color: "#f8d64e", x: 620, y: 210 },
      { id: "seven", label: "7", color: "#8d4bf3", x: 500, y: 150 }
    ],
    frames: [
      {
        caption: "Setup: sytuacja startowa",
        positions: { cue: [220, 360], one: [620, 210], seven: [500, 150] },
        overlays: [{ type: "line", from: [220, 360], to: [620, 210], color: "#f7a83b", dash: "8 6" }]
      },
      {
        caption: "Decyzja: cienki kontakt i wyjście pod 7",
        positions: { cue: [350, 230], one: [670, 210], seven: [500, 150] },
        overlays: [{ type: "zone", at: [500, 150], radius: 70, color: "#35c48f" }]
      },
      {
        caption: "Outcome: brak bezpośredniej linii",
        positions: { cue: [485, 145], one: [690, 205], seven: [500, 150] },
        overlays: [{ type: "line", from: [690, 205], to: [485, 145], color: "#dd4e4e", dash: "4 8" }]
      }
    ],
    quiz: {
      question: "Jaki jest główny cel tego zagrania?",
      answers: [
        { id: "a", text: "Zagrać najmocniej jak się da", correct: false },
        { id: "b", text: "Ukryć bilę białą za 7", correct: true },
        { id: "c", text: "Wymusić natychmiastowy bank shot", correct: false }
      ],
      explanation: "To klasyczny safety: priorytetem jest ograniczenie widoczności bili obiektowej."
    }
  },
  {
    sceneId: "pattern_8ball_002",
    title: "Pattern Play: wybór właściwej kolejności",
    coachText: "Najpierw zagraj bilę, która otwiera kąty na key ball. Nie zaczynaj od najłatwiejszej wizualnie.",
    balls: [
      { id: "cue", label: "CB", color: "#f5f5f5", x: 280, y: 300 },
      { id: "solid3", label: "3", color: "#e24444", x: 430, y: 265 },
      { id: "solid6", label: "6", color: "#35c48f", x: 600, y: 180 },
      { id: "eight", label: "8", color: "#1f1f1f", x: 770, y: 260 }
    ],
    frames: [
      {
        caption: "Setup: trzy bile do końca",
        positions: { cue: [280, 300], solid3: [430, 265], solid6: [600, 180], eight: [770, 260] },
        overlays: [{ type: "line", from: [280, 300], to: [430, 265], color: "#7ac6ff", dash: "10 4" }]
      },
      {
        caption: "Decision: 3 -> 6, aby ustawić kąt na 8",
        positions: { cue: [520, 210], solid3: [430, 265], solid6: [600, 180], eight: [770, 260] },
        overlays: [{ type: "line", from: [520, 210], to: [770, 260], color: "#35c48f", dash: "" }]
      },
      {
        caption: "Outcome: naturalna pozycja na 8",
        positions: { cue: [665, 238], solid3: [430, 265], solid6: [600, 180], eight: [770, 260] },
        overlays: [{ type: "zone", at: [665, 238], radius: 45, color: "#35c48f" }]
      }
    ],
    quiz: {
      question: "Dlaczego nie warto zaczynać od najłatwiejszej bili „na oko”?",
      answers: [
        { id: "a", text: "Bo traci się kontrolę nad kolejnością i kątem na key ball", correct: true },
        { id: "b", text: "Bo łatwe bile są zakazane w 8-ballu", correct: false },
        { id: "c", text: "Bo zawsze trzeba zaczynać od bandy", correct: false }
      ],
      explanation: "W pattern play kluczowa jest kolejność budująca kąt i pozycję na końcówkę partii."
    }
  }
];
