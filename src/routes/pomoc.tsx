import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/physique/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pomoc")({
  head: () => ({
    meta: [
      { title: "Jak tworzyć plany · PhysiqueOS" },
      { name: "description", content: "Jak tworzyć plany w PhysiqueOS: wywiad, metodyka, objętość frakcyjna oraz RIR i deload." },
      { property: "og:title", content: "Jak tworzyć plany w PhysiqueOS" },
      { property: "og:description", content: "Krótki przewodnik po tworzeniu planów w PhysiqueOS w 4 krokach." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Help,
});

const STEPS = [
  {
    title: "Zacznij od wywiadu",
    body: "Wybierz podopiecznego w panelu bocznym i uzupełnij wywiad: płeć, wiek, wzrost, masę, wagę docelową, poziom, cel i PAL. Na tej podstawie PhysiqueOS liczy BMR, TDEE, kalorie i makro, a płeć ustawia motyw kolorystyczny.",
    to: "/wywiad" as const,
    cta: "Otwórz wywiad",
  },
  {
    title: "Dobierz metodykę: dni, sprzęt, kontuzje",
    body: "Ustaw od 1 do 7 dni w tygodniu — układ tygodnia przebuduje się sam. Wybierz metodykę albo tryb automatyczny; karty pokazują, czy metoda jest zalecana dla poziomu i liczby dni. Zaznacz sprzęt (lub preset) i kontuzje — ryzykowne ćwiczenia zostaną zamienione na bezpieczniejsze.",
    to: "/wywiad" as const,
    cta: "Ustaw metodykę",
  },
  {
    title: "Kontroluj objętość frakcyjną",
    body: "Seria bezpośrednia liczy się jako 1.0 dla głównej partii, a mięśnie pomocnicze dostają ułamek (np. wyciskanie: 0.5 tricepsu i przedniego barku; wiosłowanie: 0.5 bicepsu i tylnego barku). Plan odejmuje wkład pośredni od celu, więc izolacji nie dokładasz w ciemno. Na stronie Objętość jednym suwakiem ustawiasz serie w tygodniu dla każdej partii; plan rozkłada je równo na dni, maks. 4 serie na ćwiczenie.",
    to: "/objetosc" as const,
    cta: "Przejdź do objętości",
  },
  {
    title: "Prowadź mezocykl z RIR i deloadem",
    body: "Tydzień T1 startuje od ustawionej objętości przy RIR 3. W progresji objętości T2–T4 dokładają 1–2 serie na partię co tydzień (RIR 2 → 0–1). Potem DELOAD: połowa serii, RIR 4+. Każde ćwiczenie w planie możesz zamienić przyciskiem „Zamień”. Po zatwierdzeniu kliknij „Stwórz plan” — przy włączonej integracji plan trafi do n8n.",
    to: "/" as const,
    cta: "Zobacz plan",
  },
];

function Help() {
  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow="Pomoc" title="Jak tworzyć plany w PhysiqueOS" description="Cztery kroki od wywiadu do gotowego planu stworzonego dla podopiecznego." />
      <ol className="grid gap-3 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="panel flex flex-col gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="tabular grid h-8 w-8 place-items-center rounded-md border border-primary/30 bg-primary/10 font-mono text-sm font-semibold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-medium">{s.title}</h2>
            </div>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            <div>
              <Button variant="subtle" size="sm" asChild>
                <Link to={s.to}>{s.cta}</Link>
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
