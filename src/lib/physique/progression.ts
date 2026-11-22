import type { Landmark, MesoWeek, Progression } from "./types";

export interface ProgressionModel {
  id: Progression;
  name: string;
  short: string;
  /** Whether weekly sets ramp MEV → MAV → MRV across T1–T4. */
  rampsVolume: boolean;
  rule: (rir: string) => string;
  repsByWeek?: Partial<Record<MesoWeek, string>>;
}

export const PROGRESSIONS: ProgressionModel[] = [
  {
    id: "volume",
    name: "Progresja objętości",
    short: "Serie rosną z tygodnia na tydzień: MEV → MAV → blisko MRV, potem deload.",
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

/** Weekly sets target for a muscle given mesocycle week and progression model. */
export function progressionTarget(l: Landmark, week: MesoWeek, progression: Progression): number {
  const ramp = PROGRESSION_BY_ID[progression]?.rampsVolume ?? true;
  const mid = Math.round(l.mev + (l.mav - l.mev) * 0.5);
  switch (week) {
    case "T1":
      return ramp ? l.mev : mid;
    case "T2":
      return mid;
    case "T3":
      return ramp ? l.mav : mid;
    case "T4":
      return ramp ? Math.round(Math.min(l.mrv, l.mav + (l.mrv - l.mav) * 0.5)) : mid;
    case "DELOAD":
      return Math.max(l.mv, Math.round(l.mev * 0.5));
  }
}
