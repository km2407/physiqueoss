import type { Client, Goal } from "./types";

export function bmr(c: Pick<Client, "gender" | "weight" | "height" | "age">) {
  const base = 10 * c.weight + 6.25 * c.height - 5 * c.age;
  return Math.round(c.gender === "M" ? base + 5 : base - 161);
}

export function tdee(c: Pick<Client, "gender" | "weight" | "height" | "age" | "pal">) {
  return Math.round(bmr(c) * c.pal);
}

export const GOAL_ADJUST: Record<Goal, number> = {
  cut: -0.2,
  bulk: 0.1,
  recomp: -0.05,
  maintain: 0,
  strength: 0.05,
};

const PROTEIN_PER_KG: Record<Goal, number> = {
  cut: 2.2,
  bulk: 1.8,
  recomp: 2.2,
  maintain: 1.8,
  strength: 2.0,
};

export interface Energy {
  bmr: number;
  tdee: number;
  target: number;
  protein: number;
  fat: number;
  carbs: number;
}

export function energy(c: Client, kcalOffset = c.kcalOffset ?? 0): Energy {
  const t = tdee(c);
  const target = Math.round((t * (1 + GOAL_ADJUST[c.goal]) + kcalOffset) / 10) * 10;
  const protein = Math.round(c.weight * PROTEIN_PER_KG[c.goal]);
  const fat = Math.round(c.weight * (c.gender === "K" ? 1.0 : 0.9));
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  return { bmr: bmr(c), tdee: t, target, protein, fat, carbs };
}

export interface AutoReg {
  weeklyChangePct: number | null;
  advice: string;
  tone: "ok" | "warn" | "info";
  kcalDelta: number;
}

/** Compares weight trend from check-ins with the goal and suggests a calorie tweak. */
export function autoRegulation(c: Client): AutoReg {
  const list = [...c.checkins].sort((a, b) => a.date.localeCompare(b.date));
  if (list.length < 2)
    return { weeklyChangePct: null, advice: "Potrzebne min. 2 check-iny, by ocenić trend.", tone: "info", kcalDelta: 0 };
  const first = list[0]!;
  const last = list[list.length - 1]!;
  const daysSpan = Math.max(1, (Date.parse(last.date) - Date.parse(first.date)) / 86400000);
  const pct = ((last.weight - first.weight) / first.weight) * 100 * (7 / daysSpan);
  const r = Math.round(pct * 100) / 100;
  const g = c.goal;
  if (g === "cut") {
    if (pct > -0.4) return { weeklyChangePct: r, advice: "Spadek wolniejszy niż 0,4%/tydz. — obetnij ok. 150 kcal.", tone: "warn", kcalDelta: -150 };
    if (pct < -1.0) return { weeklyChangePct: r, advice: "Spadek szybszy niż 1%/tydz. — dodaj ok. 100 kcal, chroń mięśnie.", tone: "warn", kcalDelta: 100 };
    return { weeklyChangePct: r, advice: "Tempo redukcji w normie (0,4–1%/tydz.). Bez zmian.", tone: "ok", kcalDelta: 0 };
  }
  if (g === "bulk") {
    if (pct < 0.1) return { weeklyChangePct: r, advice: "Masa stoi — dodaj ok. 150 kcal.", tone: "warn", kcalDelta: 150 };
    if (pct > 0.5) return { weeklyChangePct: r, advice: "Przyrost powyżej 0,5%/tydz. — odejmij ok. 100 kcal.", tone: "warn", kcalDelta: -100 };
    return { weeklyChangePct: r, advice: "Tempo przyrostu w normie (0,1–0,5%/tydz.).", tone: "ok", kcalDelta: 0 };
  }
  if (Math.abs(pct) > 0.4)
    return {
      weeklyChangePct: r,
      advice: pct > 0 ? "Masa rośnie szybciej niż zakładano — odejmij ok. 100 kcal." : "Masa spada — dodaj ok. 100 kcal.",
      tone: "warn",
      kcalDelta: pct > 0 ? -100 : 100,
    };
  return { weeklyChangePct: r, advice: "Masa stabilna — zgodnie z celem.", tone: "ok", kcalDelta: 0 };
}
