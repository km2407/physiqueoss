import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/physique/AppShell";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ALL_MUSCLES, MESO_WEEKS, MUSCLE_LABEL } from "@/lib/physique/labels";
import { buildPlan, DEFAULT_LANDMARKS, RIR_BY_WEEK, type VolumeStatus } from "@/lib/physique/plan";
import { baseSets, PROGRESSION_BY_ID, PROGRESSIONS, progressionTarget } from "@/lib/physique/progression";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePhysique } from "@/lib/physique/store";
import type { Muscle, Progression } from "@/lib/physique/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export const Route = createFileRoute("/objetosc")({
  head: () => ({
    meta: [
      { title: "Landmarki objętości · PhysiqueOS" },
      { name: "description", content: "Jeden suwak objętości na partię, progresja mezocyklu T1–T4 + deload i liczenie objętości frakcyjnej." },
      { property: "og:title", content: "Landmarki objętości · PhysiqueOS" },
      { property: "og:description", content: "Ustaw serie w tygodniu dla każdej partii i zobacz serie bezpośrednie oraz pośrednie." },
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

function VolumePage() {
  const { active, updateClient } = usePhysique();
  const plan = buildPlan(active);
  const setSets = (m: Muscle, sets: number) =>
    updateClient(active.id, { landmarks: { ...active.landmarks, [m]: { ...active.landmarks[m], sets } } });
  const progression = active.progression ?? "volume";

  const totals = plan.volume.reduce(
    (a, v) => ({ direct: a.direct + v.direct, indirect: a.indirect + v.indirect }),
    { direct: 0, indirect: 0 },
  );

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow={`Objętość · ${active.name}`}
        title="Landmarki objętości"
        description="Jednym suwakiem ustawiasz, ile serii w tygodniu dostaje partia. Plan sam rozkłada je na dni i ćwiczenia (maks. 4 serie na ćwiczenie). Kreski MV/MEV/MAV/MRV to tylko punkty odniesienia."
        actions={
          <Button
            variant="subtle"
            size="sm"
            onClick={() => updateClient(active.id, { landmarks: structuredClone(DEFAULT_LANDMARKS) })}
          >
            <RotateCcw /> Domyślna objętość
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
          <p className="border-2 border-primary/40 bg-primary/5 px-3 py-2 text-xs text-primary">{plan.progressionRule}</p>
          <div className="grid grid-cols-5 gap-2">
            {MESO_WEEKS.map((w) => {
              const on = active.mesoWeek === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => updateClient(active.id, { mesoWeek: w })}
                  className={cn(
                    "flex flex-col items-center gap-0.5 border-2 py-2.5 transition-colors",
                    on ? "border-frame bg-primary text-primary-foreground shadow-glow" : "border-frame bg-secondary text-muted-foreground hover:text-foreground",
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
          <div className="tabular mt-1 font-display text-3xl font-bold">{totals.direct}</div>
        </div>
        <div className="panel p-4">
          <div className="eyebrow">Wkład pośredni (frakcyjny)</div>
          <div className="tabular mt-1 font-display text-3xl font-bold text-highlight">{Math.round(totals.indirect * 10) / 10}</div>
        </div>
        <div className="panel p-4">
          <div className="eyebrow">Łącznie · {plan.week}</div>
          <div className="tabular mt-1 font-display text-3xl font-bold text-primary">{Math.round((totals.direct + totals.indirect) * 10) / 10}</div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {plan.volume.map((v) => {
          const l = v.landmark;
          const st = STATUS[v.status];
          const pct = (n: number) => `${Math.min(100, (n / SCALE_MAX) * 100)}%`;
          const base = baseSets(l);
          return (
            <div key={v.muscle} className="panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{MUSCLE_LABEL[v.muscle]}</span>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <span className="tabular text-xs text-muted-foreground">{v.frequency}×/tydz.</span>
              </div>

              <div className="mb-2 flex items-end justify-between">
                <span className="eyebrow">Serie w tygodniu</span>
                <span className="tabular font-display text-4xl font-bold leading-none text-primary">{base}</span>
              </div>
              <Slider
                min={0}
                max={SCALE_MAX}
                step={1}
                value={[base]}
                thumbLabels={[`Objętość — ${MUSCLE_LABEL[v.muscle]}`]}
                onValueChange={([val]) => setSets(v.muscle, val ?? 0)}
              />
              {/* reference landmarks: productive zone MEV–MAV, high zone MAV–MRV */}
              <div className="relative mt-2 h-1.5 bg-secondary">
                <div className="absolute inset-y-0 bg-success/40" style={{ left: pct(l.mev), width: `calc(${pct(l.mav)} - ${pct(l.mev)})` }} />
                <div className="absolute inset-y-0 bg-warning/30" style={{ left: pct(l.mav), width: `calc(${pct(l.mrv)} - ${pct(l.mav)})` }} />
              </div>
              <div className="relative mb-3 h-4">
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
              {v.target !== base && (
                <p className="mb-3 text-[11px] text-muted-foreground">
                  W tygodniu {active.mesoWeek}: <span className="tabular font-medium text-foreground">{v.target} serii</span>
                  {active.mesoWeek === "DELOAD" ? " (deload)" : " (progresja)"}.
                </p>
              )}
              <div className="tabular grid grid-cols-3 gap-2 text-xs">
                <div className="border-2 border-frame bg-secondary px-2 py-1">
                  <div className="text-muted-foreground">Bezpośr.</div>
                  <div className="font-medium">{v.direct}</div>
                </div>
                <div className="border-2 border-frame bg-secondary px-2 py-1">
                  <div className="text-muted-foreground">Pośr.</div>
                  <div className="font-medium text-highlight">{v.indirect}</div>
                </div>
                <div className="border-2 border-frame bg-secondary px-2 py-1">
                  <div className="text-muted-foreground">Łącznie</div>
                  <div className="font-medium text-primary">{v.total}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
