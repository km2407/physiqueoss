# PhysiqueOSS

Aplikacja webowa dla trenerów personalnych: prowadzenie podopiecznych, wywiad, układanie planów treningowych i wyliczanie makroskładników w jednym miejscu.

**Demo:** https://physiqueoss.lovable.app

Projekt zbudowałem samodzielnie na potrzeby własnej pracy trenerskiej. Dane w wersji demo to fikcyjni podopieczni.

## Co potrafi

- **Wywiad z podopiecznym**: zbiera cel, doświadczenie i ograniczenia, na których opiera plan.
- **Plan treningowy**: generuje plan na podstawie wybranej metody, z wyborem partii mięśniowych na każdy dzień, splitami kulturystycznymi i progresją obciążeń.
- **Kontuzje**: wyklucza ćwiczenia, które nie pasują do urazu, i podpowiada, jak wspierać powrót do sprawności.
- **Objętość treningowa**: liczy objętość na partię mięśniową, w tym ułamkową.
- **Energia i makroskładniki**: wylicza zapotrzebowanie kaloryczne oraz białko, tłuszcze i węglowodany.
- **Podopieczni**: lista klientów z przełącznikiem w panelu bocznym i motywami kolorystycznymi.
- **Zapis na urządzeniu**: dane są zapisywane lokalnie w przeglądarce.

Logika treningowa i żywieniowa jest pokryta testami.

## Stack

- TypeScript (TanStack Start), React, Tailwind CSS
- Lovable (budowa i hosting aplikacji)
- Bun (zarządzanie pakietami)

## Uruchomienie lokalnie

Potrzebujesz Node.js i npm.

```bash
git clone https://github.com/km2407/physiqueoss.git
cd physiqueoss
npm install
npm run dev
```

## Jak powstał projekt

Aplikacja powstała w podejściu vibe coding: pomysły i prompty przygotowywałem w Gemini, błędy diagnozowałem z pomocą Claude, a całość składałem w Lovable. Każdą zmianę testuję, naprawiam błędy i dopiero potem rozwijam dalej.

Wcześniej przez około miesiąc aplikacja była zintegrowana z Claude Code, n8n i bazą Neon. Zrezygnowałem z tych rozwiązań ze względu na koszty, a w praktyce i tak były w niewielkim stopniu wykorzystywane, dlatego obecnie nie są podłączone.

## Plany rozwoju

Zakres prac i stan realizacji opisuje [roadmap.md](./roadmap.md).

## Autor

JM,
Kontakt: kubamajchrowski24@gmail.com
