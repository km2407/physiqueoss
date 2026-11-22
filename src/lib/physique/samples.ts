import { DEFAULT_LANDMARKS } from "./plan";
import type { Client, Landmark, Muscle } from "./types";

const cloneLandmarks = (patch: Partial<Record<Muscle, Partial<Landmark>>> = {}) =>
  Object.fromEntries(
    (Object.keys(DEFAULT_LANDMARKS) as Muscle[]).map((m) => [m, { ...DEFAULT_LANDMARKS[m], ...patch[m] }]),
  ) as Record<Muscle, Landmark>;

export function blankClient(id: string): Client {
  return {
    id,
    name: "Nowy podopieczny",
    gender: "M",
    age: 28,
    height: 178,
    weight: 78,
    targetWeight: 78,
    level: "beginner",
    goal: "recomp",
    pal: 1.55,
    days: 3,
    method: "auto",
    equipment: ["barbell", "dumbbells", "bench", "rack", "cable", "pullup", "bodyweight"],
    injuries: [],
    injuryNotes: "",
    landmarks: cloneLandmarks(),
    mesoWeek: "T1",
    progression: "double",
    checkins: [],
    status: "active",
  };
}

export const SAMPLE_CLIENTS: Client[] = [
  {
    id: "sample-marek",
    name: "Marek K.",
    gender: "M",
    age: 31,
    height: 182,
    weight: 88.4,
    targetWeight: 82,
    level: "intermediate",
    goal: "cut",
    pal: 1.55,
    days: 4,
    method: "auto",
    equipment: [
      "barbell", "ez", "dumbbells", "bench", "rack", "cable", "pullup", "dips",
      "leg-machine", "leg-press", "machines", "bodyweight",
    ],
    injuries: ["shoulder"],
    injuryNotes: "Konflikt podbarkowy prawego barku — ból przy wyciskaniu nad głowę i szerokim chwycie.",
    landmarks: cloneLandmarks({ chest: { mav: 14 }, sideDelt: { mev: 10 } }),
    mesoWeek: "T2",
    progression: "volume",
    checkins: [
      { id: "m1", date: "2026-10-03", weight: 91.2, waist: 96, note: "Start redukcji" },
      { id: "m2", date: "2026-10-17", weight: 90.1, waist: 95 },
      { id: "m3", date: "2026-10-31", weight: 89.3, waist: 94 },
      { id: "m4", date: "2026-11-14", weight: 88.4, waist: 93, note: "Bark lepiej po zmianie wyciskań" },
    ],
    status: "active",
    planCreatedAt: "2026-11-14T09:30:00.000Z",
  },
  {
    id: "sample-ola",
    name: "Ola W.",
    gender: "K",
    age: 27,
    height: 166,
    weight: 59.5,
    targetWeight: 62,
    level: "beginner",
    goal: "bulk",
    pal: 1.375,
    days: 3,
    method: "auto",
    equipment: ["dumbbells", "bench", "kettlebell", "bands", "pullup", "bodyweight"],
    injuries: ["knee"],
    injuryNotes: "Ból lewego kolana przy głębokim zgięciu (po skręceniu 2024).",
    landmarks: cloneLandmarks({ glutes: { mev: 8, mav: 16, mrv: 22 }, hamstrings: { mev: 8 } }),
    mesoWeek: "T1",
    progression: "double",
    checkins: [
      { id: "o1", date: "2026-10-10", weight: 58.6, waist: 66 },
      { id: "o2", date: "2026-10-24", weight: 58.9, waist: 66 },
      { id: "o3", date: "2026-11-07", weight: 59.3, waist: 66.5 },
      { id: "o4", date: "2026-11-21", weight: 59.5, waist: 66.5, note: "Więcej energii na treningach" },
    ],
    status: "active",
  },
];
