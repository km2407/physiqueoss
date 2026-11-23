import { describe, expect, it } from "vitest";
import { buildPlan, computeVolume, DAY_LAYOUT, weekTarget, DEFAULT_LANDMARKS } from "./plan";
import { autoMethod, methodSuitability } from "./methods";
import { SAMPLE_CLIENTS, blankClient } from "./samples";
import { planPayload } from "./payload";
import { progressionTarget } from "./progression";

const base = { weight: 80, height: 180, injuries: [] as never[], goal: "recomp" as const };

describe("training days", () => {
  it("supports every option from 1 to 7 days per week", () => {
    for (let d = 1; d <= 7; d++) {
      const c = { ...blankClient("x"), days: d };
      expect(buildPlan(c).sessions).toHaveLength(d);
      expect(DAY_LAYOUT[d]).toHaveLength(d);
    }
  });
});

describe("methodology rules", () => {
  it("Heavy Duty is not recommended for beginners or intermediates", () => {
    expect(methodSuitability("heavy-duty", { ...base, level: "beginner", days: 3 }).ok).toBe(false);
    expect(methodSuitability("heavy-duty", { ...base, level: "intermediate", days: 3 }).ok).toBe(false);
    expect(methodSuitability("heavy-duty", { ...base, level: "advanced", days: 3 }).ok).toBe(true);
  });
  it("Upper/Lower is not recommended at 2 days per week", () => {
    expect(methodSuitability("upper-lower", { ...base, level: "intermediate", days: 2 }).ok).toBe(false);
    expect(methodSuitability("upper-lower", { ...base, level: "intermediate", days: 4 }).ok).toBe(true);
  });
  it("auto mode picks FBW for 1–2 days", () => {
    expect(autoMethod({ level: "advanced", days: 2, goal: "bulk" })).toBe("fbw");
    expect(autoMethod({ level: "beginner", days: 1, goal: "cut" })).toBe("fbw");
  });
});

describe("fractional volume", () => {
  it("bench press counts 1.0 for chest and 0.5 for triceps and front delt", () => {
    const v = computeVolume([{ exerciseId: "bench-press", sets: 4 }]);
    expect(v.chest.direct).toBe(4);
    expect(v.triceps.indirect).toBe(2);
    expect(v.frontDelt.indirect).toBe(2);
    expect(v.triceps.direct).toBe(0);
  });
  it("rows give back 1.0 and fractional biceps and rear delt", () => {
    const v = computeVolume([{ exerciseId: "cable-row", sets: 3 }]);
    expect(v.back.direct).toBe(3);
    expect(v.biceps.indirect).toBe(1.5);
    expect(v.rearDelt.indirect).toBe(1.5);
  });
});

describe("mesocycle", () => {
  it("deload drops below MEV and T3 hits MAV", () => {
    const l = DEFAULT_LANDMARKS.chest;
    expect(weekTarget(l, "T1")).toBe(l.mev);
    expect(weekTarget(l, "T3")).toBe(l.mav);
    expect(weekTarget(l, "DELOAD")).toBeLessThan(l.mev);
  });
});

describe("injuries and equipment", () => {
  it("shoulder injury swaps out risky presses in Marek's plan", () => {
    const plan = buildPlan(SAMPLE_CLIENTS[0]!);
    const names = plan.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId));
    expect(names).not.toContain("bench-press");
    expect(names).not.toContain("ohp");
  });
  it("only uses exercises available with Ola's equipment", () => {
    const plan = buildPlan(SAMPLE_CLIENTS[1]!);
    const ids = plan.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId));
    expect(ids).not.toContain("back-squat");
    expect(ids).not.toContain("lat-pulldown");
  });
});

describe("wording", () => {
  it("never uses the word 'wygenerowany' in the plan title", () => {
    const p = planPayload(SAMPLE_CLIENTS[0]!);
    expect(p.title).toContain("stworzony");
    expect(JSON.stringify(p).toLowerCase()).not.toContain("wygenerowan");
  });
});

describe("custom day layout", () => {
  it("swaps Wednesday legs for shoulders when picked by hand", () => {
    const c = {
      ...blankClient("x"),
      level: "intermediate" as const,
      customSchedule: [
        { weekday: 0, name: "", muscles: ["chest" as const, "triceps" as const] },
        { weekday: 2, name: "Barki", muscles: ["sideDelt" as const, "rearDelt" as const, "frontDelt" as const] },
        { weekday: 4, name: "", muscles: ["back" as const, "biceps" as const] },
      ],
    };
    const plan = buildPlan(c);
    const wed = plan.sessions.find((s) => s.weekday === 2)!;
    expect(wed.name).toBe("Barki");
    expect(wed.exercises.every((e) => ["sideDelt", "rearDelt", "frontDelt"].includes(e.muscle))).toBe(true);
    expect(plan.sessions).toHaveLength(3);
  });
});

describe("bodybuilder splits", () => {
  it("Arnold split uses 6 fixed days with chest+back on Monday", () => {
    const plan = buildPlan({ ...blankClient("x"), method: "arnold" });
    expect(plan.sessions).toHaveLength(6);
    expect(plan.sessions[0]!.name).toBe("Klatka + Plecy");
  });
  it("Tom Platz split has two leg days", () => {
    const plan = buildPlan({ ...blankClient("x"), method: "platz" });
    expect(plan.sessions.filter((s) => s.name.startsWith("Nogi")).length).toBeGreaterThanOrEqual(2);
  });
});

describe("progression models", () => {
  it("double progression keeps weekly sets equal in T1 and T3", () => {
    const l = DEFAULT_LANDMARKS.chest;
    expect(progressionTarget(l, "T1", "double")).toBe(progressionTarget(l, "T3", "double"));
  });
  it("volume progression ramps from MEV in T1 to MAV in T3", () => {
    const l = DEFAULT_LANDMARKS.chest;
    expect(progressionTarget(l, "T1", "volume")).toBe(l.mev);
    expect(progressionTarget(l, "T3", "volume")).toBe(l.mav);
  });
  it("raising MEV raises chest sets in T1", () => {
    const c = { ...blankClient("x"), progression: "volume" as const };
    const before = buildPlan(c).volume.find((v) => v.muscle === "chest")!.target;
    const c2 = { ...c, landmarks: { ...c.landmarks, chest: { ...c.landmarks.chest, mev: 12 } } };
    const after = buildPlan(c2).volume.find((v) => v.muscle === "chest")!.target;
    expect(after).toBe(12);
    expect(after).toBeGreaterThan(before);
  });
});
