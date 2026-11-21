import type { Equipment, Injury, Muscle } from "./types";

export interface Exercise {
  id: string;
  name: string;
  primary: Muscle;
  /** Fractional contribution to other muscles (primary always counts 1.0). */
  secondary: Partial<Record<Muscle, number>>;
  needs: Equipment[];
  compound: boolean;
  risk: Injury[];
}

const ex = (
  id: string,
  name: string,
  primary: Muscle,
  needs: Equipment[],
  compound: boolean,
  risk: Injury[] = [],
  secondary: Partial<Record<Muscle, number>> = {},
): Exercise => ({ id, name, primary, needs, compound, risk, secondary });

const PRESS = { triceps: 0.5, frontDelt: 0.5 };
const ROW = { biceps: 0.5, rearDelt: 0.5 };
const VPULL = { biceps: 0.5, rearDelt: 0.25 };
const SQUAT = { glutes: 0.5, erectors: 0.25 };
const HINGE = { glutes: 0.5, erectors: 0.5 };

export const EXERCISES: Exercise[] = [
  // Klatka
  ex("bench-press", "Wyciskanie sztangi na ławce płaskiej", "chest", ["barbell", "bench", "rack"], true, ["shoulder", "wrist"], PRESS),
  ex("db-incline", "Wyciskanie hantli na ławce skośnej", "chest", ["dumbbells", "bench"], true, [], PRESS),
  ex("machine-press", "Wyciskanie na maszynie (chest press)", "chest", ["machines"], true, [], PRESS),
  ex("dips-chest", "Pompki na poręczach (pochylenie)", "chest", ["dips"], true, ["shoulder", "elbow"], PRESS),
  ex("pushup", "Pompki klasyczne", "chest", ["bodyweight"], true, ["wrist"], PRESS),
  ex("cable-fly", "Rozpiętki na bramie", "chest", ["cable"], false, [], { frontDelt: 0.25 }),
  ex("db-fly", "Rozpiętki z hantlami na ławce", "chest", ["dumbbells", "bench"], false, ["shoulder"], { frontDelt: 0.25 }),
  ex("band-fly", "Rozpiętki z gumą", "chest", ["bands"], false, [], { frontDelt: 0.25 }),
  // Plecy
  ex("pullup", "Podciąganie na drążku", "back", ["pullup"], true, ["shoulder", "elbow"], VPULL),
  ex("lat-pulldown", "Ściąganie drążka wyciągu górnego", "back", ["cable"], true, [], VPULL),
  ex("barbell-row", "Wiosłowanie sztangą w opadzie", "back", ["barbell"], true, ["lumbar"], { ...ROW, erectors: 0.25 }),
  ex("db-row", "Wiosłowanie hantlem jednorącz z podparciem", "back", ["dumbbells", "bench"], true, [], ROW),
  ex("cable-row", "Wiosłowanie na wyciągu dolnym siedząc", "back", ["cable"], true, [], ROW),
  ex("machine-row", "Wiosłowanie na maszynie z podparciem klatki", "back", ["machines"], true, [], ROW),
  ex("band-row", "Wiosłowanie gumą / TRX", "back", ["bands"], true, [], ROW),
  // Przedni bark
  ex("ohp", "Wyciskanie żołnierskie sztangą", "frontDelt", ["barbell", "rack"], true, ["shoulder", "lumbar"], { sideDelt: 0.5, triceps: 0.5 }),
  ex("db-ohp", "Wyciskanie hantli nad głowę siedząc", "frontDelt", ["dumbbells", "bench"], true, ["shoulder"], { sideDelt: 0.5, triceps: 0.5 }),
  ex("machine-ohp", "Wyciskanie nad głowę na maszynie", "frontDelt", ["machines"], true, ["shoulder"], { sideDelt: 0.5, triceps: 0.5 }),
  ex("kb-press", "Wyciskanie kettlebell jednorącz", "frontDelt", ["kettlebell"], true, ["shoulder"], { sideDelt: 0.5, triceps: 0.5 }),
  ex("pike-pushup", "Pompki w pozycji piki", "frontDelt", ["bodyweight"], true, ["shoulder", "wrist"], { triceps: 0.5 }),
  ex("db-front-raise", "Unoszenie hantli przodem do poziomu", "frontDelt", ["dumbbells"], false, []),
  ex("band-front-raise", "Unoszenie gumy przodem", "frontDelt", ["bands"], false, []),
  // Boczny bark
  ex("db-lateral", "Unoszenie hantli bokiem", "sideDelt", ["dumbbells"], false, []),
  ex("cable-lateral", "Unoszenie ramienia bokiem na wyciągu", "sideDelt", ["cable"], false, []),
  ex("machine-lateral", "Wznosy bokiem na maszynie", "sideDelt", ["machines"], false, []),
  ex("band-lateral", "Unoszenie gumy bokiem", "sideDelt", ["bands"], false, []),
  ex("upright-row", "Wiosłowanie sztangą łamaną wzdłuż tułowia", "sideDelt", ["ez"], true, ["shoulder", "wrist"], { frontDelt: 0.25 }),
  // Tylny bark
  ex("face-pull", "Face pull na wyciągu", "rearDelt", ["cable"], false, [], { back: 0.25 }),
  ex("rev-fly-db", "Odwrotne rozpiętki z hantlami w opadzie", "rearDelt", ["dumbbells"], false, [], { back: 0.25 }),
  ex("rev-pec-deck", "Odwrotne rozpiętki na maszynie", "rearDelt", ["machines"], false, [], { back: 0.25 }),
  ex("band-pull-apart", "Rozciąganie gumy przed sobą (pull-apart)", "rearDelt", ["bands"], false, [], { back: 0.25 }),
  // Biceps
  ex("barbell-curl", "Uginanie ramion ze sztangą prostą", "biceps", ["barbell"], false, ["wrist", "elbow"]),
  ex("ez-curl", "Uginanie ramion ze sztangą łamaną", "biceps", ["ez"], false, ["elbow"]),
  ex("db-curl", "Uginanie ramion z hantlami z supinacją", "biceps", ["dumbbells"], false, []),
  ex("hammer-curl", "Uginanie młotkowe z hantlami", "biceps", ["dumbbells"], false, []),
  ex("cable-curl", "Uginanie ramion na wyciągu dolnym", "biceps", ["cable"], false, []),
  ex("band-curl", "Uginanie ramion z gumą", "biceps", ["bands"], false, []),
  ex("kb-curl", "Uginanie ramion z kettlebell", "biceps", ["kettlebell"], false, ["wrist"]),
  // Triceps
  ex("close-grip", "Wyciskanie sztangi wąsko", "triceps", ["barbell", "bench"], true, ["wrist", "elbow", "shoulder"], { chest: 0.5, frontDelt: 0.25 }),
  ex("dips-tri", "Dipy na poręczach (tułów w pionie)", "triceps", ["dips"], true, ["shoulder", "elbow"], { chest: 0.5, frontDelt: 0.25 }),
  ex("pushdown", "Prostowanie ramion na wyciągu", "triceps", ["cable"], false, []),
  ex("skullcrusher", "Wyciskanie francuskie sztangą łamaną", "triceps", ["ez", "bench"], false, ["elbow"]),
  ex("oh-db-ext", "Wyprost ramion z hantlem nad głową", "triceps", ["dumbbells"], false, ["shoulder", "elbow"]),
  ex("band-pushdown", "Prostowanie ramion z gumą", "triceps", ["bands"], false, []),
  ex("bench-dips", "Pompki w podporze tyłem", "triceps", ["bodyweight"], false, ["shoulder", "wrist"]),
  // Czworogłowe
  ex("back-squat", "Przysiad ze sztangą na plecach", "quads", ["barbell", "rack"], true, ["knee", "lumbar", "hip"], SQUAT),
  ex("leg-press", "Wypychanie nogami na suwnicy", "quads", ["leg-press"], true, ["knee"], { glutes: 0.25 }),
  ex("hack-squat", "Przysiad na maszynie (hack)", "quads", ["machines"], true, ["knee"], { glutes: 0.25 }),
  ex("goblet-squat", "Przysiad goblet z hantlem", "quads", ["dumbbells"], true, ["knee"], { glutes: 0.5 }),
  ex("kb-goblet", "Przysiad goblet z kettlebell", "quads", ["kettlebell"], true, ["knee"], { glutes: 0.5 }),
  ex("bulgarian", "Przysiad bułgarski z hantlami", "quads", ["dumbbells", "bench"], true, ["knee", "ankle"], { glutes: 0.5 }),
  ex("leg-ext", "Wyprosty nóg na maszynie", "quads", ["leg-machine"], false, ["knee"]),
  ex("split-squat-bw", "Wykroki w miejscu z masą ciała", "quads", ["bodyweight"], true, ["knee"], { glutes: 0.5 }),
  ex("box-squat", "Przysiad do skrzyni w ograniczonym zakresie", "quads", ["bodyweight"], true, [], { glutes: 0.5 }),
  // Dwugłowe uda
  ex("rdl", "Rumuński martwy ciąg ze sztangą", "hamstrings", ["barbell"], true, ["lumbar"], HINGE),
  ex("db-rdl", "Rumuński martwy ciąg z hantlami", "hamstrings", ["dumbbells"], true, ["lumbar"], HINGE),
  ex("kb-swing", "Swing kettlebell", "hamstrings", ["kettlebell"], true, ["lumbar"], { glutes: 0.5, erectors: 0.25 }),
  ex("leg-curl", "Uginanie nóg na maszynie", "hamstrings", ["leg-machine"], false, []),
  ex("band-leg-curl", "Uginanie nóg z gumą leżąc", "hamstrings", ["bands"], false, []),
  ex("slider-curl", "Ślizgi nóg w mostku (slider curl)", "hamstrings", ["bodyweight"], false, [], { glutes: 0.25 }),
  // Pośladki
  ex("hip-thrust", "Hip thrust ze sztangą", "glutes", ["barbell", "bench"], true, [], { hamstrings: 0.25 }),
  ex("step-up", "Wejścia na ławkę z hantlami", "glutes", ["dumbbells", "bench"], true, ["knee"], { quads: 0.5 }),
  ex("cable-kickback", "Odwodzenie nogi w tył na wyciągu", "glutes", ["cable"], false, []),
  ex("band-abduction", "Odwodzenie bioder z gumą", "glutes", ["bands"], false, []),
  ex("glute-bridge", "Mostek biodrowy", "glutes", ["bodyweight"], false, [], { hamstrings: 0.25 }),
  // Prostowniki
  ex("good-morning", "Skłony ze sztangą (good morning)", "erectors", ["barbell", "rack"], true, ["lumbar"], { hamstrings: 0.5, glutes: 0.25 }),
  ex("hyperext", "Wyprosty tułowia na ławce rzymskiej", "erectors", ["machines"], false, ["lumbar"], { glutes: 0.25 }),
  ex("bird-dog", "Bird-dog", "erectors", ["bodyweight"], false, [], { abs: 0.25 }),
  // Łydki
  ex("machine-calf", "Wspięcia na palce na maszynie", "calves", ["machines"], false, ["ankle"]),
  ex("leg-press-calf", "Wspięcia na palce na suwnicy", "calves", ["leg-press"], false, ["ankle"]),
  ex("standing-calf", "Wspięcia na palce stojąc", "calves", ["bodyweight"], false, ["ankle"]),
  ex("seated-calf-db", "Wspięcia na palce siedząc z hantlami", "calves", ["dumbbells"], false, []),
  // Brzuch
  ex("cable-crunch", "Spięcia brzucha na wyciągu (allahy)", "abs", ["cable"], false, []),
  ex("hanging-raise", "Unoszenie nóg w zwisie", "abs", ["pullup"], false, ["shoulder"]),
  ex("dead-bug", "Dead bug", "abs", ["bodyweight"], false, []),
  ex("plank", "Deska (plank)", "abs", ["bodyweight"], false, []),
  ex("crunch", "Spięcia brzucha na macie", "abs", ["bodyweight"], false, ["cervical"]),
];
