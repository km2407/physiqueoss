export type Gender = "M" | "K";
export type Level = "beginner" | "intermediate" | "advanced";
export type Goal = "cut" | "bulk" | "recomp" | "maintain" | "strength";
export type MethodId =
  | "heavy-duty"
  | "blood-guts"
  | "hiit"
  | "gvt"
  | "fst7"
  | "rest-pause"
  | "531"
  | "fbw"
  | "upper-lower"
  | "ppl"
  | "split"
  | "linear-rir";
export type MethodChoice = MethodId | "auto";

export type Equipment =
  | "barbell"
  | "ez"
  | "dumbbells"
  | "bench"
  | "rack"
  | "cable"
  | "pullup"
  | "dips"
  | "leg-machine"
  | "leg-press"
  | "kettlebell"
  | "bands"
  | "machines"
  | "bodyweight";

export type Injury =
  | "shoulder"
  | "elbow"
  | "wrist"
  | "lumbar"
  | "cervical"
  | "knee"
  | "hip"
  | "ankle";

export type Muscle =
  | "chest"
  | "back"
  | "frontDelt"
  | "sideDelt"
  | "rearDelt"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "erectors"
  | "calves"
  | "abs";

export type MesoWeek = "T1" | "T2" | "T3" | "T4" | "DELOAD";

export interface Landmark {
  mv: number;
  mev: number;
  mav: number;
  mrv: number;
  /** Sessions per week hitting this muscle (target). */
  freq: number;
}

export interface CheckIn {
  id: string;
  date: string; // ISO yyyy-mm-dd
  weight: number;
  waist?: number;
  note?: string;
}

export interface Client {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  level: Level;
  goal: Goal;
  pal: number;
  days: number;
  method: MethodChoice;
  equipment: Equipment[];
  injuries: Injury[];
  injuryNotes: string;
  landmarks: Record<Muscle, Landmark>;
  mesoWeek: MesoWeek;
  checkins: CheckIn[];
  status: "active" | "paused";
  planCreatedAt?: string;
  /** Manual calorie correction from auto-regulation. */
  kcalOffset?: number;
}

export interface WebhookSettings {
  url: string;
  secret: string;
  enabled: boolean;
  planGenerated: boolean;
  checkinSubmitted: boolean;
}

export interface WebhookLogEntry {
  id: string;
  at: string;
  event: string;
  ok: boolean;
  status: number | null;
  durationMs: number;
  error?: string;
  clientName?: string;
}
