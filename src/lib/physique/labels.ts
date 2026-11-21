import type { Equipment, Goal, Injury, Level, MesoWeek, Muscle } from "./types";

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: "Początkujący",
  intermediate: "Średniozaawansowany",
  advanced: "Zaawansowany",
};

export const GOAL_LABEL: Record<Goal, string> = {
  cut: "Redukcja",
  bulk: "Masa",
  recomp: "Rekompozycja",
  maintain: "Utrzymanie",
  strength: "Siła / sprawność",
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: "Sztanga prosta",
  ez: "Sztanga łamana",
  dumbbells: "Hantle",
  bench: "Ławka regulowana",
  rack: "Rack / stojaki",
  cable: "Wyciąg / brama",
  pullup: "Drążek",
  dips: "Poręcze / dipy",
  "leg-machine": "Maszyna na nogi (wyprosty/ugięcia)",
  "leg-press": "Suwnica",
  kettlebell: "Kettlebells",
  bands: "Gumy / TRX",
  machines: "Maszyny siłowe",
  bodyweight: "Masa ciała",
};

export const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABEL) as Equipment[];

export const EQUIPMENT_PRESETS: { id: string; label: string; items: Equipment[] }[] = [
  {
    id: "home",
    label: "Domowa siłownia",
    items: ["barbell", "dumbbells", "bench", "rack", "pullup", "kettlebell", "bands", "bodyweight"],
  },
  { id: "full", label: "Pełna siłownia", items: ALL_EQUIPMENT },
  { id: "basic", label: "Sprzęt podstawowy", items: ["dumbbells", "bands", "pullup", "bodyweight"] },
];

export const INJURY_LABEL: Record<Injury, string> = {
  shoulder: "Bark",
  elbow: "Łokieć",
  wrist: "Nadgarstek",
  lumbar: "Odcinek lędźwiowy",
  cervical: "Odcinek szyjny",
  knee: "Kolano",
  hip: "Biodro",
  ankle: "Kostka",
};

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "Klatka",
  back: "Plecy",
  frontDelt: "Przedni bark",
  sideDelt: "Boczny bark",
  rearDelt: "Tylny bark",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Czworogłowe",
  hamstrings: "Dwugłowe uda",
  glutes: "Pośladki",
  erectors: "Prostowniki",
  calves: "Łydki",
  abs: "Brzuch",
};

export const ALL_MUSCLES = Object.keys(MUSCLE_LABEL) as Muscle[];

export const MESO_WEEKS: MesoWeek[] = ["T1", "T2", "T3", "T4", "DELOAD"];

export const PAL_OPTIONS = [
  { value: 1.2, label: "1.2 — siedzący" },
  { value: 1.375, label: "1.375 — lekka aktywność" },
  { value: 1.55, label: "1.55 — umiarkowana" },
  { value: 1.725, label: "1.725 — wysoka" },
  { value: 1.9, label: "1.9 — bardzo wysoka" },
];
