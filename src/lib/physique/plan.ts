import { EXERCISES, type Exercise } from "./exercises";
import { ALL_MUSCLES, INJURY_LABEL, MUSCLE_LABEL } from "./labels";
import { METHOD_BY_ID, resolveMethod, type Methodology, type Structure } from "./methods";
import { PROGRESSION_BY_ID, progressionTarget, type ProgressionModel } from "./progression";
import type { Client, Equipment, Injury, Landmark, MesoWeek, Muscle, ScheduleDay } from "./types";

export const DAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

/** Which weekdays (0 = Mon) are training days for 1–7 sessions per week. */
export const DAY_LAYOUT: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export function clampDays(days: number) {
  return Math.min(7, Math.max(1, Math.round(days)));
}

/** Weekly sets target for a muscle in a given mesocycle week. */
export function weekTarget(l: Landmark, week: MesoWeek): number {
  switch (week) {
    case "T1":
      return l.mev;
    case "T2":
      return Math.round(l.mev + (l.mav - l.mev) * 0.5);
    case "T3":
      return l.mav;
    case "T4":
      return Math.round(Math.min(l.mrv, l.mav + (l.mrv - l.mav) * 0.5));
    case "DELOAD":
      return Math.max(l.mv, Math.round(l.mev * 0.5));
  }
}

export const RIR_BY_WEEK: Record<MesoWeek, string> = {
  T1: "3",
  T2: "2",
  T3: "1",
  T4: "0–1",
  DELOAD: "4+",
};

interface SessionTemplate {
  name: string;
  slots: Muscle[];
}

const PUSH: Muscle[] = ["chest", "frontDelt", "chest", "sideDelt", "triceps", "triceps"];
const PULL: Muscle[] = ["back", "back", "rearDelt", "biceps", "biceps", "erectors"];
const LEGS: Muscle[] = ["quads", "hamstrings", "glutes", "quads", "calves", "abs"];
const UPPER: Muscle[] = ["chest", "back", "frontDelt", "back", "chest", "sideDelt", "biceps", "triceps"];
const UPPER_B: Muscle[] = ["back", "chest", "sideDelt", "back", "rearDelt", "triceps", "biceps"];
const LOWER: Muscle[] = ["quads", "hamstrings", "glutes", "quads", "calves", "abs"];
const LOWER_B: Muscle[] = ["hamstrings", "quads", "glutes", "hamstrings", "calves", "abs", "erectors"];

const SPLIT_DAYS: Record<string, Muscle[]> = {
  "Klatka": ["chest", "chest", "chest", "chest", "frontDelt"],
  "Plecy": ["back", "back", "back", "back", "rearDelt", "erectors"],
  "Barki": ["frontDelt", "sideDelt", "sideDelt", "rearDelt", "rearDelt"],
  "Nogi": ["quads", "quads", "hamstrings", "glutes", "hamstrings", "calves"],
  "Ramiona": ["biceps", "triceps", "biceps", "triceps", "biceps", "triceps"],
  "Klatka + Triceps": ["chest", "chest", "chest", "triceps", "triceps"],
  "Plecy + Biceps": ["back", "back", "back", "rearDelt", "biceps", "biceps"],
  "Barki + Brzuch": ["frontDelt", "sideDelt", "sideDelt", "rearDelt", "abs", "abs"],
  "Klatka + Barki + Triceps": ["chest", "chest", "frontDelt", "sideDelt", "triceps", "triceps"],
  "Nogi: czworogłowe": ["quads", "quads", "quads", "calves", "abs"],
  "Nogi: dwugłowe + pośladki": ["hamstrings", "glutes", "hamstrings", "glutes", "calves"],
  "Słabe punkty": ["sideDelt", "rearDelt", "calves", "abs"],
};

const SPLIT_LAYOUT: Record<number, string[]> = {
  3: ["Klatka + Barki + Triceps", "Plecy + Biceps", "Nogi"],
  4: ["Klatka + Triceps", "Plecy + Biceps", "Barki + Brzuch", "Nogi"],
  5: ["Klatka", "Plecy", "Barki", "Nogi", "Ramiona"],
  6: ["Klatka", "Plecy", "Nogi: czworogłowe", "Barki", "Ramiona", "Nogi: dwugłowe + pośladki"],
  7: ["Klatka", "Plecy", "Nogi: czworogłowe", "Barki", "Ramiona", "Nogi: dwugłowe + pośladki", "Słabe punkty"],
};

const FBW_BASE: Muscle[] = ["quads", "chest", "back", "hamstrings", "sideDelt", "triceps", "biceps"];
const FBW_EXTRA: Muscle[][] = [
  ["calves", "abs"],
  ["glutes", "rearDelt"],
  ["frontDelt", "abs"],
];

export function sessionTemplates(structure: Structure, days: number): SessionTemplate[] {
  const d = clampDays(days);
  const s: Structure = d === 1 ? "fbw" : structure === "split" && d < 3 ? "fbw" : structure;
  const letters = ["A", "B", "C"];
  if (s === "fbw") {
    if (d === 1)
      return [{ name: "Full Body", slots: [...FBW_BASE, "glutes", "rearDelt", "frontDelt", "calves", "abs"] }];
    return Array.from({ length: d }, (_, i) => ({
      name: `Full Body ${letters[i % 3]}`,
      slots: [...FBW_BASE, ...(FBW_EXTRA[i % 3] ?? [])],
    }));
  }
  if (s === "ul") {
    return Array.from({ length: d }, (_, i) => {
      const upper = i % 2 === 0;
      const variant = Math.floor(i / 2) % 2 === 0 ? "A" : "B";
      if (upper) return { name: `Góra ${variant}`, slots: variant === "A" ? UPPER : UPPER_B };
      return { name: `Dół ${variant}`, slots: variant === "A" ? LOWER : LOWER_B };
    });
  }
  if (s === "ppl") {
    const cycle: SessionTemplate[] = [
      { name: "Push", slots: PUSH },
      { name: "Pull", slots: PULL },
      { name: "Legs", slots: LEGS },
    ];
    const out = Array.from({ length: Math.min(d, 6) }, (_, i) => {
      const t = cycle[i % 3]!;
      return { name: d > 3 ? `${t.name} ${i < 3 ? "A" : "B"}` : t.name, slots: t.slots };
    });
    if (d === 7) out.push({ name: "Słabe punkty", slots: SPLIT_DAYS["Słabe punkty"]! });
    return out;
  }
  const names = SPLIT_LAYOUT[d] ?? SPLIT_LAYOUT[5]!;
  return names.map((n) => ({ name: n, slots: SPLIT_DAYS[n]! }));
}

const SMALL_MUSCLES: Muscle[] = ["calves", "abs", "erectors", "frontDelt", "rearDelt"];

/** Exercise slots for a hand-picked day: fewer muscles = more exercises per muscle. */
export function slotsForMuscles(muscles: Muscle[]): Muscle[] {
  const unique = Array.from(new Set(muscles));
  const per = unique.length <= 1 ? 4 : unique.length === 2 ? 3 : unique.length <= 4 ? 2 : 1;
  const big = unique.filter((m) => !SMALL_MUSCLES.includes(m));
  const small = unique.filter((m) => SMALL_MUSCLES.includes(m));
  const out: Muscle[] = [];
  for (const m of big) for (let i = 0; i < per; i++) out.push(m);
  for (const m of small) for (let i = 0; i < Math.max(1, per - 1); i++) out.push(m);
  return out;
}

export function autoDayName(muscles: Muscle[]): string {
  const unique = Array.from(new Set(muscles));
  if (unique.length === 0) return "Brak partii";
  if (unique.length > 4) return "Full Body";
  return unique.map((m) => MUSCLE_LABEL[m]).join(" + ");
}

export type ScheduleSource = "custom" | "preset" | "auto";

/** The weekly layout the plan uses: hand-picked > bodybuilder preset > methodology template. */
export function effectiveSchedule(client: Client): { days: ScheduleDay[]; source: ScheduleSource } {
  if (client.customSchedule && client.customSchedule.length > 0)
    return { days: [...client.customSchedule].sort((a, b) => a.weekday - b.weekday), source: "custom" };
  const method = METHOD_BY_ID[resolveMethod(client)];
  if (method.preset) return { days: method.preset.map(({ weekday, name, muscles }) => ({ weekday, name, muscles: [...muscles] })), source: "preset" };
  const days = clampDays(client.days);
  const weekdays = DAY_LAYOUT[days]!;
  const templates = sessionTemplates(method.structure(days), days);
  return {
    days: templates.map((t, i) => ({
      weekday: weekdays[i] ?? i,
      name: t.name,
      muscles: Array.from(new Set(t.slots)),
      slots: t.slots,
    })),
    source: "auto",
  };
}

export interface PlanExercise {
  key: string;
  exerciseId: string;
  name: string;
  muscle: Muscle;
  compound: boolean;
  sets: number;
  reps: string;
  rir: string;
  rest: string;
  note?: string;
  /** Exercise kept although it carries risk for these injuries (no safe alternative). */
  risky?: Injury[];
  /** A safer alternative replaced this exercise because of these injuries. */
  replaced?: { name: string; injuries: Injury[] };
}

export interface PlanSession {
  weekday: number;
  dayLabel: string;
  name: string;
  exercises: PlanExercise[];
  finisher?: string;
}

export type VolumeStatus = "below-mv" | "maintenance" | "productive" | "high" | "over-mrv";

export interface VolumeRow {
  muscle: Muscle;
  direct: number;
  indirect: number;
  total: number;
  target: number;
  frequency: number;
  landmark: Landmark;
  status: VolumeStatus;
}

export interface Plan {
  method: Methodology;
  structure: Structure;
  progression: ProgressionModel;
  progressionRule: string;
  scheduleSource: ScheduleSource;
  week: MesoWeek;
  rir: string;
  sessions: PlanSession[];
  restDays: string[];
  volume: VolumeRow[];
  warnings: string[];
}

function hasEquipment(e: Exercise, eq: Equipment[]) {
  return e.needs.every((n) => eq.includes(n));
}

function rotate<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return arr;
  const k = n % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

interface Pick {
  exercise: Exercise;
  risky?: Injury[];
  replaced?: { name: string; injuries: Injury[] };
}

export function pickExercise(
  muscle: Muscle,
  opts: { equipment: Equipment[]; injuries: Injury[]; preferCompound: boolean; exclude: Set<string>; rotation: number },
): Pick | null {
  const available = EXERCISES.filter(
    (e) => e.primary === muscle && hasEquipment(e, opts.equipment) && !opts.exclude.has(e.id),
  );
  if (available.length === 0) return null;
  const compounds = available.filter((e) => e.compound);
  const isolations = available.filter((e) => !e.compound);
  const ordered = opts.preferCompound
    ? [...rotate(compounds, opts.rotation), ...rotate(isolations, opts.rotation)]
    : [...rotate(isolations, opts.rotation), ...rotate(compounds, opts.rotation)];
  const riskOf = (e: Exercise) => e.risk.filter((r) => opts.injuries.includes(r));
  const preferred = ordered[0]!;
  const preferredRisk = riskOf(preferred);
  if (preferredRisk.length === 0) return { exercise: preferred };
  const safe = ordered.find((e) => riskOf(e).length === 0);
  if (safe) return { exercise: safe, replaced: { name: preferred.name, injuries: preferredRisk } };
  return { exercise: preferred, risky: preferredRisk };
}

/** Splits `total` into `n` near-equal integer parts, larger parts first. */
export function distribute(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const rest = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rest ? 1 : 0));
}

/** Direct (1.0) and fractional indirect sets per muscle for a list of exercises. */
export function computeVolume(
  items: { exerciseId: string; sets: number }[],
): Record<Muscle, { direct: number; indirect: number }> {
  const out = Object.fromEntries(ALL_MUSCLES.map((m) => [m, { direct: 0, indirect: 0 }])) as Record<
    Muscle,
    { direct: number; indirect: number }
  >;
  for (const it of items) {
    const e = EXERCISES.find((x) => x.id === it.exerciseId);
    if (!e) continue;
    out[e.primary].direct += it.sets;
    for (const [m, f] of Object.entries(e.secondary) as [Muscle, number][]) {
      out[m].indirect += it.sets * f;
    }
  }
  return out;
}

export function volumeStatus(total: number, l: Landmark): VolumeStatus {
  if (total < l.mv) return "below-mv";
  if (total < l.mev) return "maintenance";
  if (total <= l.mav) return "productive";
  if (total <= l.mrv) return "high";
  return "over-mrv";
}

const HIT: string[] = ["heavy-duty", "blood-guts", "rest-pause"];
const COMPOUND_FIRST: Muscle[] = ["chest", "back", "frontDelt", "quads", "hamstrings", "glutes"];

export function buildPlan(client: Client): Plan {
  const methodId = resolveMethod(client);
  const method = METHOD_BY_ID[methodId];
  const schedule = effectiveSchedule(client);
  const days = schedule.days.length;
  const structure = method.preset || schedule.source === "custom" ? "split" : method.structure(clampDays(client.days));
  const week = client.mesoWeek;
  const progression = PROGRESSION_BY_ID[client.progression] ?? PROGRESSION_BY_ID.volume;
  const isHit = HIT.includes(methodId);
  const rir = isHit && week !== "DELOAD" ? "0 (załamanie)" : RIR_BY_WEEK[week];
  const reps = progression.repsByWeek?.[week] ?? method.scheme.reps;
  const warnings: string[] = [];
  const equipment: Equipment[] = client.equipment.length ? client.equipment : ["bodyweight"];
  const target = (m: Muscle) => progressionTarget(client.landmarks[m], week, progression.id);

  // 1) Pick exercises for every slot.
  const missing = new Set<Muscle>();
  const sessions: PlanSession[] = schedule.days.map((d, i) => {
    const used = new Set<string>();
    const seen = new Set<Muscle>();
    const exercises: PlanExercise[] = [];
    const slots = d.slots ?? slotsForMuscles(d.muscles);
    slots.forEach((muscle, slotIdx) => {
      const first = !seen.has(muscle);
      seen.add(muscle);
      const pick = pickExercise(muscle, {
        equipment,
        injuries: client.injuries,
        preferCompound: first && COMPOUND_FIRST.includes(muscle),
        exclude: used,
        rotation: i + (first ? 0 : 1),
      });
      if (!pick) {
        missing.add(muscle);
        return;
      }
      used.add(pick.exercise.id);
      exercises.push({
        key: `${i}-${slotIdx}-${pick.exercise.id}`,
        exerciseId: pick.exercise.id,
        name: pick.exercise.name,
        muscle,
        compound: pick.exercise.compound,
        sets: 0,
        reps,
        rir,
        rest: method.scheme.rest,
        ...(pick.risky ? { risky: pick.risky } : {}),
        ...(pick.replaced ? { replaced: pick.replaced } : {}),
      });
    });
    return {
      weekday: d.weekday,
      dayLabel: DAY_LABELS[d.weekday] ?? "",
      name: d.name.trim() || autoDayName(d.muscles),
      exercises,
    };
  });

  if (schedule.source === "custom") {
    const covered = new Set(schedule.days.flatMap((d) => d.muscles));
    const uncovered = (["chest", "back", "quads", "hamstrings", "sideDelt"] as Muscle[]).filter((m) => !covered.has(m));
    if (uncovered.length)
      warnings.push(`W tygodniu brakuje partii: ${uncovered.map((m) => MUSCLE_LABEL[m]).join(", ")}.`);
    const byDay = new Map(schedule.days.map((d) => [d.weekday, new Set(d.muscles)]));
    const backToBack = new Set<Muscle>();
    for (const d of schedule.days) {
      const next = byDay.get((d.weekday + 1) % 7);
      if (!next) continue;
      for (const m of d.muscles) if (next.has(m) && !SMALL_MUSCLES.includes(m)) backToBack.add(m);
    }
    if (backToBack.size)
      warnings.push(`Dzień po dniu: ${[...backToBack].map((m) => MUSCLE_LABEL[m]).join(", ")} — zostaw min. 48 h regeneracji.`);
    for (const d of schedule.days)
      if (d.muscles.length === 0) warnings.push(`${DAY_LABELS[d.weekday]}: dzień treningowy bez wybranych partii.`);
  }

  for (const m of missing) warnings.push(`Brak ćwiczeń na: ${MUSCLE_LABEL[m]} przy zaznaczonym sprzęcie.`);

  // 2) Allocate direct sets from landmarks, minus what compounds already deliver indirectly.
  const maxSets = method.scheme.maxSetsPerExercise ?? 6;
  const allExercises = sessions.flatMap((s) => s.exercises);
  const allocate = (muscle: Muscle, total: number) => {
    const slots = allExercises.filter((e) => e.muscle === muscle);
    const parts = distribute(Math.max(0, total), slots.length);
    slots.forEach((e, idx) => {
      e.sets = Math.min(maxSets, parts[idx] ?? 0);
    });
  };
  for (const m of ALL_MUSCLES) allocate(m, target(m));
  const firstPass = computeVolume(allExercises);
  for (const m of ALL_MUSCLES) {
    const remaining = Math.ceil(target(m) - firstPass[m].indirect);
    allocate(m, remaining);
  }

  // 3) Methodology-specific set schemes.
  for (const s of sessions) {
    const firstCompound = s.exercises.find((e) => e.compound && e.sets > 0);
    if (methodId === "gvt" && firstCompound && week !== "DELOAD") {
      firstCompound.sets = 10;
      firstCompound.reps = "10 × 10 @ ~60% 1RM";
      firstCompound.rest = "60–90 s";
    }
    if (methodId === "531" && firstCompound) {
      firstCompound.sets = 3;
      firstCompound.reps = week === "DELOAD" ? "5 × 40/50/60%" : "5/3/1 + AMRAP";
      firstCompound.rest = "3 min";
      firstCompound.note = "Bój główny — %TM wg tygodnia cyklu";
    }
    if (methodId === "fst7" && week !== "DELOAD") {
      const lastByMuscle = new Map<Muscle, PlanExercise>();
      for (const e of s.exercises) if (e.sets > 0) lastByMuscle.set(e.muscle, e);
      const big = [...lastByMuscle.values()].filter((e) => !e.compound);
      const fst = big[0];
      if (fst) {
        fst.sets = 7;
        fst.reps = "8–12 (FST-7)";
        fst.rest = "30–45 s";
        fst.note = "Rozciąganie / spinanie powięzi między seriami";
      }
    }
    if (method.scheme.note && isHit) {
      for (const e of s.exercises) if (e.sets > 0) e.note = method.scheme.note;
    }
    if (methodId === "hiit") s.finisher = "Interwały HIIT: 8–10 × 20 s pracy / 40 s przerwy (rower, ergometr, sanki)";
    s.exercises = s.exercises.filter((e) => e.sets > 0);
  }

  // 4) Volume summary.
  const final = computeVolume(sessions.flatMap((s) => s.exercises));
  const volume: VolumeRow[] = ALL_MUSCLES.map((m) => {
    const l = client.landmarks[m];
    const direct = final[m].direct;
    const indirect = Math.round(final[m].indirect * 100) / 100;
    const total = Math.round((direct + indirect) * 100) / 100;
    const frequency = sessions.filter((s) => s.exercises.some((e) => e.muscle === m)).length;
    return {
      muscle: m,
      direct,
      indirect,
      total,
      target: target(m),
      frequency,
      landmark: l,
      status: volumeStatus(total, l),
    };
  });

  for (const inj of client.injuries) {
    const swapped = sessions.flatMap((s) => s.exercises).filter((e) => e.replaced?.injuries.includes(inj)).length;
    const risky = sessions.flatMap((s) => s.exercises).filter((e) => e.risky?.includes(inj)).length;
    if (risky > 0)
      warnings.push(`${INJURY_LABEL[inj]}: ${risky} ćw. bez bezpiecznej alternatywy — ogranicz zakres i ciężar.`);
    else if (swapped > 0) warnings.push(`${INJURY_LABEL[inj]}: ${swapped} ćw. zamieniono na bezpieczniejsze.`);
  }

  const trainingDays = sessions.map((x) => x.weekday);
  const restDays = DAY_LABELS.filter((_, i) => !trainingDays.includes(i));
  if (days === 0) warnings.push("Brak dni treningowych.");
  return {
    method,
    structure,
    progression,
    progressionRule: progression.rule(rir),
    scheduleSource: schedule.source,
    week,
    rir,
    sessions,
    restDays,
    volume,
    warnings,
  };
}

export const DEFAULT_LANDMARKS: Record<Muscle, Landmark> = {
  chest: { mv: 6, mev: 8, mav: 16, mrv: 22, freq: 2 },
  back: { mv: 8, mev: 10, mav: 18, mrv: 25, freq: 2 },
  frontDelt: { mv: 0, mev: 2, mav: 8, mrv: 12, freq: 2 },
  sideDelt: { mv: 6, mev: 8, mav: 18, mrv: 26, freq: 2 },
  rearDelt: { mv: 4, mev: 6, mav: 14, mrv: 22, freq: 2 },
  biceps: { mv: 4, mev: 8, mav: 16, mrv: 22, freq: 2 },
  triceps: { mv: 4, mev: 6, mav: 12, mrv: 18, freq: 2 },
  quads: { mv: 6, mev: 8, mav: 15, mrv: 20, freq: 2 },
  hamstrings: { mv: 4, mev: 6, mav: 12, mrv: 18, freq: 2 },
  glutes: { mv: 0, mev: 4, mav: 10, mrv: 16, freq: 2 },
  erectors: { mv: 0, mev: 2, mav: 6, mrv: 10, freq: 1 },
  calves: { mv: 6, mev: 8, mav: 14, mrv: 20, freq: 2 },
  abs: { mv: 0, mev: 6, mav: 16, mrv: 25, freq: 2 },
};
