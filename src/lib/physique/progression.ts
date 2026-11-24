import type { Landmark, MesoWeek, Progression } from "./types";

export interface ProgressionModel {
  id: Progression;
  name: string;
  short: string;
  /** Whether weekly sets grow from the chosen volume across T1–T4. */
  rampsVolume: boolean;
  rule: (rir: string) => string;
  repsByWeek?: Partial<Record<MesoWeek, string>>;
}

export const PROGRESSIONS: ProgressionModel[] = [
  {
    id: "volume",
    name: "Progresja objętości",
    short: "Start od ustawionej objętości w T1, potem co tydzień +1–2 serie na partię, na koniec deload.",
    rampsVolume: true,
    rule: (rir) => `Dokładaj 1–2 serie na partię co tydzień, utrzymując RIR ${rir}.`,
  },
  {
    id: "double",
    name: "Podwójna progresja",
    short: "Stałe serie. Dojdź do górnej granicy widełek we wszystkich seriach, potem dołóż ciężar.",
    rampsVolume: false,
    rule: (rir) => `Górna granica widełek we wszystkich seriach przy RIR ${rir} → +2,5–5% ciężaru i wróć do dolnej granicy.`,
  },
  {
    id: "linear",
    name: "Progresja liniowa",
    short: "Stałe serie i powtórzenia, ciężar rośnie co sesję lub co tydzień.",
    rampsVolume: false,
    rule: (rir) => `+2,5 kg (góra) / +5 kg (dół) co sesję, dopóki RIR nie spadnie poniżej ${rir}.`,
  },
  {
    id: "wave",
    name: "Progresja falowa",
    short: "Co tydzień mniej powtórzeń i większy ciężar (10–12 → 4–6), potem deload.",
    rampsVolume: false,
    rule: (rir) => `Każdy tydzień: cięższy ciężar w niższych widełkach, RIR ${rir}.`,
    repsByWeek: { T1: "10–12", T2: "8–10", T3: "6–8", T4: "4–6", DELOAD: "8–10 (lekko)" },
  },
  {
    id: "rir",
    name: "Autoregulacja RIR / RPE",
    short: "Ciężar dobierany do zapasu powtórzeń w danym dniu, serie rosną jak w progresji objętości.",
    rampsVolume: true,
    rule: (rir) => `Dobierz ciężar tak, by zostało ${rir} powt. w zapasie. Jeśli zostaje więcej, dołóż ciężar w kolejnej serii.`,
  },
];

export const PROGRESSION_BY_ID = Object.fromEntries(PROGRESSIONS.map((p) => [p.id, p])) as Record<
  Progression,
  ProgressionModel
>;

/** Weekly sets chosen with the volume slider (older saves fall back to the MEV–MAV midpoint). */
export function baseSets(l: Landmark): number {
  return typeof l.sets === "number" ? l.sets : Math.round((l.mev + l.mav) / 2);
}

const WEEK_STEP: Record<MesoWeek, number> = { T1: 0, T2: 1, T3: 2, T4: 3, DELOAD: 0 };

/** Weekly sets for a muscle: the slider value, grown week by week only for volume-ramping models. */
export function progressionTarget(l: Landmark, week: MesoWeek, progression: Progression): number {
  const base = baseSets(l);
  if (week === "DELOAD") return Math.round(base / 2);
  const ramp = PROGRESSION_BY_ID[progression]?.rampsVolume ?? true;
  if (!ramp || base < 4) return base;
  const step = Math.max(1, Math.round(base * 0.1));
  return base + step * WEEK_STEP[week];
}
