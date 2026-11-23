import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/physique/AppShell";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ALL_MUSCLES, MESO_WEEKS, MUSCLE_LABEL } from "@/lib/physique/labels";
import { buildPlan, DEFAULT_LANDMARKS, RIR_BY_WEEK, type VolumeStatus } from "@/lib/physique/plan";
import { PROGRESSION_BY_ID, PROGRESSIONS, progressionTarget } from "@/lib/physique/progression";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePhysique } from "@/lib/physique/store";
import type { Landmark, MesoWeek, Muscle, Progression } from "@/lib/physique/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/objetosc")({
  head: () => ({
    meta: [
      { title: "Landmarki objętości · PhysiqueOS" },
      { name: "description", content: "MV, MEV, MAV, MRV, częstotliwość i progresja mezocyklu T1–T4 + deload z liczeniem objętości frakcyjnej." },
      { property: "og:title", content: "Landmarki objętości · PhysiqueOS" },
      { property: "og:description", content: "Suwaki landmarków objętości i liczenie serii bezpośrednich oraz pośrednich." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VolumePage,
});

const STATUS: Record<VolumeStatus, { label: string; variant: "danger" | "muted" | "success" | "warning" | "soft" }> = {
  "below-mv": { label: "Poniżej MV", variant: "danger" },
  maintenance: { label: "Utrzymanie", variant: "muted" },
  productive: { label: "Produktywna", variant: "success" },
  high: { label: "Wysoka", variant: "warning" },
  "over-mrv": { label: "Powyżej MRV", variant: "danger" },
};

const SCALE_MAX = 30;
const KEYS = ["mv", "mev", "mav", "mrv"] as const;
type LKey = (typeof KEYS)[number];
const KEY_LABEL: Record<LKey, string> = { mv: "MV", mev: "MEV", mav: "MAV", mrv: "MRV" };
const KEY_HINT: Record<LKey, string> = {
  mv: "utrzymanie / deload",
  mev: "start mezocyklu (T1)",
  mav: "szczyt produktywny (T3)",
  mrv: "granica regeneracji (T4)",
};

/** Keeps MV ≤ MEV ≤ MAV ≤ MRV when one landmark moves. */
function withLandmark(l: Landmark, key: LKey, value: number): Landmark {
  const next = { ...l, [key]: value };
  const idx = KEYS.indexOf(key);
  for (let i = idx - 1; i >= 0; i--) next[KEYS[i]!] = Math.min(next[KEYS[i]!], next[KEYS[i + 1]!]);
  for (let i = idx + 1; i < KEYS.length; i++) next[KEYS[i]!] = Math.max(next[KEYS[i]!], next[KEYS[i - 1]!]);
  return next;
}

/** Which landmarks set this week's target for the chosen progression. */
function drivers(week: MesoWeek, progression: Progression): LKey[] {
  const ramp = PROGRESSION_BY_ID[progression]?.rampsVolume ?? true;
  if (week === "DELOAD") return ["mv", "mev"];
  if (!ramp) return ["mev", "mav"];
  return { T1: ["mev"], T2: ["mev", "mav"], T3: ["mav"], T4: ["mav", "mrv"] }[week] as LKey[];
}

function VolumePage() {
  const { active, updateClient } = usePhysique();
  const plan = buildPlan(active);
  const setLandmark = (m: Muscle, patch: Partial<Landmark>) =>
    updateClient(active.id, { landmarks: { ...active.landmarks, [m]: { ...active.landmarks[m], ...patch } } });
  const setKey = (m: Muscle, key: LKey, value: number) =>
    updateClient(active.id, { landmarks: { ...active.landmarks, [m]: withLandmark(active.landmarks[m], key, value) } });
  const progression = active.progression ?? "volume";
  const driving = drivers(active.mesoWeek, progression);

  const totals = plan.volume.reduce(
    (a, v) => ({ direct: a.direct + v.direct, indirect: a.indirect + v.indirect }),
    { direct: 0, indirect: 0 },
  );

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow={`Objętość · ${active.name}`}
        title="Landmarki objętości"
        description="Serie robocze na tydzień. Seria bezpośrednia liczy się jako 1.0 dla głównej partii, a mięśnie pomocnicze dostają ułamkowy wkład (np. 0.5 tricepsu przy wyciskaniu)."
        actions={
          <Button
            variant="subtle"
            size="sm"
            onClick={() => updateClient(active.id, { landmarks: structuredClone(DEFAULT_LANDMARKS) })}
          >
            <RotateCcw /> Domyślne landmarki
          </Button>
        }
      />

      <Panel title="Progresja w mezocyklu" action={<span className="eyebrow">kontrola RIR</span>}>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              <span className="text-foreground">Model progresji:</span> {PROGRESSION_BY_ID[progression].short}
            </div>
            <Select value={progression} onValueChange={(v) => updateClient(active.id, { progression: v as Progression })}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-60" aria-label="Model progresji">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRESSIONS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">{plan.progressionRule}</p>
          <div className="grid grid-cols-5 gap-2">
            {MESO_WEEKS.map((w) => {
              const on = active.mesoWeek === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => updateClient(active.id, { mesoWeek: w })}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md border py-2.5 transition-colors",
                    on ? "border-primary/50 bg-primary/10 text-primary shadow-glow" : "border-border-strong text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <span className="tabular text-sm font-semibold">{w}</span>
                  <span className="tabular text-[11px]">RIR {RIR_BY_WEEK[w]}</span>
                </button>
              );
            })}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 font-normal">Partia</th>
                  {MESO_WEEKS.map((w) => (
                    <th key={w} className={cn("py-2 text-right font-normal", active.mesoWeek === w && "text-primary")}>
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ALL_MUSCLES.map((m) => (
                  <tr key={m}>
                    <td className="py-1.5">{MUSCLE_LABEL[m]}</td>
                    {MESO_WEEKS.map((w) => (
                      <td key={w} className={cn("tabular py-1.5 text-right text-muted-foreground", active.mesoWeek === w && "font-medium text-primary")}>
                        {progressionTarget(active.landmarks[m], w, progression)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <div className="eyebrow">Serie bezpośrednie</div>
          <div className="tabular mt-1 text-2xl font-semibold">{totals.direct}</div>
        </div>
        <div className="panel p-4">
          <div className="eyebrow">Wkład pośredni (frakcyjny)</div>
          <div className="tabular mt-1 text-2xl font-semibold text-highlight">{Math.round(totals.indirect * 10) / 10}</div>
        </div>
        <div className="panel p-4">
          <div className="eyebrow">Łącznie · {plan.week}</div>
          <div className="tabular mt-1 text-2xl font-semibold text-primary">{Math.round((totals.direct + totals.indirect) * 10) / 10}</div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {plan.volume.map((v) => {
          const l = v.landmark;
          const st = STATUS[v.status];
          const pct = (n: number) => `${Math.min(100, (n / SCALE_MAX) * 100)}%`;
          return (
            <div key={v.muscle} className="panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{MUSCLE_LABEL[v.muscle]}</span>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <span className="tabular text-xs text-muted-foreground">
                  cel {v.target} · {v.frequency}×/tydz.
                </span>
              </div>

              {/* direct / indirect / total bar */}
              <div className="relative mb-1 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: pct(v.direct) }} />
                <div className="absolute inset-y-0 bg-highlight/70" style={{ left: pct(v.direct), width: pct(v.indirect) }} />
              </div>
              <div className="relative mb-3 h-3">
                {(
                  [
                    ["MV", l.mv],
                    ["MEV", l.mev],
                    ["MAV", l.mav],
                    ["MRV", l.mrv],
                  ] as const
                ).map(([k, n]) => (
                  <span key={k} className="tabular absolute -translate-x-1/2 font-mono text-[9px] text-subtle" style={{ left: pct(n) }}>
                    {k}
                  </span>
                ))}
              </div>
              <div className="tabular mb-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border border-border px-2 py-1">
                  <div className="text-muted-foreground">Bezpośr.</div>
                  <div className="font-medium">{v.direct}</div>
                </div>
                <div className="rounded border border-border px-2 py-1">
                  <div className="text-muted-foreground">Pośr.</div>
                  <div className="font-medium text-highlight">{v.indirect}</div>
                </div>
                <div className="rounded border border-border px-2 py-1">
                  <div className="text-muted-foreground">Łącznie</div>
                  <div className="font-medium text-primary">{v.total}</div>
                </div>
              </div>

              <div className="space-y-3">
                {KEYS.map((k) => {
                  const isDriver = driving.includes(k);
                  return (
                    <div key={k} className="grid grid-cols-[3.25rem_1fr_2rem] items-center gap-3">
                      <span className={cn("font-mono text-[11px]", isDriver ? "text-primary" : "text-muted-foreground")} title={KEY_HINT[k]}>
                        {KEY_LABEL[k]}
                      </span>
                      <Slider
                        min={0}
                        max={SCALE_MAX}
                        step={1}
                        value={[l[k]]}
                        thumbLabels={[`${KEY_LABEL[k]} — ${MUSCLE_LABEL[v.muscle]}`]}
                        onValueChange={([val]) => setKey(v.muscle, k, val ?? 0)}
                        className={cn(!isDriver && "opacity-70")}
                      />
                      <span className={cn("tabular text-right text-sm font-medium", isDriver && "text-primary")}>{l[k]}</span>
                    </div>
                  );
                })}
                <p className="text-[11px] text-subtle">
                  Podświetlony landmark, który ustala cel w tygodniu {active.mesoWeek}: <span className="tabular text-foreground">{v.target} serii</span>.
                </p>
                <div className="grid grid-cols-[3.25rem_1fr_2rem] items-center gap-3">
                  <span className="w-[3.25rem] shrink-0 font-mono text-[11px] text-muted-foreground">FREQ</span>
                  <Slider min={1} max={4} step={1} value={[l.freq]} thumbLabels={[`Częstotliwość — ${MUSCLE_LABEL[v.muscle]}`]} onValueChange={([f]) => setLandmark(v.muscle, { freq: f ?? 1 })} />
                  <span className="tabular w-8 text-right text-sm font-medium">{l.freq}×</span>
                </div>
                {v.frequency !== l.freq && (
                  <p className="text-[11px] text-subtle">
                    Plan trafia w tę partię {v.frequency}× w tygodniu — zmień liczbę dni lub metodykę, aby zbliżyć się do {l.freq}×.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
