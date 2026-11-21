import type { Client, Level, MethodChoice, MethodId } from "./types";

export type Structure = "fbw" | "ul" | "ppl" | "split";

export interface SetScheme {
  /** Hard cap on working sets per exercise (HIT styles). */
  maxSetsPerExercise?: number;
  reps: string;
  rest: string;
  note?: string;
}

export interface Methodology {
  id: MethodId;
  name: string;
  author?: string;
  short: string;
  description: string;
  levels: Level[];
  notFor: string;
  structure: (days: number) => Structure;
  scheme: SetScheme;
}

const byDays = (days: number): Structure => {
  if (days <= 2) return "fbw";
  if (days === 3) return "ppl";
  if (days === 4) return "ul";
  return "ppl";
};

export const METHODS: Methodology[] = [
  {
    id: "heavy-duty",
    name: "Heavy Duty",
    author: "Mike Mentzer",
    short: "HIT — 1 seria robocza do załamania, treningi co 4–7 dni.",
    description:
      "Skrajnie niska objętość: zwykle 1 seria robocza do pełnego załamania mięśniowego, opcjonalnie powtórzenia wymuszone lub negatywne. Rzadkie treningi (co 4–7 dni).",
    levels: ["advanced"],
    notFor: "Niezalecane dla początkujących i średniozaawansowanych.",
    structure: (d) => (d <= 2 ? "fbw" : "split"),
    scheme: { maxSetsPerExercise: 1, reps: "6–10 do załamania", rest: "3–5 min", note: "+ opcjonalnie wymuszone / negatywy" },
  },
  {
    id: "blood-guts",
    name: "Blood & Guts",
    author: "Dorian Yates",
    short: "Rozgrzewka + 1–2 serie do załamania z technikami intensyfikacji.",
    description:
      "Seria rozgrzewkowa i 1–2 serie robocze do załamania z wymuszonymi, drop-setami, rest-pause i negatywami. Nacisk na gęstość i masę.",
    levels: ["advanced"],
    notFor: "Niezalecane dla początkujących, średniozaawansowanych i bez asekuracji przy ciężkich bojach.",
    structure: (d) => (d <= 2 ? "fbw" : "split"),
    scheme: { maxSetsPerExercise: 2, reps: "6–10 do załamania", rest: "2–3 min", note: "drop-set / rest-pause w ostatniej serii" },
  },
  {
    id: "hiit",
    name: "HIIT",
    short: "Krótkie interwały wysokiej intensywności + trening oporowy.",
    description:
      "Krótkie interwały o wysokiej intensywności przeplatane odpoczynkiem. Wspiera wydolność, efekt EPOC i redukcję. W PhysiqueOS łączony z bazą siłową FBW.",
    levels: ["intermediate", "advanced"],
    notFor: "Niezalecane dla początkujących, przy dużej nadwadze/otyłości oraz problemach układu krążenia lub stawów.",
    structure: () => "fbw",
    scheme: { reps: "10–15", rest: "45–60 s", note: "+ 8–10 × 20 s pracy / 40 s przerwy na koniec" },
  },
  {
    id: "gvt",
    name: "GVT",
    author: "German Volume Training",
    short: "10 × 10 w głównym wielostawie (~60% 1RM).",
    description:
      "10 serii po 10 powtórzeń w głównym ćwiczeniu wielostawowym (ok. 60% 1RM, krótkie przerwy). Wysoka objętość i stres metaboliczny.",
    levels: ["advanced", "intermediate"],
    notFor: "Niezalecane dla początkujących i przy głębokim deficycie kalorycznym.",
    structure: (d) => (d <= 2 ? "fbw" : d === 4 ? "ul" : "split"),
    scheme: { reps: "10 (10×10 w pierwszym ćwiczeniu)", rest: "60–90 s" },
  },
  {
    id: "fst7",
    name: "FST-7",
    author: "Hany Rambod",
    short: "Baza siłowa + 7 serii pompujących na końcu partii.",
    description:
      "Baza siłowa, a na koniec partii 7 serii po 8–12 powtórzeń z przerwami 30–45 s i rozciąganiem/spinaniem powięzi między seriami. Pompa i estetyka.",
    levels: ["intermediate", "advanced"],
    notFor: "Niezalecane dla początkujących.",
    structure: (d) => (d <= 2 ? "fbw" : d === 4 ? "ul" : "split"),
    scheme: { reps: "8–12", rest: "90 s (FST-7: 30–45 s)" },
  },
  {
    id: "rest-pause",
    name: "Rest-Pause System",
    short: "Seria do załamania, 10–15 s przerwy, dogrywka.",
    description:
      "Seria do załamania, krótka przerwa 10–15 s, dogranie powtórzeń do załamania i powtórka. Siła i masa przy małej liczbie osobnych serii.",
    levels: ["advanced"],
    notFor: "Niezalecane dla początkujących i średniozaawansowanych.",
    structure: (d) => (d <= 2 ? "fbw" : d === 4 ? "ul" : "split"),
    scheme: { maxSetsPerExercise: 2, reps: "6–8 + 2–4 + 1–3", rest: "2–3 min (pauzy 10–15 s)" },
  },
  {
    id: "531",
    name: "5/3/1",
    author: "Jim Wendler",
    short: "Falowa progresja %1RM w 4-tygodniowych cyklach z deloadem i AMRAP.",
    description:
      "Falowa progresja na %1RM w głównych bojach w 4-tygodniowych cyklach z deloadem oraz seriami AMRAP. Rozwój siły i kontrola zmęczenia.",
    levels: ["intermediate", "advanced"],
    notFor: "Niezalecane dla zupełnie początkujących.",
    structure: (d) => (d <= 2 ? "fbw" : "ul"),
    scheme: { reps: "5/3/1 + AMRAP (bój), 8–12 (akcesoria)", rest: "3 min / 90 s" },
  },
  {
    id: "fbw",
    name: "FBW",
    author: "Full Body Workout",
    short: "Całe ciało na każdej sesji, częste bodźcowanie.",
    description:
      "Pełne ciało na sesji, objętość tygodniowa dzielona na mniejsze porcje i częste bodźcowanie partii.",
    levels: ["beginner", "intermediate"],
    notFor: "Niezalecane dla zaawansowanych przy wąskiej specjalizacji partii.",
    structure: () => "fbw",
    scheme: { reps: "6–12", rest: "90–120 s" },
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    short: "Góra i dół ciała, dzień cięższy i objętościowy.",
    description:
      "Podział na sesje góry i dołu ciała. Wygodne zarządzanie objętością i intensywnością (cięższy i lżejszy/objętościowy dzień).",
    levels: ["intermediate", "advanced"],
    notFor: "Niezalecane przy 2 dniach w tygodniu (wtedy lepsze FBW).",
    structure: () => "ul",
    scheme: { reps: "5–8 (ciężki) / 10–15 (objętościowy)", rest: "2 min / 75 s" },
  },
  {
    id: "ppl",
    name: "PPL",
    author: "Push / Pull / Legs",
    short: "Wypychanie, przyciąganie, nogi — 3–6 dni.",
    description:
      "Ruchy wypychające, przyciągające i nogi. Łatwa kontrola zmęczenia przy 3–6 dniach w tygodniu.",
    levels: ["intermediate", "advanced"],
    notFor: "Niezalecane dla początkujących przy niskiej częstotliwości (np. 1×/tydz. na partię).",
    structure: () => "ppl",
    scheme: { reps: "6–12", rest: "90–120 s" },
  },
  {
    id: "split",
    name: "Klasyczny Split",
    short: "Duża objętość na wybrane partie w jednej sesji.",
    description: "Większe skupienie objętości na wybranych partiach podczas jednej sesji.",
    levels: ["intermediate", "advanced"],
    notFor: "Niezalecane dla początkujących.",
    structure: () => "split",
    scheme: { reps: "8–12", rest: "90 s" },
  },
  {
    id: "linear-rir",
    name: "Progresja liniowa / podwójna (RIR/RPE)",
    short: "Dokładanie ciężaru lub powtórzeń w widełkach z kontrolą RIR.",
    description:
      "Dokładanie ciężaru lub dochodzenie do górnej granicy widełek powtórzeń przed dołożeniem ciężaru, z kontrolą zapasu powtórzeń (RIR/RPE). Dobra od startu i jako baza.",
    levels: ["beginner", "intermediate", "advanced"],
    notFor: "Sztywna progresja liniowa bez deloadu i RIR niezalecana dla zaawansowanych.",
    structure: byDays,
    scheme: { reps: "8–12 (podwójna progresja)", rest: "90–150 s" },
  },
];

export const METHOD_BY_ID = Object.fromEntries(METHODS.map((m) => [m.id, m])) as Record<
  MethodId,
  Methodology
>;

export function bmi(c: Pick<Client, "weight" | "height">) {
  const h = c.height / 100;
  return c.weight / (h * h);
}

/** Auto mode: picks a methodology from level, days and goal. */
export function autoMethod(c: Pick<Client, "level" | "days" | "goal">): MethodId {
  const { level, days, goal } = c;
  if (days <= 2) return "fbw";
  if (goal === "strength" && level !== "beginner" && days <= 4) return "531";
  if (level === "beginner") return days === 3 ? "fbw" : "linear-rir";
  if (level === "intermediate") {
    if (days === 3) return "fbw";
    if (days === 4) return "upper-lower";
    return "ppl";
  }
  if (days === 3) return "ppl";
  if (days === 4) return "upper-lower";
  if (days === 5) return "split";
  return "ppl";
}

export function resolveMethod(c: Client): MethodId {
  return c.method === "auto" ? autoMethod(c) : c.method;
}

export interface Suitability {
  ok: boolean;
  reasons: string[];
}

/** Checks whether a methodology suits a client; reasons list why not. */
export function methodSuitability(
  id: MethodId,
  c: Pick<Client, "level" | "days" | "goal" | "weight" | "height" | "injuries">,
): Suitability {
  const m = METHOD_BY_ID[id];
  const reasons: string[] = [];
  if (!m.levels.includes(c.level)) reasons.push(m.notFor);
  if (id === "upper-lower" && c.days <= 2) reasons.push("Przy 2 dniach lub mniej lepsze będzie FBW.");
  if (id === "ppl" && c.level === "beginner" && c.days < 6)
    reasons.push("Przy mniej niż 6 dniach każda partia dostaje bodziec tylko 1×/tydz.");
  if (id === "hiit" && bmi(c) >= 30) reasons.push("BMI ≥ 30 — HIIT obciąża stawy i układ krążenia.");
  if (id === "hiit" && (c.injuries.includes("knee") || c.injuries.includes("ankle")))
    reasons.push("Kontuzja kolana/kostki — interwały uderzeniowe są ryzykowne.");
  if (id === "gvt" && c.goal === "cut") reasons.push("Głęboki deficyt utrudnia regenerację po 10×10.");
  if ((id === "heavy-duty" || id === "blood-guts") && c.days >= 6)
    reasons.push("Treningi do załamania wymagają 4–7 dni przerwy dla partii.");
  return { ok: reasons.length === 0, reasons: Array.from(new Set(reasons)) };
}

export function methodLabel(choice: MethodChoice, c: Client): string {
  if (choice === "auto") return `Auto · ${METHOD_BY_ID[autoMethod(c)].name}`;
  return METHOD_BY_ID[choice].name;
}

export function daysHint(days: number, level: Level): { tone: "info" | "warn"; text: string } | null {
  if (days === 1)
    return { tone: "warn", text: "1 dzień to minimum podtrzymujące — plan FBW z całym ciałem w jednej sesji." };
  if (days === 2) return { tone: "info", text: "2 dni: najlepiej FBW A/B, każda partia 2×/tydz." };
  if (days === 7)
    return { tone: "warn", text: "7 dni bez dnia wolnego — zadbaj o rotację partii, sen i niższy RIR tylko w T4." };
  if (days === 6 && level === "beginner")
    return { tone: "warn", text: "6 dni dla początkującego to dużo — rozważ 3–4 dni i progresję liniową." };
  return null;
}
