import { energy } from "./calc";
import { EQUIPMENT_LABEL, GOAL_LABEL, INJURY_LABEL, LEVEL_LABEL, MUSCLE_LABEL } from "./labels";
import { buildPlan } from "./plan";
import type { CheckIn, Client } from "./types";

export type WebhookEvent = "plan.generated" | "checkin.submitted" | "test";

function clientSummary(c: Client) {
  return {
    id: c.id,
    name: c.name,
    gender: c.gender,
    age: c.age,
    heightCm: c.height,
    weightKg: c.weight,
    targetWeightKg: c.targetWeight,
    level: LEVEL_LABEL[c.level],
    goal: GOAL_LABEL[c.goal],
    pal: c.pal,
  };
}

export function planPayload(c: Client, at = new Date().toISOString()) {
  const plan = buildPlan(c);
  const e = energy(c);
  return {
    event: "plan.generated",
    sentAt: at,
    source: "PhysiqueOS",
    title: `Plan treningowy stworzony w PhysiqueOS dla: ${c.name}`,
    client: clientSummary(c),
    plan: {
      methodology: plan.method.name,
      daysPerWeek: plan.sessions.length,
      mesocycleWeek: plan.week,
      rir: plan.rir,
      equipment: c.equipment.map((x) => EQUIPMENT_LABEL[x]),
      injuries: c.injuries.map((x) => INJURY_LABEL[x]),
      sessions: plan.sessions.map((s) => ({
        day: s.dayLabel,
        name: s.name,
        exercises: s.exercises.map((x) => ({
          name: x.name,
          muscle: MUSCLE_LABEL[x.muscle],
          sets: x.sets,
          reps: x.reps,
          rir: x.rir,
          rest: x.rest,
        })),
        ...(s.finisher ? { finisher: s.finisher } : {}),
      })),
      weeklyVolume: plan.volume.map((v) => ({
        muscle: MUSCLE_LABEL[v.muscle],
        direct: v.direct,
        indirect: v.indirect,
        total: v.total,
      })),
    },
    nutrition: { kcal: e.target, proteinG: e.protein, fatG: e.fat, carbsG: e.carbs },
  };
}

export function checkinPayload(c: Client, ci?: CheckIn, at = new Date().toISOString()) {
  const last = ci ?? [...c.checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
  return {
    event: "checkin.submitted",
    sentAt: at,
    source: "PhysiqueOS",
    client: clientSummary(c),
    checkin: last ?? null,
  };
}

export function testPayload(at = new Date().toISOString()) {
  return { event: "test", sentAt: at, source: "PhysiqueOS", message: "Test połączenia z PhysiqueOS" };
}
