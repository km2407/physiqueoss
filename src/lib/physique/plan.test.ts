import { describe, expect, it } from "vitest";
import { buildPlan, computeVolume, DAY_LAYOUT, weekTarget, DEFAULT_LANDMARKS } from "./plan";
import { autoMethod, methodSuitability } from "./methods";
import { SAMPLE_CLIENTS, blankClient } from "./samples";
import { planPayload } from "./payload";

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
