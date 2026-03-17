# Billiard Edutainment MVP

Prosty prototyp edukacyjny:
- statyczne animowane diagramy stołu bilardowego,
- sceny klatkowe (setup/decision/outcome),
- quizy z punktami XP i streakiem,
- brak realistycznej fizyki (świadomie).

## Uruchomienie lokalne

```bash
cd docs/billiard_edutainment_mvp
python3 -m http.server 4173
```

Następnie otwórz:

- `http://localhost:4173`

## Struktura

- `index.html` – layout aplikacji,
- `styles.css` – stylowanie stołu i paneli,
- `scenes.js` – treści edukacyjne (sceny + quizy),
- `app.js` – silnik odtwarzania klatek i quiz engine.
